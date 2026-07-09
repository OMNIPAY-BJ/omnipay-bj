// Gestion des cartes cadeaux (Gift Cards)
// Supporte : Transcash, Steam, PCS Mastercard, iTunes, Google Play, Amazon

const { sql } = require('@vercel/postgres');

/**
 * Catalogue des cartes cadeaux disponibles
 */
const GIFT_CARD_CATALOG = [
  {
    id: 'transcash-10',
    brand: 'Transcash',
    denomination: 10,
    currency: 'EUR',
    description: 'Carte Transcash 10€ - Rechargez votre compte',
    available: true
  },
  {
    id: 'transcash-20',
    brand: 'Transcash',
    denomination: 20,
    currency: 'EUR',
    description: 'Carte Transcash 20€ - Rechargez votre compte',
    available: true
  },
  {
    id: 'transcash-50',
    brand: 'Transcash',
    denomination: 50,
    currency: 'EUR',
    description: 'Carte Transcash 50€ - Rechargez votre compte',
    available: true
  },
  {
    id: 'pcs-10',
    brand: 'PCS Mastercard',
    denomination: 10,
    currency: 'EUR',
    description: 'Carte PCS Mastercard 10€ - Prépayée acceptée partout',
    available: true
  },
  {
    id: 'pcs-20',
    brand: 'PCS Mastercard',
    denomination: 20,
    currency: 'EUR',
    description: 'Carte PCS Mastercard 20€ - Prépayée acceptée partout',
    available: true
  },
  {
    id: 'pcs-50',
    brand: 'PCS Mastercard',
    denomination: 50,
    currency: 'EUR',
    description: 'Carte PCS Mastercard 50€ - Prépayée acceptée partout',
    available: true
  },
  {
    id: 'steam-5',
    brand: 'Steam',
    denomination: 5,
    currency: 'USD',
    description: 'Carte Steam 5$ - Jeux et contenu en ligne',
    available: true
  },
  {
    id: 'steam-10',
    brand: 'Steam',
    denomination: 10,
    currency: 'USD',
    description: 'Carte Steam 10$ - Jeux et contenu en ligne',
    available: true
  },
  {
    id: 'steam-20',
    brand: 'Steam',
    denomination: 20,
    currency: 'USD',
    description: 'Carte Steam 20$ - Jeux et contenu en ligne',
    available: true
  },
  {
    id: 'amazon-10',
    brand: 'Amazon',
    denomination: 10,
    currency: 'EUR',
    description: 'Carte cadeau Amazon 10€',
    available: true
  },
  {
    id: 'amazon-25',
    brand: 'Amazon',
    denomination: 25,
    currency: 'EUR',
    description: 'Carte cadeau Amazon 25€',
    available: true
  },
  {
    id: 'google-play-10',
    brand: 'Google Play',
    denomination: 10,
    currency: 'EUR',
    description: 'Carte Google Play 10€ - Apps, jeux, films',
    available: true
  },
  {
    id: 'itunes-15',
    brand: 'iTunes / App Store',
    denomination: 15,
    currency: 'EUR',
    description: 'Carte iTunes / App Store 15€',
    available: true
  }
];

/**
 * Gestion des cartes cadeaux
 * GET  /api/giftcards?brand=xxx  - Lister les cartes disponibles (avec filtre optionnel)
 * POST /api/giftcards            - Acheter une carte cadeau
 */
module.exports = async (req, res) => {
  if (req.method === 'GET') {
    // Lister les cartes cadeaux disponibles
    const { brand } = req.query;
    let catalog = GIFT_CARD_CATALOG.filter(c => c.available);

    if (brand) {
      catalog = catalog.filter(c => c.brand.toLowerCase().includes(brand.toLowerCase()));
    }

    const brands = [...new Set(GIFT_CARD_CATALOG.map(c => c.brand))];

    return res.status(200).json({
      success: true,
      brands,
      count: catalog.length,
      giftCards: catalog
    });
  }

  if (req.method === 'POST') {
    // Acheter une carte cadeau
    try {
      const { cardId, userId, quantity = 1 } = req.body || {};

      if (!cardId) {
        return res.status(400).json({ error: 'cardId requis' });
      }
      if (!userId) {
        return res.status(400).json({ error: 'userId requis' });
      }
      if (!Number.isInteger(Number(quantity)) || Number(quantity) < 1) {
        return res.status(400).json({ error: 'Quantité invalide' });
      }

      // Trouver la carte dans le catalogue
      const card = GIFT_CARD_CATALOG.find(c => c.id === cardId && c.available);
      if (!card) {
        return res.status(404).json({ error: 'Carte cadeau non disponible' });
      }

      const totalAmount = card.denomination * Number(quantity);

      // Vérifier le solde de l'utilisateur
      const userResult = await sql`SELECT id, balance FROM users WHERE id = ${userId}`;
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'Utilisateur introuvable' });
      }

      const user = userResult.rows[0];
      if (parseFloat(user.balance) < totalAmount) {
        return res.status(400).json({
          error: 'Solde insuffisant',
          details: `Solde disponible: ${user.balance} ${card.currency}, Montant requis: ${totalAmount} ${card.currency}`
        });
      }

      // Générer les codes des cartes cadeaux
      const codes = [];
      for (let i = 0; i < Number(quantity); i++) {
        codes.push(generateGiftCardCode());
      }

      // Déduire le montant du solde et enregistrer la transaction
      await sql`
        UPDATE users SET balance = balance - ${totalAmount} WHERE id = ${userId}
      `;

      await sql`
        INSERT INTO transactions (user_id, amount, currency, description, status, gateway, gateway_ref)
        VALUES (${userId}, ${totalAmount}, ${card.currency}, ${'Achat carte cadeau ' + card.brand + ' x' + quantity}, 'completed', 'giftcard', ${codes[0]})
      `;

      return res.status(200).json({
        success: true,
        message: `${quantity} carte(s) cadeau ${card.brand} achetée(s) avec succès`,
        order: {
          cardId,
          brand: card.brand,
          denomination: card.denomination,
          currency: card.currency,
          quantity: Number(quantity),
          totalAmount,
          codes
        }
      });
    } catch (error) {
      return res.status(500).json({ error: 'Erreur achat carte cadeau', details: error.message });
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée' });
};

/**
 * Génère un code de carte cadeau unique (format: XXXX-XXXX-XXXX-XXXX)
 */
function generateGiftCardCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segment = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${segment()}-${segment()}-${segment()}-${segment()}`;
}
