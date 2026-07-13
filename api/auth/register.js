const { sql } = require('@vercel/postgres');
const crypto = require('crypto');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function createToken(user) {
  return Buffer.from(JSON.stringify({ id: user.id, email: user.email, role: user.role || 'client' })).toString('base64');
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

async function readBody(req) {
  if (req.body && Object.keys(req.body).length > 0) return req.body;

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const rawBody = Buffer.concat(chunks).toString('utf8');
  if (!rawBody) return {};

  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('application/json')) return JSON.parse(rawBody);
  if (contentType.includes('application/x-www-form-urlencoded')) {
    return Object.fromEntries(new URLSearchParams(rawBody).entries());
  }
  return {};
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { name = '', email = '', phone = '', password = '' } = await readBody(req);
    const normalizedEmail = String(email).trim().toLowerCase();

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      return res.status(400).json({ error: 'Email invalide' });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères' });
    }

    const passwordHash = hashPassword(String(password));
    const result = await sql`
      INSERT INTO users (email, password_hash, name, phone, role)
      VALUES (${normalizedEmail}, ${passwordHash}, ${String(name).trim()}, ${String(phone).trim()}, 'client')
      RETURNING id, email, name, phone, role, balance, created_at
    `;

    const user = result.rows[0];
    return res.status(201).json({
      success: true,
      message: 'Compte créé avec succès',
      user,
      token: createToken(user)
    });
  } catch (error) {
    if (error && error.code === '23505') {
      return res.status(409).json({ error: 'Un compte existe déjà avec cet email' });
    }
    return res.status(500).json({ error: 'Erreur création compte', details: error.message });
  }
};
