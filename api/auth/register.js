const crypto = require('crypto');
const { sql } = require('@vercel/postgres');
const { sanitizeString, isValidEmail } = require('../middleware/validation');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function getOwnerEmails() {
  return [
    process.env.OMNIPAY_OWNER_EMAIL,
    process.env.OWNER_EMAIL,
    'totijulien7@gmail.com'
  ]
    .filter(Boolean)
    .map((email) => String(email).trim().toLowerCase());
}

async function resolveRole(email) {
  const ownerEmails = getOwnerEmails();
  const userCount = await sql`SELECT COUNT(*)::int AS count FROM users`;
  const ownerCount = await sql`SELECT COUNT(*)::int AS count FROM users WHERE role IN ('pdg', 'owner', 'admin')`;
  const isFirstUser = Number(userCount.rows[0]?.count || 0) === 0;
  const hasNoOwner = Number(ownerCount.rows[0]?.count || 0) === 0;

  if ((isFirstUser || ownerEmails.includes(email)) && hasNoOwner) {
    return 'pdg';
  }

  return 'client';
}

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    return res.status(200).json({ success: true, service: 'register', methods: ['POST'] });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const email = sanitizeString(req.body?.email || '').toLowerCase();
    const name = sanitizeString(req.body?.name || '');
    const phone = sanitizeString(req.body?.phone || '');
    const password = String(req.body?.password || '');

    if (!name) {
      return res.status(400).json({ error: 'Le nom est requis.' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Email invalide.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères.' });
    }

    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        phone VARCHAR(50),
        role VARCHAR(20) DEFAULT 'client',
        balance NUMERIC DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;

    const existing = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`;
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Un compte existe déjà avec cet email.' });
    }

    const role = await resolveRole(email);
    const result = await sql`
      INSERT INTO users (email, password_hash, name, phone, role)
      VALUES (${email}, ${hashPassword(password)}, ${name}, ${phone || null}, ${role})
      RETURNING id, email, name, phone, role, balance, created_at
    `;

    const user = result.rows[0];
    const token = Buffer.from(JSON.stringify({ id: user.id, email: user.email, role: user.role })).toString('base64');

    return res.status(201).json({ success: true, user, token });
  } catch (error) {
    return res.status(500).json({ error: 'Erreur création compte', details: error.message });
  }
};
