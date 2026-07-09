// Webhook Paystack - Confirmation des paiements
// Vérifie la signature HMAC SHA-512 et met à jour le statut des transactions

const { sql } = require('@vercel/postgres');
const crypto = require('crypto');

/**
 * Vérifie la signature HMAC SHA-512 de Paystack
 * @param {string} body - Corps de la requête brut (string)
 * @param {string} signature - Header x-paystack-signature
 * @param {string} secretKey - Clé secrète Paystack
 * @returns {boolean}
 */
function verifyPaystackSignature(body, signature, secretKey) {
  if (!secretKey || !signature) return false;
  const hash = crypto.createHmac('sha512', secretKey).update(body).digest('hex');
  return hash === signature;
}

/**
 * Webhook Paystack
 * POST /api/webhooks/paystack
 */
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    const signature = req.headers['x-paystack-signature'];

    // Vérification de la signature
    const rawBody = JSON.stringify(req.body);
    if (secretKey && !verifyPaystackSignature(rawBody, signature, secretKey)) {
      console.warn('[Webhook Paystack] Signature invalide');
      return res.status(401).json({ error: 'Signature invalide' });
    }

    const event = req.body;
    const eventType = event.event;

    console.log('[Webhook Paystack] Événement reçu:', eventType, event.data?.reference);

    if (eventType === 'charge.success') {
      const data = event.data;
      const reference = data.reference;
      const amount = data.amount / 100; // Paystack envoie en kobo
      const currency = data.currency;
      const userId = data.metadata?.userId;

      // Mise à jour du statut en base
      const txResult = await sql`
        UPDATE transactions
        SET status = 'completed'
        WHERE gateway_ref = ${reference} AND gateway = 'paystack'
        RETURNING id, user_id, amount
      `;

      // Crédit du solde si paiement réussi
      if (txResult.rows.length > 0) {
        const tx = txResult.rows[0];
        const creditUserId = tx.user_id || userId;

        if (creditUserId && creditUserId !== 'guest') {
          await sql`
            UPDATE users
            SET balance = balance + ${amount}
            WHERE id = ${creditUserId}
          `;
          console.log(`[Webhook Paystack] Solde crédité: utilisateur ${creditUserId}, montant ${amount} ${currency}`);
        }
      }
    }

    if (eventType === 'transfer.failed' || eventType === 'charge.dispute.create') {
      const data = event.data;
      const reference = data.reference;

      await sql`
        UPDATE transactions
        SET status = 'failed'
        WHERE gateway_ref = ${reference} AND gateway = 'paystack'
      `;
    }

    // Paystack attend une réponse 200 pour confirmer la réception
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('[Webhook Paystack] Erreur:', error.message);
    return res.status(500).json({ error: 'Erreur webhook', details: error.message });
  }
};
