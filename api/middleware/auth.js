// Middleware d'authentification - vérifie le token ****** Le token est un base64 de {id, email, role} généré lors du login

/**
 * Décode et valide le token d'authentification
 * @param {string} authHeader - Header Authorization (******
 * @returns {{ id, email, role } | null}
 */
function decodeToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    const token = authHeader.slice(7);
    const payload = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
    if (!payload.id || !payload.email) return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Middleware d'authentification obligatoire
 * Renvoie 401 si le token est absent ou invalide
 */
function requireAuth(handler) {
  return async (req, res) => {
    const user = decodeToken(req.headers['authorization']);
    if (!user) {
      return res.status(401).json({ error: 'Non autorisé. Token requis.' });
    }
    req.user = user;
    return handler(req, res);
  };
}

/**
 * Middleware d'authentification admin uniquement
 */
function requireAdmin(handler) {
  return async (req, res) => {
    const user = decodeToken(req.headers['authorization']);
    if (!user) {
      return res.status(401).json({ error: 'Non autorisé. Token requis.' });
    }
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé. Droits administrateur requis.' });
    }
    req.user = user;
    return handler(req, res);
  };
}

module.exports = { decodeToken, requireAuth, requireAdmin };
