const { sql } = require('@vercel/postgres');

module.exports = async (req, res) => {
  try {
    const adminResult = await sql`SELECT id, name, balance FROM users WHERE role = 'admin' ORDER BY created_at ASC LIMIT 1`;

    if (adminResult.rows.length === 0) {
      return res.status(404).json({ error: 'Aucun compte administrateur trouvé' });
    }
    const admin = adminResult.rows[0];

    const usersCountResult = await sql`SELECT COUNT(*) FROM users`;
    const totalBalanceResult = await sql`SELECT COALESCE(SUM(balance), 0) AS total FROM users`;
    const txnCountResult = await sql`SELECT COUNT(*) FROM transactions`;
    const cardsCountResult = await sql`SELECT COUNT(*) FROM virtual_cards`;

    const txnResult = await sql`
      SELECT user_id, amount, currency, description, status, created_at
      FROM transactions
      ORDER BY created_at DESC
      LIMIT 10
    `;

    return res.status(200).json({
      success: true,
      admin: {
        name: admin.name,
        balance: parseFloat(admin.balance)
      },
      stats: {
        totalUsers: parseInt(usersCountResult.rows[0].count, 10),
        totalBalance: parseFloat(totalBalanceResult.rows[0].total),
        totalTransactions: parseInt(txnCountResult.rows[0].count, 10),
        totalCards: parseInt(cardsCountResult.rows[0].count, 10)
      },
      recentTransactions: txnResult.rows.map(t => ({
        userId: t.user_id,
        amount: parseFloat(t.amount),
        currency: t.currency,
        description: t.description,
        status: t.status,
        createdAt: t.created_at
      }))
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erreur chargement dashboard admin', details: error.message });
  }
};
