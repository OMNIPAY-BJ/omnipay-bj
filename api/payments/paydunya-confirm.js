const { sql } = require('@vercel/postgres');

const MODE = process.env.PAYDUNYA_MODE || 'test';
const BASE_URL = MODE === 'live'
  ? 'https://app.paydunya.com/api/v1'
  : 'https://app.paydunya.com/sandbox-api/v1';

function getKeys() {
  return {
    masterKey: process.env.PAYDUNYA_MASTER_KEY,
    privateKey: process.env.PAYDUNYA_PRIVATE_KEY,
    publicKey: process.env.PAYDUNYA_PUBLIC_KEY,
    token: process.env.PAYDUNYA_TOKEN
  };
}

module.exports = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ error: 'token requis' });
    }

    const keys = getKeys();
    const response = await fetch(`${BASE_URL}/checkout-invoice/confirm/${token}`, {
      method: 'GET',
      headers: {
        'PAYDUNYA-MASTER-KEY': keys.masterKey,
        'PAYDUNYA-PRIVATE-KEY': keys.privateKey,
        'PAYDUNYA-PUBLIC-KEY': keys.publicKey,
        'PAYDUNYA-TOKEN': keys.token
      }
    });

    const data = await response.json();

    if (data.status === 'completed') {
      const existing = await sql`SELECT status, user_id, amount FROM transactions WHERE paydunya_token = ${token}`;

      if (existing.rows.length > 0 && existing.rows[0].status !== 'completed') {
        const { user_id, amount } = existing.rows[0];

        await sql`UPDATE transactions SET status = 'completed' WHERE paydunya_token = ${token}`;

        await sql`
          UPDATE users
          SET balance = balance + ${amount}
          WHERE id = ${user_id}
        `;
      }

      return res.status(200).json({ success: true, status: 'paid' });
    }

    return res.status(200).json({ success: true, status: data.status || 'pending' });
  } catch (error) {
    return res.status(500).json({ error: 'Erreur confirmation PayDunya', details: error.message });
  }
};
