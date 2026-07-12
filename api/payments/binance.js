// Intégration Binance Pay - Paiements crypto via Binance

const crypto = require('crypto');
const { getBaseUrl, missingEnv, randomReference, recordTransaction, requirePost, validatePaymentInput } = require('../lib/gateway-utils');

function signBinancePayload(timestamp, nonce, body) {
  const payload = `${timestamp}\n${nonce}\n${body}\n`;
  return crypto.createHmac('sha512', process.env.BINANCE_PAY_SECRET_KEY).update(payload).digest('hex').toUpperCase();
}

module.exports = async (req, res) => {
  if (!requirePost(req, res)) return;

  try {
    const { amount, currency = 'USDT', email, description, userId, redirectUrl } = req.body || {};
    const validationError = validatePaymentInput({ amount, email, requireEmail: false });
    if (validationError) return res.status(400).json({ error: validationError });

    const missing = missingEnv(['BINANCE_PAY_API_KEY', 'BINANCE_PAY_SECRET_KEY']);
    if (missing.length > 0) {
      return res.status(500).json({ error: 'Configuration Binance Pay incomplète', details: `${missing.join(', ')} manquante(s)` });
    }

    const baseUrl = getBaseUrl(req);
    const reference = randomReference('OMNIPAY-BNB');
    const payload = {
      env: { terminalType: 'WEB' },
      merchantTradeNo: reference,
      orderAmount: parseFloat(amount).toFixed(2),
      currency: currency.toUpperCase(),
      goods: {
        goodsType: '02',
        goodsCategory: 'Z000',
        referenceGoodsId: reference,
        goodsName: description || 'Paiement OmniPay'
      },
      returnUrl: redirectUrl || `${baseUrl}/payment-success.html`,
      cancelUrl: `${baseUrl}/payment-cancel.html`,
      webhookUrl: `${baseUrl}/api/webhooks/binance`
    };

    const body = JSON.stringify(payload);
    const timestamp = Date.now().toString();
    const nonce = crypto.randomBytes(16).toString('hex');
    const signature = signBinancePayload(timestamp, nonce, body);

    const response = await fetch('https://bpay.binanceapi.com/binancepay/openapi/v3/order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'BinancePay-Timestamp': timestamp,
        'BinancePay-Nonce': nonce,
        'BinancePay-Certificate-SN': process.env.BINANCE_PAY_API_KEY,
        'BinancePay-Signature': signature
      },
      body
    });

    const data = await response.json();
    if (!response.ok || data.status !== 'SUCCESS') {
      return res.status(400).json({ error: 'Erreur Binance Pay', details: data.errorMessage || data.message || 'Ordre refusé' });
    }

    await recordTransaction({ userId, amount, currency, description: description || 'Paiement Binance Pay', gateway: 'binance', gatewayRef: reference });

    return res.status(200).json({
      success: true,
      gateway: 'binance',
      reference,
      prepayId: data.data?.prepayId,
      paymentUrl: data.data?.checkoutUrl || data.data?.universalUrl,
      qrCode: data.data?.qrcodeLink
    });
  } catch (error) {
    console.error('[Binance Pay]', error.message);
    return res.status(500).json({ error: 'Erreur Binance Pay', details: error.message });
  }
};
