// Gestionnaire d'erreurs centralisé

/**
 * Enveloppe un handler dans un bloc try/catch standardisé
 * @param {Function} handler
 * @returns {Function}
 */
function withErrorHandler(handler) {
  return async (req, res) => {
    try {
      return await handler(req, res);
    } catch (error) {
      console.error('[OmniPay Error]', {
        path: req.url,
        method: req.method,
        message: error.message,
        stack: error.stack
      });

      // Ne pas exposer les détails en production
      const isDev = process.env.NODE_ENV !== 'production';
      return res.status(500).json({
        error: 'Erreur interne du serveur',
        ...(isDev && { details: error.message })
      });
    }
  };
}

/**
 * Renvoie une réponse d'erreur formatée
 * @param {object} res - Response object
 * @param {number} status - HTTP status code
 * @param {string} message - Error message
 * @param {*} [details] - Optional details
 */
function sendError(res, status, message, details) {
  const body = { error: message };
  if (details !== undefined) body.details = details;
  return res.status(status).json(body);
}

module.exports = { withErrorHandler, sendError };
