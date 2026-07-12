const crypto = require('crypto');
const { sql } = require('@vercel/postgres');

function requirePost(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée' });
    return false;
  }
  return true;
}

function getBaseUrl(req) {
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers.host;
  return `${protocol}://${host}`;
}

function validatePaymentInput({ amount, email, requireEmail = true }) {
  if (!amount || parseFloat(amount) <= 0) {
    return 'Montant invalide';
  }
  if (requireEmail && !email) {
    return 'Email requis';
  }
  return null;
}

function missingEnv(keys) {
  return keys.filter((key) => !process.env[key]);
}

function randomReference(prefix) {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

async function recordTransaction({ userId, amount, currency, description, gateway, gatewayRef, paydunyaToken, stripeSessionId }) {
  if (!userId) return;

  await sql`
    INSERT INTO transactions (user_id, amount, currency, description, status, paydunya_token, stripe_session_id, gateway, gateway_ref)
    VALUES (${userId}, ${parseFloat(amount)}, ${currency.toUpperCase()}, ${description || `Paiement ${gateway}`}, 'pending', ${paydunyaToken || null}, ${stripeSessionId || null}, ${gateway}, ${gatewayRef})
  `;
}

async function markTransaction({ gateway, gatewayRef, status }) {
  return sql`
    UPDATE transactions
    SET status = ${status}
    WHERE gateway_ref = ${gatewayRef} AND gateway = ${gateway}
    RETURNING id, user_id, amount
  `;
}

async function creditUserBalance(userId, amount) {
  if (!userId || userId === 'guest') return;

  await sql`
    UPDATE users
    SET balance = balance + ${parseFloat(amount)}
    WHERE id = ${userId}
  `;
}

function safeEqual(a, b) {
  if (!a || !b) return false;
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

module.exports = {
  creditUserBalance,
  getBaseUrl,
  markTransaction,
  missingEnv,
  randomReference,
  recordTransaction,
  requirePost,
  safeEqual,
  validatePaymentInput
};
