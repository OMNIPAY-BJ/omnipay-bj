module.exports = (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body || {};

  // Compte admin de test (démo)
  if (email === 'regis@omnipay.com' && password === 'test123') {
    return res.status(200).json({
      success: true,
      token: Buffer.from(JSON.stringify({ email, role: 'admin' })).toString('base64'),
      user: {
        id: 'admin-001',
        email: 'regis@omnipay.com',
        name: 'Regis AGNIKPE',
        role: 'admin',
        balance: 700000
      }
    });
  }

  return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
};
