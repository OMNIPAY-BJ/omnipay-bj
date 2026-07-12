// Connecteur Wise - Wise sert aux transferts/payouts, pas au checkout client classique

const { missingEnv, requirePost, validatePaymentInput } = require('../lib/gateway-utils');

module.exports = async (req, res) => {
  if (!requirePost(req, res)) return;

  try {
    const { amount, sourceCurrency = 'EUR', targetCurrency = 'XOF', email } = req.body || {};
    const validationError = validatePaymentInput({ amount, email, requireEmail: false });
    if (validationError) return res.status(400).json({ error: validationError });

    const missing = missingEnv(['WISE_API_TOKEN', 'WISE_PROFILE_ID']);
    if (missing.length > 0) {
      return res.status(500).json({ error: 'Configuration Wise incomplète', details: `${missing.join(', ')} manquante(s)` });
    }

    return res.status(501).json({
      error: 'Wise checkout non disponible',
      details: 'Wise est un connecteur de transfert/payout. Ajoute les champs recipientAccountId et quoteId pour activer une route de transfert sécurisée.',
      requestedTransfer: { amount: parseFloat(amount), sourceCurrency: sourceCurrency.toUpperCase(), targetCurrency: targetCurrency.toUpperCase() }
    });
  } catch (error) {
    console.error('[Wise]', error.message);
    return res.status(500).json({ error: 'Erreur Wise', details: error.message });
  }
};
