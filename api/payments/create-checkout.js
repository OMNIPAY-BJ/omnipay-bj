const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, description } = req.body || {};

    if (!amount || amount < 100) {
      return res.status(400).json({ error: 'Montant invalide (minimum 100 FCFA)' });
    }

    // Stripe ne supporte pas XOF directement en Checkout -> on utilise EUR pour le test
    // (1 EUR ~ 655 FCFA, à ajuster selon votre besoin réel plus tard)
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: description || 'Paiement OmniPay',
            },
            unit_amount: Math.round(amount * 100), // centimes
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.origin}/payment-success.html`,
      cancel_url: `${req.headers.origin}/payment-cancel.html`,
    });

    return res.status(200).json({ success: true, url: session.url });
  } catch (error) {
    return res.status(500).json({ error: 'Erreur Stripe', details: error.message });
  }
};
