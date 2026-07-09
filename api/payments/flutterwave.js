// Intégration Flutterwave - Meilleure gateway pour l'Afrique
// Supporte : Visa/Mastercard, Mobile Money (MTN, Orange, Moov), Virement bancaire

const { sql } = require('@vercel/postgres');

const FLW_BASE_URL = 'https://api.flutterwave.com/v3';

/**
 * Initialise un paiement Flutterwave
 * POST /api/payments/flutterwave
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

    // Validation des champs requis
    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Montant invalide' });
    }
    if (!email) {
      return res.status(400).json({ error: 'Email requis' });
    }

    const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
    if (!secretKey) {
      return res.status(500).json({ error: 'Configuration Flutterwave incomplète', details: 'FLUTTERWAVE_SECRET_KEY manquante' });
    }

    const txRef = `OMNIPAY-FLW-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host;
    const baseUrl = `${protocol}://${host}`;
    const callbackUrl = redirectUrl || `${baseUrl}/payment-success.html`;

    const payload = {
      tx_ref: txRef,
      amount: parseFloat(amount),
      currency: currency.toUpperCase(),
      redirect_url: callbackUrl,
      payment_options: 'card, mobilemoneyfrance, mobilemoneyghana, mobilemoneyuganda, mobilemoneyrwanda, mobilemoneyzmb, barter, ussd',
      customer: {
        email,
        phonenumber: phone || '',
        name: name || email
      },
      customizations: {
        title: 'OmniPay',
        description: description || 'Paiement OmniPay',
        logo: `${baseUrl}/logo.png`
      },
      meta: {
        userId: userId ? String(userId) : 'guest',
        country
      }
    };

    const response = await fetch(`${FLW_BASE_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + secretKey
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (data.status !== 'success') {
      return res.status(400).json({ error: 'Erreur Flutterwave', details: data.message });
    }

    // Enregistrement de la transaction en base
    if (userId) {
      await sql`
        INSERT INTO transactions (user_id, amount, currency, description, status, gateway, gateway_ref)
        VALUES (${userId}, ${parseFloat(amount)}, ${currency.toUpperCase()}, ${description || 'Paiement Flutterwave'}, 'pending', 'flutterwave', ${txRef})
      `;
    }

    return res.status(200).json({
      success: true,
      gateway: 'flutterwave',
      txRef,
      paymentUrl: data.data.link
    });
  } catch (error) {
    console.error('[Flutterwave]', error.message);
    return res.status(500).json({ error: 'Erreur Flutterwave', details: error.message });
  }
};
