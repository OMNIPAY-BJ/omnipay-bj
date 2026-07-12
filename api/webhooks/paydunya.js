// Webhook PayDunya - Confirmation des paiements
// Confirme le token auprès de PayDunya avant de créditer le solde utilisateur

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

function extractToken(body) {
  return body?.token || body?.invoice_token || body?.data?.token || body?.data?.invoice?.token || body?.invoice?.token || null;
}

function isCompleted(status) {
  return ['completed', 'success', 'successful', 'paid'].includes(String(status || '').toLowerCase());
}

async function confirmInvoice(config, token) {
  const response = await fetch(`${config.baseUrl}/checkout-invoice/confirm/${encodeURIComponent(token)}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'PAYDUNYA-MASTER-KEY': config.masterKey,
      'PAYDUNYA-PRIVATE-KEY': config.privateKey,
      'PAYDUNYA-PUBLIC-KEY': config.publicKey,
      'PAYDUNYA-TOKEN': config.token
    }
  });

  const data = await response.json();
  return { response, data };
}

/**
 * Webhook PayDunya
 * POST /api/webhooks/paydunya
 */
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const config = getPayDunyaConfig();
    if (config.missing.length > 0) {
      return res.status(500).json({ error: 'Configuration PayDunya incomplète', details: `${config.missing.join(', ')} manquante(s)` });
    }

    const token = extractToken(req.body);
    if (!token) {
      return res.status(400).json({ error: 'Token PayDunya manquant' });
    }

    const { response, data } = await confirmInvoice(config, token);
    if (!response.ok || data.response_code !== '00') {
      return res.status(400).json({ error: 'Confirmation PayDunya refusée', details: data.response_text || data.response_description || data.message || 'Token invalide' });
    }

    const invoice = data.invoice || data.data || data;
    const status = invoice.status || data.status;
    const customData = invoice.custom_data || data.custom_data || {};
    const userId = customData.userId;
    const amount = parseFloat(invoice.total_amount || invoice.amount || 0);
    const currency = customData.currency || invoice.currency || 'XOF';
    const txRef = customData.txRef;
    const newStatus = isCompleted(status) ? 'completed' : 'failed';

    const txResult = await sql`
      UPDATE transactions
      SET status = ${newStatus}
      WHERE paydunya_token = ${token} AND gateway = 'paydunya'
      RETURNING id, user_id, amount
    `;

    if (newStatus === 'completed' && txResult.rows.length > 0) {
      const tx = txResult.rows[0];
      const creditUserId = tx.user_id || userId;
      const creditAmount = amount || parseFloat(tx.amount);

      if (creditUserId && creditUserId !== 'guest') {
        await sql`
          UPDATE users
          SET balance = balance + ${creditAmount}
          WHERE id = ${creditUserId}
        `;
        console.log(`[Webhook PayDunya] Solde crédité: utilisateur ${creditUserId}, montant ${creditAmount} ${currency}`);
      }
    }

    console.log('[Webhook PayDunya] Événement confirmé:', token, txRef, newStatus);
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('[Webhook PayDunya] Erreur:', error.message);
    return res.status(500).json({ error: 'Erreur webhook', details: error.message });
  }
};
