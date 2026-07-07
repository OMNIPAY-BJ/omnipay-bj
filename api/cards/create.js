const { sql } = require('@vercel/postgres');

function generateCardNumber() {
  let number = '4';
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

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, cardName } = req.body || {};
    if (!userId || !cardName) {
      return res.status(400).json({ error: 'userId et cardName requis' });
    }

    const userResult = await sql`SELECT id FROM users WHERE id = ${userId}`;
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    const cardNumber = generateCardNumber();
    const expiryDate = generateExpiryDate();

    const result = await sql`
      INSERT INTO virtual_cards (user_id, card_number, card_name, card_type, expiry_date)
      VALUES (${userId}, ${cardNumber}, ${cardName}, 'Virtual', ${expiryDate})
      RETURNING id, card_number, card_name, card_type, expiry_date
    `;

    return res.status(200).json({
      success: true,
      message: 'Carte créée avec succès',
      card: result.rows[0]
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erreur création carte', details: error.message });
  }
};
