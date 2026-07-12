// Intégration PayPal Checkout - Cartes et compte PayPal

const { getBaseUrl, missingEnv, randomReference, recordTransaction, requirePost, validatePaymentInput } = require('../lib/gateway-utils');

function getPayPalBaseUrl() {
  return (process.env.PAYPAL_MODE || 'sandbox').toLowerCase() === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

async function getAccessToken(baseUrl) {
  const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error_description || data.error || 'OAuth PayPal refusé');
  return data.access_token;
}

module.exports = async (req, res) => {
  if (!requirePost(req, res)) return;

  try {
    const { amount, currency = 'EUR', email, description, userId, redirectUrl } = req.body || {};
    const validationError = validatePaymentInput({ amount, email, requireEmail: false });
    if (validationError) return res.status(400).json({ error: validationError });

    const missing = missingEnv(['PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET']);
    if (missing.length > 0) {
      return res.status(500).json({ error: 'Configuration PayPal incomplète', details: `${missing.join(', ')} manquante(s)` });
    }

    const baseUrl = getBaseUrl(req);
    const paypalBaseUrl = getPayPalBaseUrl();
    const reference = randomReference('OMNIPAY-PPL');
    const accessToken = await getAccessToken(paypalBaseUrl);

    const response = await fetch(`${paypalBaseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': reference
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: reference,
          description: description || 'Paiement OmniPay',
          custom_id: userId ? String(userId) : 'guest',
          amount: { currency_code: currency.toUpperCase(), value: parseFloat(amount).toFixed(2) }
        }],
        payment_source: {
          paypal: {
            experience_context: {
              brand_name: 'OmniPay',
              landing_page: 'LOGIN',
              user_action: 'PAY_NOW',
              return_url: redirectUrl || `${baseUrl}/payment-success.html`,
              cancel_url: `${baseUrl}/payment-cancel.html`
            }
          }
        }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(400).json({ error: 'Erreur PayPal', details: data.message || data.name || 'Commande refusée' });
    }

    const paymentUrl = data.links?.find((link) => link.rel === 'payer-action' || link.rel === 'approve')?.href;
    await recordTransaction({ userId, amount, currency, description: description || 'Paiement PayPal', gateway: 'paypal', gatewayRef: data.id || reference });

    return res.status(200).json({ success: true, gateway: 'paypal', orderId: data.id, reference, paymentUrl });
  } catch (error) {
    console.error('[PayPal]', error.message);
    return res.status(500).json({ error: 'Erreur PayPal', details: error.message });
  }
};
