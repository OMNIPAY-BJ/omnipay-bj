# OmniPay - Guide de déploiement sur Vercel

## Déploiement rapide

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/OMNIPAY-BJ/omnipay-bj)

---

## Déploiement manuel

### 1. Installer Vercel CLI

```bash
npm install -g vercel
vercel login
```

### 2. Déployer

```bash
cd omnipay-bj
vercel --prod
```

---

## Configuration des secrets Vercel

### Via Dashboard Vercel

1. Aller sur [vercel.com/dashboard](https://vercel.com/dashboard)
2. Sélectionner votre projet **omnipay-bj**
3. Cliquer sur **Settings > Environment Variables**
4. Ajouter chaque variable du fichier `.env.example`

### Variables obligatoires

| Variable | Description |
|----------|-------------|
| `POSTGRES_URL` | URL de connexion Vercel Postgres |
| `STRIPE_SECRET_KEY` | Clé secrète Stripe |
| `FLUTTERWAVE_SECRET_KEY` | Clé secrète Flutterwave |
| `PAYSTACK_SECRET_KEY` | Clé secrète Paystack |
| `COINBASE_COMMERCE_API_KEY` | Clé API Coinbase Commerce |

### Variables optionnelles (webhooks)

| Variable | Description |
|----------|-------------|
| `FLUTTERWAVE_WEBHOOK_SECRET` | Hash de vérification Flutterwave |
| `COINBASE_COMMERCE_WEBHOOK_SECRET` | Secret webhook Coinbase |

### Via Vercel CLI

```bash
# Ajouter une variable
vercel env add FLUTTERWAVE_SECRET_KEY production

# Lister les variables
vercel env ls

# Supprimer une variable
vercel env rm VARIABLE_NAME
```

---

## Configuration Vercel Postgres

### Créer la base de données

1. Aller sur [vercel.com/dashboard](https://vercel.com/dashboard)
2. Cliquer sur **Storage > Create Database > Postgres**
3. Nommer la base `omnipay-db`
4. Cliquer sur **Connect to Project**

Les variables `POSTGRES_*` seront automatiquement ajoutées à votre projet.

### Initialiser les tables

Après le premier déploiement :
```bash
curl https://your-project.vercel.app/api/init-db
```

---

## Configuration des domaines

### Domaine personnalisé

1. Aller dans **Settings > Domains**
2. Ajouter `omnipay-eu.com`
3. Configurer les DNS chez votre registrar :
   - `A record` → `76.76.21.21`
   - `CNAME www` → `cname.vercel-dns.com`

---

## Configuration des webhooks en production

Configurer les URLs de webhook dans chaque gateway :

| Gateway | URL Webhook |
|---------|-------------|
| Flutterwave | `https://omnipay-eu.com/api/webhooks/flutterwave` |
| Paystack | `https://omnipay-eu.com/api/webhooks/paystack` |
| Coinbase Commerce | `https://omnipay-eu.com/api/webhooks/coinbase` |
| Stripe | `https://omnipay-eu.com/api/webhooks/stripe` |

---

## Vérification post-déploiement

```bash
# Vérifier la santé de l'API
curl https://omnipay-eu.com/api/health

# Vérifier les tables DB
curl https://omnipay-eu.com/api/init-db

# Tester un paiement Flutterwave (mode test)
curl -X POST https://omnipay-eu.com/api/payments/flutterwave \
  -H "Content-Type: application/json" \
  -d '{"amount":100,"currency":"XOF","email":"test@omnipay-eu.com","name":"Test","country":"BJ"}'
```

---

## Environnements

| Environnement | Branche | URL |
|--------------|---------|-----|
| Production | `main` | `https://omnipay-eu.com` |
| Staging | `staging` | `https://staging.omnipay-eu.com` |
| Preview | Toutes les PR | `https://omnipay-bj-*.vercel.app` |

Pour basculer entre modes test et production des gateways, modifier les clés API dans les variables d'environnement Vercel selon l'environnement.
