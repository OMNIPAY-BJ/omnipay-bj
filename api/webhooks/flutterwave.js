// Webhook Flutterwave - Confirmation des paiements
// Vérifie la signature HMAC SHA-256 et met à jour le statut des transactions

const { sql } = require('@vercel/postgres');
const crypto = require('crypto');

/**
 * Webhook Flutterwave
 * POST /api/webhooks/flutterwave
 */
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    // Vérification de la signature Flutterwave
    const secretHash = process.env.FLUTTERWAVE_WEBHOOK_SECRET;
    const signature = req.headers['verif-hash'];

    if (secretHash && signature !== secretHash) {
      console.warn('[Webhook Flutterwave] Signature invalide');
      return res.status(401).json({ error: 'Signature invalide' });
    }

    const event = req.body;
    const eventType = event.event;

    console.log('[Webhook Flutterwave] Événement reçu:', eventType, event.data?.tx_ref);

    if (eventType === 'charge.completed') {
      const data = event.data;
      const txRef = data.tx_ref;
      const status = data.status; // 'successful' | 'failed'
      const amount = data.amount;
      const currency = data.currency;
      const userId = data.meta?.userId;

      const newStatus = status === 'successful' ? 'completed' : 'failed';

      // Mise à jour du statut en base
      const txResult = await sql`
        UPDATE transactions
        SET status = ${newStatus}
        WHERE gateway_ref = ${txRef} AND gateway = 'flutterwave'
        RETURNING id, user_id, amount
      `;

      // Crédit du solde si paiement réussi
      if (newStatus === 'completed' && txResult.rows.length > 0) {
        const tx = txResult.rows[0];
        const creditUserId = tx.user_id || userId;

        if (creditUserId && creditUserId !== 'guest') {
          await sql`
            UPDATE users
            SET balance = balance + ${parseFloat(amount)}
            WHERE id = ${creditUserId}
          `;
          console.log(`[Webhook Flutterwave] Solde crédité: utilisateur ${creditUserId}, montant ${amount} ${currency}`);
        }
      }
    }

    // Flutterwave attend une réponse 200 pour confirmer la réception
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('[Webhook Flutterwave] Erreur:', error.message);
    return res.status(500).json({ error: 'Erreur webhook', details: error.message });
  }
};
