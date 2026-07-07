const { sql } = require('@vercel/postgres');
const bcrypt = require('bcryptjs');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, name, phone } = req.body || {};

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, mot de passe et nom requis' });
    }

    const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await sql`
      INSERT INTO users (email, password_hash, name, phone, role, balance)
      VALUES (${email}, ${passwordHash}, ${name}, ${phone || ''}, 'client', 0)
      RETURNING id, email, name, role, balance
    `;

    return res.status(200).json({
      success: true,
      message: 'Compte créé avec succès',
      user: result.rows[0]
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erreur inscription', details: error.message });
  }
};
