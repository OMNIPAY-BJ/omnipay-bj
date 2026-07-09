// Webhook Coinbase Commerce - Confirmation des paiements crypto
// Vérifie la signature HMAC SHA-256 et met à jour le statut des transactions

const { sql } = require('@vercel/postgres');
const crypto = require('crypto');

/**
 * Vérifie la signature HMAC SHA-256 de Coinbase Commerce
 * @param {string} rawBody - Corps brut de la requête
 * @param {string} signature - Header x-cc-webhook-signature
 * @param {string} secret - COINBASE_COMMERCE_WEBHOOK_SECRET
 * @returns {boolean}
 */
function verifyCoinbaseSignature(rawBody, signature, secret) {
  if (!secret || !signature) return false;
  const hash = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return hash === signature;
}

/**
 * Webhook Coinbase Commerce
 * POST /api/webhooks/coinbase
 *
 * Événements gérés :
 * - charge:confirmed  → paiement confirmé
 * - charge:failed     → paiement échoué
 * - charge:delayed    → paiement en attente de confirmation supplémentaire
 * - charge:pending    → paiement reçu, en attente de confirmation réseau
 */
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const webhookSecret = process.env.COINBASE_COMMERCE_WEBHOOK_SECRET;
    const signature = req.headers['x-cc-webhook-signature'];

    // Vérification de la signature
    const rawBody = JSON.stringify(req.body);
    if (webhookSecret && !verifyCoinbaseSignature(rawBody, signature, webhookSecret)) {
      console.warn('[Webhook Coinbase] Signature invalide');
      return res.status(401).json({ error: 'Signature invalide' });
    }

    const event = req.body.event;
    if (!event) {
      return res.status(400).json({ error: 'Événement manquant' });
    }

    const eventType = event.type;
    const charge = event.data;
    const chargeCode = charge.code;
    const userId = charge.metadata?.userId;

    console.log('[Webhook Coinbase] Événement reçu:', eventType, chargeCode);

    if (eventType === 'charge:confirmed') {
      // Paiement confirmé - créditer le solde
      const pricing = charge.pricing?.local;
      const amount = pricing ? parseFloat(pricing.amount) : 0;
      const currency = pricing ? pricing.currency : 'USD';

      const txResult = await sql`
        UPDATE transactions
        SET status = 'completed'
        WHERE gateway_ref = ${chargeCode} AND gateway = 'coinbase'
        RETURNING id, user_id, amount
      `;

      if (txResult.rows.length > 0) {
        const tx = txResult.rows[0];
        const creditUserId = tx.user_id || userId;
        const creditAmount = tx.amount || amount;

        if (creditUserId && creditUserId !== 'guest') {
          await sql`
            UPDATE users
            SET balance = balance + ${parseFloat(creditAmount)}
            WHERE id = ${creditUserId}
          `;
          console.log(`[Webhook Coinbase] Solde crédité: utilisateur ${creditUserId}, montant ${creditAmount} ${currency}`);
        }
      }
    }

    if (eventType === 'charge:pending') {
      await sql`
        UPDATE transactions
        SET status = 'pending_crypto'
        WHERE gateway_ref = ${chargeCode} AND gateway = 'coinbase'
      `;
    }

    if (eventType === 'charge:failed' || eventType === 'charge:delayed') {
      await sql`
        UPDATE transactions
        SET status = 'failed'
        WHERE gateway_ref = ${chargeCode} AND gateway = 'coinbase'
      `;
    }

    // Coinbase attend une réponse 200 pour confirmer la réception
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('[Webhook Coinbase] Erreur:', error.message);
    return res.status(500).json({ error: 'Erreur webhook', details: error.message });
  }
};
