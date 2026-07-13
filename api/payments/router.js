// Routeur intelligent de gateway de paiement
// Sélectionne automatiquement la meilleure gateway selon le pays et la devise
// avec fallback si une gateway échoue

const { sql } = require('@vercel/postgres');

/**
 * Carte des gateways recommandées par pays (codes ISO 3166-1 alpha-2)
 * Ordre de priorité : premier = préféré, suivants = fallbacks
 */
const COUNTRY_GATEWAY_MAP = {
  // Afrique de l'Ouest francophone - PayDunya/Flutterwave
  BJ: ['flutterwave', 'paystack'],    // Bénin
  CI: ['flutterwave', 'paystack'],    // Côte d'Ivoire
  SN: ['flutterwave', 'paystack'],    // Sénégal
  ML: ['flutterwave'],                // Mali
  BF: ['flutterwave'],                // Burkina Faso
  TG: ['flutterwave', 'paystack'],    // Togo
  GN: ['flutterwave'],                // Guinée
  CM: ['flutterwave'],                // Cameroun
  CD: ['flutterwave'],                // RD Congo

  // Afrique de l'Ouest anglophone
  NG: ['paystack', 'flutterwave'],    // Nigeria
  GH: ['paystack', 'flutterwave'],    // Ghana
  SL: ['flutterwave'],                // Sierra Leone
  LR: ['flutterwave'],                // Libéria

  // Afrique de l'Est
  KE: ['paystack', 'flutterwave'],    // Kenya
  TZ: ['flutterwave'],                // Tanzanie
  UG: ['flutterwave'],                // Ouganda
  RW: ['flutterwave'],                // Rwanda
  ET: ['flutterwave'],                // Éthiopie

  // Afrique Australe
  ZA: ['paystack', 'flutterwave'],    // Afrique du Sud
  ZM: ['flutterwave'],                // Zambie
  ZW: ['flutterwave'],                // Zimbabwe

  // Reste du monde - Stripe par défaut
  US: ['stripe'],
  GB: ['stripe'],
  FR: ['stripe'],
  DE: ['stripe'],
  DEFAULT: ['binance', 'flutterwave', 'paystack', 'stripe']
};

/**
 * Carte des gateways recommandées par devise
 */
const CURRENCY_GATEWAY_MAP = {
  XOF: 'flutterwave',    // Franc CFA BCEAO (Afrique de l'Ouest)
  XAF: 'flutterwave',    // Franc CFA BEAC (Afrique Centrale)
  NGN: 'paystack',       // Naira nigérian
  GHS: 'paystack',       // Cedi ghanéen
  KES: 'paystack',       // Shilling kényan
  ZAR: 'paystack',       // Rand sud-africain
  USD: 'stripe',         // Dollar américain
  EUR: 'stripe',         // Euro
  GBP: 'stripe',         // Livre sterling
  BTC: 'binance',        // Bitcoin
  ETH: 'binance',        // Ethereum
  USDC: 'binance',       // USD Coin
  USDT: 'binance',       // Tether
  BNB: 'binance',        // Binance Coin
  DAI: 'binance'         // DAI
};

/**
 * Gateways disponibles et leur configuration
 */
const AVAILABLE_GATEWAYS = {
  binance:     { envKey: 'BINANCE_API_KEY',        endpoint: '/api/payments/binance' },
  flutterwave: { envKey: 'FLUTTERWAVE_SECRET_KEY', endpoint: '/api/payments/flutterwave' },
  paystack:    { envKey: 'PAYSTACK_SECRET_KEY',    endpoint: '/api/payments/paystack' },
  coinbase:    { envKey: 'COINBASE_COMMERCE_API_KEY', endpoint: '/api/payments/coinbase' },
  stripe:      { envKey: 'STRIPE_SECRET_KEY',      endpoint: '/api/payments/create-checkout' }
};

/**
 * Vérifie si une gateway est configurée (sa clé API est présente)
 * @param {string} gateway
 * @returns {boolean}
 */
function isGatewayAvailable(gateway) {
  if (gateway === 'binance') {
    return Boolean(process.env.BINANCE_API_KEY && process.env.BINANCE_API_SECRET);
  }

  const config = AVAILABLE_GATEWAYS[gateway];
  return config ? !!process.env[config.envKey] : false;
}

/**
 * Sélectionne la meilleure gateway disponible pour un pays/devise donné
 * @param {string} country - Code pays ISO
 * @param {string} currency - Code devise ISO
 * @param {boolean} isCrypto - True si paiement crypto demandé
 * @returns {string} Nom de la gateway sélectionnée
 */
function selectGateway(country, currency, isCrypto = false) {
  // Crypto : Binance Pay en priorité quand les clés Merchant sont configurées
  const cryptoCurrencies = ['BTC', 'ETH', 'USDC', 'USDT', 'BNB', 'DAI', 'LTC', 'BCH'];
  if (isCrypto || cryptoCurrencies.includes(currency?.toUpperCase())) {
    if (isGatewayAvailable('binance')) return 'binance';
    if (isGatewayAvailable('coinbase')) return 'coinbase';
  }

  // Priorité par devise
  const currencyKey = currency?.toUpperCase();
  if (currencyKey && CURRENCY_GATEWAY_MAP[currencyKey]) {
    const preferred = CURRENCY_GATEWAY_MAP[currencyKey];
    if (isGatewayAvailable(preferred)) return preferred;
  }

  // Priorité par pays
  const countryKey = country?.toUpperCase();
  const candidates = COUNTRY_GATEWAY_MAP[countryKey] || COUNTRY_GATEWAY_MAP.DEFAULT;
  for (const gw of candidates) {
    if (isGatewayAvailable(gw)) return gw;
  }

  // Fallback : première gateway disponible
  for (const gw of Object.keys(AVAILABLE_GATEWAYS)) {
    if (isGatewayAvailable(gw)) return gw;
  }

  return null;
}

/**
 * Journalise une tentative de routage
 */
async function logRouting(txRef, gateway, country, currency, status) {
  try {
    await sql`
      INSERT INTO gateway_logs (tx_ref, gateway, country, currency, status, created_at)
      VALUES (${txRef}, ${gateway}, ${country || ''}, ${currency || ''}, ${status}, NOW())
    `;
  } catch {
    // La table peut ne pas exister encore - on ignore silencieusement
  }
}

/**
 * Routeur principal de gateway
 * POST /api/payments/router
 * Body: { amount, currency, email, name, phone, description, userId, country, isCrypto, redirectUrl }
 */
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const {
      amount,
      currency = 'XOF',
      email,
      name,
      phone,
      description,
      userId,
      country = 'BJ',
      isCrypto = false,
      redirectUrl
    } = req.body || {};

    // Validation minimale
    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Montant invalide' });
    }
    if (!email) {
      return res.status(400).json({ error: 'Email requis' });
    }

    // Sélection de la gateway
    const selectedGateway = selectGateway(country, currency, isCrypto);

    if (!selectedGateway) {
      return res.status(503).json({
        error: 'Aucune gateway disponible',
        details: 'Toutes les gateways sont indisponibles ou non configurées'
      });
    }

    const txRef = `OMNIPAY-ROUTER-${Date.now()}`;
    await logRouting(txRef, selectedGateway, country, currency, 'routed');

    // Construction du payload normalisé à transmettre à la gateway cible
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host;
    req.body = { amount, currency, email, name, phone, description, userId, country, redirectUrl };

    // Réponse avec redirection vers la bonne gateway
    return res.status(200).json({
      success: true,
      selectedGateway,
      gatewayEndpoint: AVAILABLE_GATEWAYS[selectedGateway].endpoint,
      txRef,
      message: `Paiement routé vers ${selectedGateway}`,
      reason: `Meilleure gateway pour le pays '${country}' et la devise '${currency}'`
    });
  } catch (error) {
    console.error('[Router]', error.message);
    return res.status(500).json({ error: 'Erreur routeur', details: error.message });
  }
};
