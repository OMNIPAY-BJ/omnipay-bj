const { sql } = require('@vercel/postgres');

module.exports = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId requis' });

    const userResult = await sql`SELECT id, email, name, role, balance, created_at FROM users WHERE id = ${userId}`;
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }
    const user = userResult.rows[0];

    const txnResult = await sql`
      SELECT id, amount, currency, description, status, created_at
      FROM transactions
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 10
    `;

    const cardsResult = await sql`
      SELECT id, card_number, card_name, card_type, expiry_date
      FROM virtual_cards
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;

    const countResult = await sql`SELECT COUNT(*) FROM transactions WHERE user_id = ${userId}`;
    const totalTransactions = parseInt(countResult.rows[0].count, 10);

    const createdAt = new Date(user.created_at);
    const now = new Date();
    const accountAgeDays = Math.max(0, Math.floor((now - createdAt) / (1000 * 60 * 60 * 24)));

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        balance: parseFloat(user.balance)
      },
      stats: {
        totalTransactions,
        virtualCards: cardsResult.rows.length,
        accountAge: `${accountAgeDays} jour${accountAgeDays > 1 ? 's' : ''}`
      },
      recentTransactions: txnResult.rows.map(t => ({
        amount: parseFloat(t.amount),
        currency: t.currency,
        description: t.description,
        status: t.status,
        createdAt: t.created_at
      })),
      virtualCards: cardsResult.rows.map(c => ({
        cardNumber: c.card_number,
        cardName: c.card_name,
        cardType: c.card_type,
        expiryDate: c.expiry_date
      }))
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erreur chargement dashboard', details: error.message });
  }
};
