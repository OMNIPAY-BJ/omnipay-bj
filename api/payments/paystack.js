// Intégration Paystack - Alternative Afrique (Nigeria, Ghana, Kenya, Afrique du Sud)
// Supporte : Cartes bancaires, Mobile Money, Virement bancaire, USSD

const { sql } = require('@vercel/postgres');

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

/**
 * Initialise un paiement Paystack
 * POST /api/payments/paystack
 * Body: { amount, currency, email, name, description, userId, redirectUrl }
 */
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const {
      amount,
      currency = 'NGN',
      email,
      name,
      description,
      userId,
      redirectUrl
    } = req.body || {};

    // Validation des champs requis
    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Montant invalide' });
    }
    if (!email) {
      return res.status(400).json({ error: 'Email requis' });
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      return res.status(500).json({ error: 'Configuration Paystack incomplète', details: 'PAYSTACK_SECRET_KEY manquante' });
    }

    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host;
    const baseUrl = `${protocol}://${host}`;
    const callbackUrl = redirectUrl || `${baseUrl}/payment-success.html`;

    // Paystack attend le montant en kobo/centimes (multiplier par 100)
    const amountInSmallestUnit = Math.round(parseFloat(amount) * 100);

    const crypto = require('crypto');
    const reference = `OMNIPAY-PSK-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    const payload = {
      email,
      amount: amountInSmallestUnit,
      currency: currency.toUpperCase(),
      reference,
      callback_url: callbackUrl,
      metadata: {
        userId: userId ? String(userId) : 'guest',
        name: name || email,
        description: description || 'Paiement OmniPay'
      }
    };

    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + secretKey
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!data.status) {
      return res.status(400).json({ error: 'Erreur Paystack', details: data.message });
    }

    // Enregistrement de la transaction en base
    if (userId) {
      await sql`
        INSERT INTO transactions (user_id, amount, currency, description, status, gateway, gateway_ref)
        VALUES (${userId}, ${parseFloat(amount)}, ${currency.toUpperCase()}, ${description || 'Paiement Paystack'}, 'pending', 'paystack', ${reference})
      `;
    }

    return res.status(200).json({
      success: true,
      gateway: 'paystack',
      reference,
      accessCode: data.data.access_code,
      paymentUrl: data.data.authorization_url
    });
  } catch (error) {
    console.error('[Paystack]', error.message);
    return res.status(500).json({ error: 'Erreur Paystack', details: error.message });
  }
};
