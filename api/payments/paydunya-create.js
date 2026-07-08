const MODE = process.env.PAYDUNYA_MODE || 'test';
const BASE_URL = MODE === 'live'
  ? 'https://app.paydunya.com/api/v1'
  : 'https://app.paydunya.com/sandbox-api/v1';

function getKeys() {
  if (MODE === 'live') {
    return {
      masterKey: process.env.PAYDUNYA_MASTER_KEY,
      privateKey: process.env.PAYDUNYA_PRIVATE_KEY_LIVE,
      publicKey: process.env.PAYDUNYA_PUBLIC_KEY_LIVE,
      token: process.env.PAYDUNYA_TOKEN_LIVE
    };
  }
  return {
    masterKey: process.env.PAYDUNYA_MASTER_KEY,
    privateKey: process.env.PAYDUNYA_PRIVATE_KEY_TEST,
    publicKey: process.env.PAYDUNYA_PUBLIC_KEY_TEST,
    token: process.env.PAYDUNYA_TOKEN_TEST
  };
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, description, userId } = req.body || {};

    if (!amount || !userId) {
      return res.status(400).json({ error: 'amount et userId requis' });
    }

    const keys = getKeys();
    if (!keys.masterKey || !keys.privateKey || !keys.publicKey || !keys.token) {
      return res.status(500).json({ error: 'Configuration PayDunya incomplete', details: 'Cles API manquantes dans les variables environnement' });
    }

    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host;
    const baseAppUrl = `${protocol}://${host}`;

    const payload = {
      invoice: {
        total_amount: Number(amount),
        description: description || 'Recharge OmniPay'
      },
      store: {
        name: 'OmniPay',
        website_url: baseAppUrl
      },
      actions: {
        return_url: `${baseAppUrl}/payment-success.html`,
        cancel_url: `${baseAppUrl}/payment-cancel.html`
      },
      custom_data: {
        userId: String(userId)
      }
    };

    const response = await fetch(`${BASE_URL}/checkout-invoice/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'PAYDUNYA-MASTER-KEY': keys.masterKey,
        'PAYDUNYA-PRIVATE-KEY': keys.privateKey,
        'PAYDUNYA-PUBLIC-KEY': keys.publicKey,
        'PAYDUNYA-TOKEN': keys.token
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (data.response_code !== '00') {
      return res.status(400).json({ error: 'Erreur PayDunya', details: data.response_text || 'Creation facture echouee' });
    }

    await sqlInsertTransaction(userId, amount, description, data.token);

    return res.status(200).json({
      success: true,
      checkoutUrl: data.response_text,
      token: data.token
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erreur PayDunya', details: error.message });
  }
};

async function sqlInsertTransaction(userId, amount, description, token) {
  const { sql } = require('@vercel/postgres');
  await sql`
    INSERT INTO transactions (user_id, amount, currency, description, status, paydunya_token)
    VALUES (${userId}, ${amount}, 'FCFA', ${description || 'Recharge OmniPay'}, 'pending', ${token})
  `;
}
