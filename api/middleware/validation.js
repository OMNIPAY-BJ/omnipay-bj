// Middleware de validation et sanitisation des entrées

/**
 * Nettoie une chaîne de caractères pour éviter les injections
 * @param {string} value
 * @returns {string}
 */
function sanitizeString(value) {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/[<>"'`]/g, '');
}

/**
 * Valide un email
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof email === 'string' && re.test(email);
}

/**
 * Valide un montant (doit être un nombre positif)
 * @param {*} amount
 * @returns {boolean}
 */
function isValidAmount(amount) {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0;
}

/**
 * Valide un code pays ISO 3166-1 alpha-2 (2 lettres)
 * @param {string} country
 * @returns {boolean}
 */
function isValidCountryCode(country) {
  return typeof country === 'string' && /^[A-Z]{2}$/.test(country.toUpperCase());
}

/**
 * Valide une devise (3 lettres ISO 4217)
 * @param {string} currency
 * @returns {boolean}
 */
function isValidCurrency(currency) {
  return typeof currency === 'string' && /^[A-Z]{3}$/.test(currency.toUpperCase());
}

/**
 * Middleware de validation générique
 * Vérifie la présence et le type des champs requis
 * @param {Array<{field: string, type: string, required: boolean}>} schema
 */
function validateBody(schema) {
  return (handler) => async (req, res) => {
    const body = req.body || {};
    const errors = [];

    for (const rule of schema) {
      const value = body[rule.field];

      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`Le champ '${rule.field}' est requis.`);
        continue;
      }

      if (value !== undefined && value !== null && value !== '') {
        if (rule.type === 'email' && !isValidEmail(value)) {
          errors.push(`Le champ '${rule.field}' doit être un email valide.`);
        }
        if (rule.type === 'amount' && !isValidAmount(value)) {
          errors.push(`Le champ '${rule.field}' doit être un montant positif.`);
        }
        if (rule.type === 'country' && !isValidCountryCode(value)) {
          errors.push(`Le champ '${rule.field}' doit être un code pays valide (ex: BJ, NG).`);
        }
        if (rule.type === 'currency' && !isValidCurrency(value)) {
          errors.push(`Le champ '${rule.field}' doit être une devise valide (ex: XOF, NGN).`);
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: 'Données invalides', details: errors });
    }

    return handler(req, res);
  };
}

module.exports = { sanitizeString, isValidEmail, isValidAmount, isValidCountryCode, isValidCurrency, validateBody };
