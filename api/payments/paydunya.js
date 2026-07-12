// Intégration PayDunya - Afrique de l'Ouest francophone
// Supporte : Mobile Money, cartes et moyens de paiement disponibles via PayDunya

const crypto = require('crypto');
const { sql } = require('@vercel/postgres');

const PAYDUNYA_BASE_URLS = {
  test: 'https://app.paydunya.com/sandbox-api/v1',
  live: 'https://app.paydunya.com/api/v1'
};

function getPayDunyaConfig() {
  const mode = (process.env.PAYDUNYA_MODE || 'test').toLowerCase() === 'live' ? 'live' : 'test';
  const masterKey = process.env.PAYDUNYA_MASTER_KEY;
  const privateKey = process.env.PAYDUNYA_PRIVATE_KEY;
  const publicKey = process.env.PAYDUNYA_PUBLIC_KEY;
  const token = process.env.PAYDUNYA_TOKEN;

  const missing = [];
  if (!masterKey) missing.push('PAYDUNYA_MASTER_KEY');
  if (!privateKey) missing.push('PAYDUNYA_PRIVATE_KEY');
  if (!publicKey) missing.push('PAYDUNYA_PUBLIC_KEY');
  if (!token) missing.push('PAYDUNYA_TOKEN');

  return {
    mode,
    baseUrl: PAYDUNYA_BASE_URLS[mode],
    masterKey,
    privateKey,
    publicKey,
    token,
    missing
  };
}

function getBaseUrl(req) {
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers.host;
  return `${protocol}://${host}`;
}

function getPaymentUrl(data) {
  const candidates = [data?.response_text, data?.invoice_url, data?.url, data?.invoice?.url];
  return candidates.find((value) => typeof value === 'string' && value.startsWith('http')) || null;
}

/**
 * Initialise un paiement PayDunya
 * POST /api/payments/paydunya
 * Body: { amount, currency, email, name, phone, description, userId, country, redirectUrl }
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
      redirectUrl
    } = req.body || {};

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Montant invalide' });
    }
    if (!email) {
      return res.status(400).json({ error: 'Email requis' });
    }

    const config = getPayDunyaConfig();
    if (config.missing.length > 0) {
      return res.status(500).json({
        error: 'Configuration PayDunya incomplète',
        details: `${config.missing.join(', ')} manquante(s)`
      });
    }

    const txRef = `OMNIPAY-PD-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const baseUrl = getBaseUrl(req);
    const callbackUrl = `${baseUrl}/api/webhooks/paydunya`;
    const returnUrl = redirectUrl || `${baseUrl}/payment-success.html`;
    const cancelUrl = `${baseUrl}/payment-cancel.html`;
    const amountValue = parseFloat(amount);
    const paymentDescription = description || 'Paiement OmniPay';

    const payload = {
      invoice: {
        items: {
          omnipay_payment: {
            name: paymentDescription,
            quantity: 1,
            unit_price: amountValue,
            total_price: amountValue,
            description: paymentDescription
          }
        },
        total_amount: amountValue,
        description: paymentDescription
      },
      store: {
        name: 'OmniPay',
        tagline: 'Paiement sécurisé OmniPay',
        phone: phone || '',
        postal_address: country || 'BJ',
        website_url: baseUrl
      },
      custom_data: {
        txRef,
        userId: userId ? String(userId) : 'guest',
        email,
        name: name || email,
        currency: currency.toUpperCase(),
        country
      },
      actions: {
        callback_url: callbackUrl,
        return_url: returnUrl,
        cancel_url: cancelUrl
      }
    };

    const response = await fetch(`${config.baseUrl}/checkout-invoice/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'PAYDUNYA-MASTER-KEY': config.masterKey,
        'PAYDUNYA-PRIVATE-KEY': config.privateKey,
        'PAYDUNYA-PUBLIC-KEY': config.publicKey,
        'PAYDUNYA-TOKEN': config.token
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok || data.response_code !== '00') {
      return res.status(400).json({
        error: 'Erreur PayDunya',
        details: data.response_text || data.response_description || data.message || 'Paiement refusé'
      });
    }

    const paymentUrl = getPaymentUrl(data);
    const paydunyaToken = data.token || data.invoice_token || txRef;

    if (!paymentUrl) {
      return res.status(502).json({ error: 'Erreur PayDunya', details: 'URL de paiement absente dans la réponse PayDunya' });
    }

    if (userId) {
      await sql`
        INSERT INTO transactions (user_id, amount, currency, description, status, paydunya_token, gateway, gateway_ref)
        VALUES (${userId}, ${amountValue}, ${currency.toUpperCase()}, ${paymentDescription}, 'pending', ${paydunyaToken}, 'paydunya', ${txRef})
      `;
    }

    return res.status(200).json({
      success: true,
      gateway: 'paydunya',
      txRef,
      token: paydunyaToken,
      paymentUrl
    });
  } catch (error) {
    console.error('[PayDunya]', error.message);
    return res.status(500).json({ error: 'Erreur PayDunya', details: error.message });
  }
};
