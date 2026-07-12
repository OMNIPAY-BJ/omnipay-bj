# 🌍 OmniPay — Plateforme de Paiement Internationale

**OmniPay** est une plateforme de paiement africaine et internationale, conçue pour connecter tout le monde à la finance numérique — cartes bancaires, mobile money, cryptomonnaies et cartes cadeaux.

🔗 **Site** : [https://omnipay-eu.com](https://omnipay-eu.com)  
👤 **Fondateur** : Agnikpe Régis Jean de Dieu Olatounde  
📧 **Contact** : regisagnikpe2002@gmail.com  
🏢 **IFU** : 0202671161075 | **RCCM** : RB/ABC/26 A 142268

---

## ✨ Fonctionnalités

| Fonctionnalité | Description |
|----------------|-------------|
| 💳 **Multi-gateway** | Flutterwave, Paystack, Coinbase, Stripe, PayDunya |
| 🌍 **Routage intelligent** | Sélection automatique de la meilleure gateway par pays/devise |
| 📱 **Mobile Money** | MTN, Orange, Moov, M-Pesa, Wave |
| 🪙 **Crypto** | Bitcoin, Ethereum, USDC, DAI |
| 💳 **Cartes virtuelles** | Mastercard virtuelles pour achats en ligne |
| 🎁 **Cartes cadeaux** | Steam, Transcash, PCS, Amazon, Google Play, iTunes |
| 📊 **Dashboard** | Vue d'ensemble transactions, analytics, historique |
| 🔔 **Webhooks** | Confirmations automatiques de paiement |
| 🔒 **Sécurité** | HMAC, bcrypt, validation des entrées |

---


## 🎨 Interface & thèmes

La page d’accueil utilise une direction visuelle inspirée mobile-first : fond sombre premium, vert OmniPay, accents orange, convertisseur visible et messages de confiance.

### Thèmes disponibles

| Thème | Objectif | Usage recommandé |
|-------|----------|------------------|
| **Bénin Premium** | Identité locale forte et rassurante | Accueil, onboarding, création de compte |
| **Diaspora Monde** | Transferts internationaux et conversions | Sections marketing, paiements et devises |
| **Finance Sécurisée** | Style bancaire professionnel | Connexion, dashboard, opérations sensibles |

### Langues visibles

L’interface met en avant **FR**, **EN** et **PT** pour préparer une expérience Bénin, Afrique, Europe et Monde.

### Où modifier le design

- Page principale : `frontend/app/page.tsx`
- Styles globaux : `frontend/app/globals.css`
- Modules affichés : `frontend/lib/modules.ts`

Les couleurs principales sont centralisées dans `frontend/app/globals.css` :

```css
--omnipay-emerald: #10d6a3;
--omnipay-amber: #f6a313;
--omnipay-navy: #06111f;
```

Pour garder l’interface facile à maintenir, ajouter les nouveaux blocs dans les tableaux `exchangeRates`, `languages`, `themes` ou `services` dans `frontend/app/page.tsx` plutôt que de dupliquer le JSX.

---

## 🚀 Démarrage rapide

### Prérequis
- Node.js 18+
- Compte [Vercel](https://vercel.com) avec Postgres

### Installation

```bash
git clone https://github.com/OMNIPAY-BJ/omnipay-bj.git
cd omnipay-bj
npm install
cp .env.example .env.local
# Remplir les clés API dans .env.local
npx vercel dev
```

### Initialiser la base de données

```bash
curl http://localhost:3000/api/init-db
```

---

## 🏗️ Architecture

```
api/
├── payments/
│   ├── flutterwave.js    # Afrique (Mobile Money + cartes)
│   ├── paystack.js       # Nigeria, Ghana, Kenya, Afrique du Sud
│   ├── coinbase.js       # Bitcoin, Ethereum, USDC
│   ├── router.js         # Routeur intelligent multi-gateway
│   ├── create-checkout.js# Stripe
│   └── paydunya-*.js     # PayDunya (Afrique de l'Ouest)
├── webhooks/
│   ├── flutterwave.js    # Confirmations Flutterwave
│   ├── paystack.js       # Confirmations Paystack (HMAC SHA-512)
│   └── coinbase.js       # Confirmations Coinbase (HMAC SHA-256)
├── cards/
│   ├── virtual.js        # Cartes virtuelles (CRUD)
│   └── create.js         # Création carte (legacy)
├── giftcards/
│   └── index.js          # Catalogue et achat cartes cadeaux
├── middleware/
│   ├── auth.js           # Authentification JWT
│   ├── validation.js     # Validation entrées
│   └── errorHandler.js   # Gestion erreurs
├── auth/                 # login, register
├── dashboard/            # admin, client
└── users/                # balance
```

---

## 📡 Gateways supportées

| Gateway | Région | Devises | Mobile Money |
|---------|--------|---------|-------------|
| **Flutterwave** | 30+ pays africains | XOF, XAF, NGN, GHS... | ✅ MTN, Orange, Moov |
| **Paystack** | NG, GH, KE, ZA | NGN, GHS, KES, ZAR | ✅ M-Pesa |
| **Coinbase** | Mondial | BTC, ETH, USDC, DAI | ❌ |
| **Stripe** | Europe, USA | EUR, USD, GBP | ❌ |
| **PayDunya** | Afrique Ouest | XOF | ✅ Orange, MTN, Wave |

---

## 🔌 API Endpoints

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/payments/router` | Routage automatique |
| POST | `/api/payments/flutterwave` | Paiement Flutterwave |
| POST | `/api/payments/paystack` | Paiement Paystack |
| POST | `/api/payments/coinbase` | Paiement Crypto |
| GET/POST | `/api/cards/virtual` | Cartes virtuelles |
| GET/POST | `/api/giftcards` | Cartes cadeaux |
| POST | `/api/webhooks/flutterwave` | Webhook Flutterwave |
| POST | `/api/webhooks/paystack` | Webhook Paystack |
| POST | `/api/webhooks/coinbase` | Webhook Coinbase |
| POST | `/api/auth/register` | Inscription |
| POST | `/api/auth/login` | Connexion |

---

## 📚 Documentation

- [📖 API Reference](docs/API.md)
- [⚙️ Guide d'installation](docs/SETUP.md)
- [🚀 Déploiement Vercel](docs/DEPLOYMENT.md)
- [🏛️ Architecture technique](docs/ARCHITECTURE.md)

---

## 🔒 Sécurité

- Variables d'environnement pour toutes les clés secrètes
- Vérification HMAC des webhooks
- Mots de passe hachés avec bcrypt
- Validation et sanitisation des entrées utilisateur
- Ne jamais committer les fichiers `.env*` réels

---

## 🌟 Pourquoi OmniPay ?

> *"Stripe refuse l'Afrique. PayPal limite les cartes cadeaux. Square ignore la crypto. OmniPay fait TOUT pour TOUT LE MONDE."*

- **500 millions d'Africains** enfin connectés à la finance numérique
- **Frais compétitifs** à 2.1% vs 2.9-3.49% pour les concurrents
- **Mobile Money natif** pour les marchés sans accès bancaire
- **Crypto intégré** pour les transactions sans frontières

---

## 📄 Licence

© 2026 OmniPay — Agnikpe Régis Jean de Dieu Olatounde  
Tous droits réservés.

