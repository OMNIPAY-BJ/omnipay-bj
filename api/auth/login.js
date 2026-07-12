const crypto = require('crypto');
const { sql } = require('@vercel/postgres');
const { sanitizeString, isValidEmail } = require('../middleware/validation');

function verifyPassword(password, storedHash) {
  const [salt, hash] = String(storedHash || '').split(':');

  if (!salt || !hash) {
    return false;
  }

  const candidate = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  const candidateBuffer = Buffer.from(candidate, 'hex');
  const hashBuffer = Buffer.from(hash, 'hex');

  if (candidateBuffer.length !== hashBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(candidateBuffer, hashBuffer);
}

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    return res.status(200).json({ success: true, service: 'login', methods: ['POST'] });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const email = sanitizeString(req.body?.email || '').toLowerCase();
    const password = String(req.body?.password || '');

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Email invalide.' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Le mot de passe est requis.' });
    }

    const result = await sql`
      SELECT id, email, password_hash, name, phone, role, balance, created_at
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `;

    const user = result.rows[0];
    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    }

    delete user.password_hash;
    const token = Buffer.from(JSON.stringify({ id: user.id, email: user.email, role: user.role })).toString('base64');

    return res.status(200).json({ success: true, user, token });
  } catch (error) {
    return res.status(500).json({ error: 'Erreur connexion compte', details: error.message });
  }
};
