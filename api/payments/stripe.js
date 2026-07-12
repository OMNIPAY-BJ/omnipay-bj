// Intégration Stripe Checkout - Cartes internationales

const { getBaseUrl, missingEnv, recordTransaction, requirePost, validatePaymentInput } = require('../lib/gateway-utils');

function toFormBody(payload) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(payload)) {
    if (value !== undefined && value !== null) params.append(key, String(value));
  }
  return params;
}

module.exports = async (req, res) => {
  if (!requirePost(req, res)) return;

  try {
    const { amount, currency = 'EUR', email, description, userId, redirectUrl } = req.body || {};
    const validationError = validatePaymentInput({ amount, email });
    if (validationError) return res.status(400).json({ error: validationError });

    const missing = missingEnv(['STRIPE_SECRET_KEY']);
    if (missing.length > 0) {
      return res.status(500).json({ error: 'Configuration Stripe incomplète', details: `${missing.join(', ')} manquante(s)` });
    }

    const baseUrl = getBaseUrl(req);
    const amountInSmallestUnit = Math.round(parseFloat(amount) * 100);
    const payload = toFormBody({
      mode: 'payment',
      success_url: redirectUrl || `${baseUrl}/payment-success.html`,
      cancel_url: `${baseUrl}/payment-cancel.html`,
      customer_email: email,
      client_reference_id: userId || 'guest',
      'line_items[0][quantity]': 1,
      'line_items[0][price_data][currency]': currency.toLowerCase(),
      'line_items[0][price_data][unit_amount]': amountInSmallestUnit,
      'line_items[0][price_data][product_data][name]': description || 'Paiement OmniPay',
      'metadata[userId]': userId || 'guest',
      'metadata[gateway]': 'stripe'
    });

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: payload
    });

    const data = await response.json();
    if (!response.ok || data.error) {
      return res.status(400).json({ error: 'Erreur Stripe', details: data.error?.message || 'Session refusée' });
    }

    await recordTransaction({
      userId,
      amount,
      currency,
      description: description || 'Paiement Stripe',
      gateway: 'stripe',
      gatewayRef: data.id,
      stripeSessionId: data.id
    });

    return res.status(200).json({ success: true, gateway: 'stripe', sessionId: data.id, paymentUrl: data.url });
  } catch (error) {
    console.error('[Stripe]', error.message);
    return res.status(500).json({ error: 'Erreur Stripe', details: error.message });
  }
};
