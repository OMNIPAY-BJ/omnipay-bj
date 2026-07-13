// Webhook Binance Pay - réception des notifications de paiement

const crypto = require('crypto');
const { sql } = require('@vercel/postgres');

function verifyWebhookSecret(req) {
  const expectedSecret = process.env.BINANCE_WEBHOOK_SECRET;
  if (!expectedSecret) return true;

  const providedSecret = req.headers['x-binance-webhook-secret'] || req.query?.secret;
  if (providedSecret === expectedSecret) return true;

  const signature = req.headers['binancepay-signature'];
  const timestamp = req.headers['binancepay-timestamp'];
  const nonce = req.headers['binancepay-nonce'];
  const apiSecret = process.env.BINANCE_API_SECRET;
  const body = JSON.stringify(req.body || {});
  if (!signature || !timestamp || !nonce || !apiSecret) return false;

  const payload = `${timestamp}\n${nonce}\n${body}\n`;
  const expectedSignature = crypto.createHmac('sha512', apiSecret).update(payload).digest('hex').toUpperCase();
  return signature === expectedSignature;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  if (!verifyWebhookSecret(req)) {
    return res.status(401).json({ error: 'Signature Binance invalide' });
  }

  try {
    const payload = req.body || {};
    const data = payload.data || payload;
    const merchantTradeNo = data.merchantTradeNo || data.merchant_trade_no || data.orderId || '';
    const status = data.status || data.orderStatus || payload.bizStatus || 'received';

    if (merchantTradeNo) {
      await sql`
        UPDATE transactions
        SET status = ${String(status).toLowerCase()}
        WHERE gateway = 'binance' AND gateway_ref = ${merchantTradeNo}
      `;
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[Binance Webhook]', error.message);
    return res.status(500).json({ error: 'Erreur webhook Binance', details: error.message });
  }
};
