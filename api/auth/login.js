const { sql } = require('@vercel/postgres');
const crypto = require('crypto');

function createToken(user) {
  return Buffer.from(JSON.stringify({ id: user.id, email: user.email, role: user.role || 'client' })).toString('base64');
}

function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.startsWith('scrypt$')) return false;
  const [, salt, expectedHash] = storedHash.split('$');
  if (!salt || !expectedHash) return false;

  const actualHash = crypto.scryptSync(password, salt, 64);
  const expectedBuffer = Buffer.from(expectedHash, 'hex');
  return actualHash.length === expectedBuffer.length && crypto.timingSafeEqual(actualHash, expectedBuffer);
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
    const { email = '', password = '' } = await readBody(req);
    const normalizedEmail = String(email).trim().toLowerCase();

    const result = await sql`
      SELECT id, email, password_hash, name, phone, role, balance, created_at
      FROM users
      WHERE email = ${normalizedEmail}
      LIMIT 1
    `;

    const user = result.rows[0];
    if (!user || !verifyPassword(String(password), user.password_hash)) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const { password_hash: _passwordHash, ...safeUser } = user;
    return res.status(200).json({
      success: true,
      message: 'Connexion réussie',
      user: safeUser,
      token: createToken(safeUser)
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erreur connexion', details: error.message });
  }
};
