# OmniPay - Guide d'installation

## Prérequis

- Node.js 18+
- Compte [Vercel](https://vercel.com)
- Compte [Vercel Postgres](https://vercel.com/storage/postgres)
- Clés API des gateways souhaitées

---

## Installation locale

### 1. Cloner le dépôt

```bash
git clone https://github.com/OMNIPAY-BJ/omnipay-bj.git
cd omnipay-bj
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer les variables d'environnement

```bash
cp .env.example .env.local
```

Éditer `.env.local` et remplir les clés API nécessaires :

```env
# Base de données
POSTGRES_URL=postgresql://...

# Flutterwave (recommandé pour l'Afrique)
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-...
FLUTTERWAVE_WEBHOOK_SECRET=your_hash

# Paystack (Nigeria, Ghana, Kenya)
PAYSTACK_SECRET_KEY=sk_test_...

# Stripe (Europe, USA)
STRIPE_SECRET_KEY=sk_test_...
```

### 4. Initialiser la base de données

```bash
curl http://localhost:3000/api/init-db
```

### 5. Démarrer le serveur de développement

```bash
npx vercel dev
```

L'application sera disponible sur `http://localhost:3000`.

---

## Configuration des gateways

### Flutterwave

1. Créer un compte sur [dashboard.flutterwave.com](https://dashboard.flutterwave.com)
2. Aller dans **Settings > API Keys**
3. Copier `Secret Key` dans `FLUTTERWAVE_SECRET_KEY`
4. Configurer le webhook : `https://omnipay-eu.com/api/webhooks/flutterwave`
5. Copier le hash secret dans `FLUTTERWAVE_WEBHOOK_SECRET`

### Paystack

1. Créer un compte sur [dashboard.paystack.com](https://dashboard.paystack.com)
2. Aller dans **Settings > API Keys & Webhooks**
3. Copier `Secret Key` dans `PAYSTACK_SECRET_KEY`
4. Configurer le webhook : `https://omnipay-eu.com/api/webhooks/paystack`

### Coinbase Commerce

1. Créer un compte sur [commerce.coinbase.com](https://commerce.coinbase.com)
2. Aller dans **Settings > Security**
3. Créer une clé API → `COINBASE_COMMERCE_API_KEY`
4. Créer un webhook secret → `COINBASE_COMMERCE_WEBHOOK_SECRET`
5. URL webhook : `https://omnipay-eu.com/api/webhooks/coinbase`

### PayDunya

1. Créer un compte sur [app.paydunya.com](https://app.paydunya.com)
2. Récupérer les 4 clés dans **Paramètres > API**
3. Remplir `PAYDUNYA_MASTER_KEY`, `PAYDUNYA_PRIVATE_KEY`, `PAYDUNYA_PUBLIC_KEY`, `PAYDUNYA_TOKEN`

### Stripe

1. Créer un compte sur [dashboard.stripe.com](https://dashboard.stripe.com)
2. Aller dans **Developers > API Keys**
3. Copier `Secret key` dans `STRIPE_SECRET_KEY`

---

## Structure du projet

```
omnipay-bj/
├── api/
│   ├── auth/           # login, register
│   ├── cards/          # cartes virtuelles
│   ├── giftcards/      # cartes cadeaux
│   ├── middleware/     # auth, validation, errorHandler
│   ├── payments/       # flutterwave, paystack, coinbase, stripe, router
│   ├── users/          # balance
│   ├── webhooks/       # confirmations gateway
│   ├── dashboard/      # admin, client
│   ├── health.js       # healthcheck
│   └── init-db.js      # initialisation BDD
├── public/             # Pages HTML frontend
├── docs/               # Documentation
├── .env.example        # Template variables d'environnement
├── package.json
└── vercel.json
```

---

## Tests avec Postman

Importer la collection depuis `docs/API.md` ou utiliser les exemples cURL.

### Test basique

```bash
# Santé de l'API
curl https://omnipay-eu.com/api/health

# Créer un compte
curl -X POST https://omnipay-eu.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}'
```
