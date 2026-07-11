// Intégration Coinbase Commerce - Paiements en cryptomonnaie
// Supporte : Bitcoin (BTC), Ethereum (ETH), USDC, DAI, Litecoin (LTC)

const { sql } = require('@vercel/postgres');

const COINBASE_BASE_URL = 'https://api.commerce.coinbase.com';

/**
 * Crée un paiement crypto via Coinbase Commerce
 * POST /api/payments/coinbase
 * Body: { amount, currency, description, userId, name, email, redirectUrl }
 */
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const {
      amount,
      currency = 'USD',
      description,
      userId,
      name,
      email,
      redirectUrl
    } = req.body || {};

    // Validation des champs requis
    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Montant invalide' });
    }

    const apiKey = process.env.COINBASE_COMMERCE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Configuration Coinbase incomplète', details: 'COINBASE_COMMERCE_API_KEY manquante' });
    }

    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host;
    const baseUrl = `${protocol}://${host}`;

    const payload = {
      name: name || 'Paiement OmniPay',
      description: description || 'Paiement via OmniPay',
      pricing_type: 'fixed_price',
      local_price: {
        amount: String(parseFloat(amount)),
        currency: currency.toUpperCase()
      },
      redirect_url: redirectUrl || `${baseUrl}/payment-success.html`,
      cancel_url: `${baseUrl}/payment-cancel.html`,
      metadata: {
        userId: userId ? String(userId) : 'guest',
        email: email || '',
        platform: 'omnipay'
      }
    };

    const response = await fetch(`${COINBASE_BASE_URL}/charges`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CC-Api-Key': apiKey,
        'X-CC-Version': '2018-03-22'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!data.data || data.error) {
      return res.status(400).json({ error: 'Erreur Coinbase Commerce', details: data.error ? data.error.message : 'Réponse invalide' });
    }

    const charge = data.data;

    // Enregistrement de la transaction en base
    if (userId) {
      await sql`
        INSERT INTO transactions (user_id, amount, currency, description, status, gateway, gateway_ref)
        VALUES (${userId}, ${parseFloat(amount)}, ${currency.toUpperCase()}, ${description || 'Paiement Crypto'}, 'pending', 'coinbase', ${charge.code})
      `;
    }

    return res.status(200).json({
      success: true,
      gateway: 'coinbase',
      chargeCode: charge.code,
      hostedUrl: charge.hosted_url,
      expiresAt: charge.expires_at,
      addresses: charge.addresses
    });
  } catch (error) {
    console.error('[Coinbase Commerce]', error.message);
    return res.status(500).json({ error: 'Erreur Coinbase Commerce', details: error.message });
  }
};
