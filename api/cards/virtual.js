// Gestion des cartes virtuelles - liste et opérations
// La création est dans api/cards/create.js (existant)

const { sql } = require('@vercel/postgres');

/**
 * Gestion des cartes virtuelles
 * GET  /api/cards/virtual?userId=xxx  - Lister les cartes d'un utilisateur
 * POST /api/cards/virtual             - Créer une nouvelle carte (via create.js)
 * DELETE /api/cards/virtual?cardId=xxx&userId=xxx - Désactiver une carte
 */
module.exports = async (req, res) => {
  if (req.method === 'GET') {
    // Lister les cartes virtuelles d'un utilisateur
    try {
      const { userId } = req.query;
      if (!userId) {
        return res.status(400).json({ error: 'userId requis' });
      }

      const result = await sql`
        SELECT id, card_number, card_name, card_type, expiry_date, created_at
        FROM virtual_cards
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
      `;

      return res.status(200).json({
        success: true,
        count: result.rows.length,
        cards: result.rows
      });
    } catch (error) {
      return res.status(500).json({ error: 'Erreur récupération cartes', details: error.message });
    }
  }

  if (req.method === 'POST') {
    // Créer une carte virtuelle (délégué à create.js pour compatibilité)
    try {
      const { userId, cardName } = req.body || {};
      if (!userId || !cardName) {
        return res.status(400).json({ error: 'userId et cardName requis' });
      }

      const userResult = await sql`SELECT id, balance FROM users WHERE id = ${userId}`;
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'Utilisateur introuvable' });
      }

      const user = userResult.rows[0];
      const CARD_CREATION_FEE = 0; // Frais de création (peut être configuré)

      if (CARD_CREATION_FEE > 0 && parseFloat(user.balance) < CARD_CREATION_FEE) {
        return res.status(400).json({ error: 'Solde insuffisant pour créer une carte' });
      }

      // Génération des données de carte
      const cardNumber = generateCardNumber();
      const expiryDate = generateExpiryDate();
      const cvv = generateCvv();

      const result = await sql`
        INSERT INTO virtual_cards (user_id, card_number, card_name, card_type, expiry_date)
        VALUES (${userId}, ${cardNumber}, ${cardName}, 'Virtual Mastercard', ${expiryDate})
        RETURNING id, card_number, card_name, card_type, expiry_date, created_at
      `;

      return res.status(201).json({
        success: true,
        message: 'Carte virtuelle créée avec succès',
        card: { ...result.rows[0], cvv }
      });
    } catch (error) {
      return res.status(500).json({ error: 'Erreur création carte', details: error.message });
    }
  }

  if (req.method === 'DELETE') {
    // Désactiver une carte virtuelle
    try {
      const { cardId, userId } = req.query;
      if (!cardId || !userId) {
        return res.status(400).json({ error: 'cardId et userId requis' });
      }

      const result = await sql`
        DELETE FROM virtual_cards
        WHERE id = ${cardId} AND user_id = ${userId}
        RETURNING id
      `;

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Carte introuvable ou non autorisée' });
      }

      return res.status(200).json({ success: true, message: 'Carte supprimée avec succès' });
    } catch (error) {
      return res.status(500).json({ error: 'Erreur suppression carte', details: error.message });
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée' });
};

// --- Fonctions utilitaires ---

function generateCardNumber() {
  // Préfixe Mastercard : 5xxx
  let number = '5';
  for (let i = 0; i < 15; i++) {
    number += Math.floor(Math.random() * 10);
  }
  return number.replace(/(.{4})/g, '$1 ').trim();
}

function generateExpiryDate() {
  const now = new Date();
  const year = (now.getFullYear() + 3) % 100;
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${month}/${year}`;
}

function generateCvv() {
  return String(Math.floor(100 + Math.random() * 900));
}
