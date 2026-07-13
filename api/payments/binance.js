// Intégration Binance Pay - Paiements crypto via Binance Merchant

const crypto = require('crypto');
const { sql } = require('@vercel/postgres');

const BINANCE_PAY_BASE_URL = 'https://bpay.binanceapi.com';

function createSignature(timestamp, nonce, body, secretKey) {
  const payload = `${timestamp}\n${nonce}\n${body}\n`;
  return crypto.createHmac('sha512', secretKey).update(payload).digest('hex').toUpperCase();
}

function normalizeCurrency(currency) {
  const value = String(currency || 'USDT').toUpperCase();
  const supported = new Set(['USDT', 'BUSD', 'BTC', 'ETH', 'BNB', 'USDC']);
  return supported.has(value) ? value : 'USDT';
}

/**
 * Crée un ordre Binance Pay.
 * POST /api/payments/binance
 * Body: { amount, currency, email, name, description, userId, redirectUrl, cancelUrl }
 */
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const apiKey = process.env.BINANCE_API_KEY;
    const apiSecret = process.env.BINANCE_API_SECRET;

    if (!apiKey || !apiSecret) {
      return res.status(500).json({
        error: 'Configuration Binance incomplète',
        details: 'BINANCE_API_KEY ou BINANCE_API_SECRET manquante'
      });
    }

    const {
      amount,
      currency = 'USDT',
      email,
      name,
      description,
      userId,
      redirectUrl,
      cancelUrl
    } = req.body || {};

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Montant invalide' });
    }

    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host;
    const baseUrl = `${protocol}://${host}`;
    const merchantTradeNo = `OMNIPAY-BINANCE-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const orderAmount = parseFloat(amount).toFixed(2);
    const orderCurrency = normalizeCurrency(currency);

    const orderPayload = {
      env: { terminalType: 'WEB' },
      merchantTradeNo,
      orderAmount,
      currency: orderCurrency,
      goods: {
        goodsType: '02',
        goodsCategory: 'Z000',
        referenceGoodsId: 'omnipay-payment',
        goodsName: description || 'Paiement OmniPay'
      },
      buyer: email
        ? {
            buyerEmail: email,
            buyerName: { firstName: name || 'OmniPay', lastName: 'Client' }
          }
        : undefined,
      returnUrl: redirectUrl || `${baseUrl}/`,
      cancelUrl: cancelUrl || `${baseUrl}/`,
      webhookUrl: `${baseUrl}/api/webhooks/binance`
    };

    const body = JSON.stringify(orderPayload);
    const timestamp = Date.now().toString();
    const nonce = crypto.randomBytes(16).toString('hex');
    const signature = createSignature(timestamp, nonce, body, apiSecret);

    const response = await fetch(`${BINANCE_PAY_BASE_URL}/binancepay/openapi/v3/order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'BinancePay-Timestamp': timestamp,
        'BinancePay-Nonce': nonce,
        'BinancePay-Certificate-SN': apiKey,
        'BinancePay-Signature': signature
      },
      body
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.status !== 'SUCCESS') {
      return res.status(400).json({
        error: 'Erreur Binance Pay',
        details: data.errorMessage || data.msg || data.message || 'Réponse Binance invalide'
      });
    }

    const binanceOrder = data.data || {};

    if (userId) {
      await sql`
        INSERT INTO transactions (user_id, amount, currency, description, status, gateway, gateway_ref)
        VALUES (${userId}, ${parseFloat(amount)}, ${orderCurrency}, ${description || 'Paiement Binance Pay'}, 'pending', 'binance', ${merchantTradeNo})
      `;
    }

    return res.status(200).json({
      success: true,
      gateway: 'binance',
      merchantTradeNo,
      prepayId: binanceOrder.prepayId,
      paymentUrl: binanceOrder.checkoutUrl || binanceOrder.universalUrl || binanceOrder.qrcodeLink,
      checkoutUrl: binanceOrder.checkoutUrl,
      universalUrl: binanceOrder.universalUrl,
      qrcodeLink: binanceOrder.qrcodeLink
    });
  } catch (error) {
    console.error('[Binance Pay]', error.message);
    return res.status(500).json({ error: 'Erreur Binance Pay', details: error.message });
  }
};
