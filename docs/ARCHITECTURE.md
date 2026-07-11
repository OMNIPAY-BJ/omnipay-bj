# OmniPay - Architecture Technique

## Vue d'ensemble

OmniPay est une application serverless déployée sur Vercel, avec une architecture multi-gateway permettant de router les paiements vers la meilleure plateforme selon le pays et la devise du client.

```
Client Browser
     │
     ▼
┌─────────────────────────────────────────┐
│            Vercel Edge Network          │
│         (CDN + Rate Limiting)           │
└─────────────────┬───────────────────────┘
                  │
     ┌────────────▼────────────┐
     │   Static Files (HTML)   │
     │   public/               │
     └────────────┬────────────┘
                  │
     ┌────────────▼────────────────────────────┐
     │         Vercel Serverless Functions     │
     │         (api/ directory)                │
     │                                         │
     │  ┌──────────┐  ┌──────────┐             │
     │  │  /auth   │  │  /users  │             │
     │  └──────────┘  └──────────┘             │
     │                                         │
     │  ┌─────────────────────────────────┐    │
     │  │    Gateway Router               │    │
     │  │    /api/payments/router         │    │
     │  │  ┌─────────┐ ┌─────────────┐   │    │
     │  │  │ Country │ │  Currency   │   │    │
     │  │  │  Map    │ │    Map      │   │    │
     │  │  └────┬────┘ └──────┬──────┘   │    │
     │  └───────┼─────────────┼──────────┘    │
     │          │             │               │
     │  ┌───────▼─────────────▼────────────┐  │
     │  │         Payment Gateways          │  │
     │  │  ┌──────────┐ ┌──────────────┐   │  │
     │  │  │Flutterwave│ │   Paystack   │   │  │
     │  │  └──────────┘ └──────────────┘   │  │
     │  │  ┌──────────┐ ┌──────────────┐   │  │
     │  │  │ Coinbase │ │    Stripe    │   │  │
     │  │  └──────────┘ └──────────────┘   │  │
     │  │  ┌──────────┐                    │  │
     │  │  │ PayDunya │                    │  │
     │  │  └──────────┘                    │  │
     │  └──────────────────────────────────┘  │
     │                                         │
     │  ┌──────────────────────────────────┐   │
     │  │          Webhooks                │   │
     │  │  /api/webhooks/{gateway}         │   │
     │  └──────────────────────────────────┘   │
     │                                         │
     └────────────┬────────────────────────────┘
                  │
     ┌────────────▼────────────┐
     │    Vercel Postgres      │
     │  (PostgreSQL Database)  │
     │                         │
     │  ┌─────────────────┐    │
     │  │     users       │    │
     │  ├─────────────────┤    │
     │  │  transactions   │    │
     │  ├─────────────────┤    │
     │  │  virtual_cards  │    │
     │  ├─────────────────┤    │
     │  │  gateway_logs   │    │
     │  └─────────────────┘    │
     └─────────────────────────┘
```

---

## Structure des fichiers

```
api/
├── auth/
│   ├── login.js          # Connexion utilisateur
│   └── register.js       # Inscription utilisateur
│
├── cards/
│   ├── create.js          # Créer une carte virtuelle (legacy)
│   └── virtual.js         # CRUD cartes virtuelles
│
├── giftcards/
│   └── index.js           # Liste et achat cartes cadeaux
│
├── middleware/
│   ├── auth.js            # Vérification token d'authentification
│   ├── validation.js      # Validation et sanitisation entrées
│   └── errorHandler.js    # Gestion centralisée des erreurs
│
├── payments/
│   ├── create-checkout.js # Stripe (legacy)
│   ├── confirm.js         # Confirmation Stripe
│   ├── paydunya-create.js # PayDunya (legacy)
│   ├── paydunya-confirm.js# Confirmation PayDunya
│   ├── flutterwave.js     # Intégration Flutterwave
│   ├── paystack.js        # Intégration Paystack
│   ├── coinbase.js        # Intégration Coinbase Commerce
│   └── router.js          # Routeur intelligent multi-gateway
│
├── webhooks/
│   ├── flutterwave.js     # Webhook Flutterwave
│   ├── paystack.js        # Webhook Paystack (HMAC SHA-512)
│   └── coinbase.js        # Webhook Coinbase (HMAC SHA-256)
│
├── dashboard/
│   ├── admin.js           # Dashboard administrateur
│   └── client/[userId].js # Dashboard client
│
├── users/
│   └── balance.js         # Solde utilisateur
│
├── health.js              # Healthcheck API
└── init-db.js             # Initialisation base de données
```

---

## Logique de routage des gateways

Le routeur (`api/payments/router.js`) applique la logique suivante :

```
1. Crypto demandé (isCrypto=true ou devise=BTC/ETH/...) ?
   └── Coinbase Commerce

2. Devise connue dans le mapping ?
   ├── XOF/XAF → Flutterwave
   ├── NGN     → Paystack
   ├── GHS/KES → Paystack
   ├── USD/EUR → Stripe
   └── BTC/ETH → Coinbase

3. Pays dans le mapping ?
   ├── BJ/CI/SN/ML/BF/TG → [Flutterwave, Paystack]
   ├── NG/GH              → [Paystack, Flutterwave]
   ├── KE/ZA              → [Paystack, Flutterwave]
   └── US/GB/FR           → [Stripe]

4. Fallback : première gateway disponible
```

---

## Schéma de la base de données

### Table `users`

| Colonne | Type | Description |
|---------|------|-------------|
| id | SERIAL PK | Identifiant unique |
| email | VARCHAR(255) UNIQUE | Email utilisateur |
| password_hash | VARCHAR(255) | Mot de passe haché (bcrypt) |
| name | VARCHAR(255) | Nom complet |
| phone | VARCHAR(50) | Téléphone |
| role | VARCHAR(20) | 'client' ou 'admin' |
| balance | NUMERIC | Solde en unité de compte |
| created_at | TIMESTAMP | Date de création |

### Table `transactions`

| Colonne | Type | Description |
|---------|------|-------------|
| id | SERIAL PK | Identifiant unique |
| user_id | INTEGER FK | Référence utilisateur |
| amount | NUMERIC | Montant |
| currency | VARCHAR(10) | Devise (XOF, EUR, USD...) |
| description | TEXT | Description |
| status | VARCHAR(30) | pending/completed/failed/pending_crypto |
| stripe_session_id | VARCHAR(255) | ID session Stripe |
| paydunya_token | VARCHAR(255) | Token PayDunya |
| gateway | VARCHAR(30) | Gateway utilisée |
| gateway_ref | VARCHAR(255) | Référence unique gateway |
| created_at | TIMESTAMP | Date |

### Table `virtual_cards`

| Colonne | Type | Description |
|---------|------|-------------|
| id | SERIAL PK | Identifiant unique |
| user_id | INTEGER FK | Référence utilisateur |
| card_number | VARCHAR(30) | Numéro de carte masqué |
| card_name | VARCHAR(255) | Nom sur la carte |
| card_type | VARCHAR(30) | Type (Virtual Mastercard...) |
| expiry_date | VARCHAR(10) | Date expiration MM/YY |
| created_at | TIMESTAMP | Date de création |

### Table `gateway_logs`

| Colonne | Type | Description |
|---------|------|-------------|
| id | SERIAL PK | Identifiant unique |
| tx_ref | VARCHAR(255) | Référence transaction |
| gateway | VARCHAR(30) | Gateway sélectionnée |
| country | VARCHAR(5) | Code pays |
| currency | VARCHAR(10) | Devise |
| status | VARCHAR(30) | Statut du routage |
| created_at | TIMESTAMP | Date |

---

## Sécurité

### Authentification
- Token base64 encodé depuis `{id, email, role}`
- Middleware `requireAuth` pour les routes protégées
- Middleware `requireAdmin` pour les routes admin

### Webhooks
- Flutterwave : vérification header `verif-hash`
- Paystack : HMAC SHA-512 sur le corps de la requête
- Coinbase : HMAC SHA-256 sur le corps de la requête

### Données
- Mots de passe hachés avec bcrypt (salt=10)
- Variables d'environnement pour toutes les clés secrètes
- Sanitisation des entrées utilisateur

---

## Gateways supportées

| Gateway | Pays | Devises | Mobile Money |
|---------|------|---------|-------------|
| Flutterwave | 30+ pays africains | XOF, XAF, NGN, GHS, KES... | MTN, Orange, Moov, M-Pesa |
| Paystack | NG, GH, KE, ZA, CI | NGN, GHS, KES, ZAR, XOF | M-Pesa, Mobile Money |
| Coinbase Commerce | Mondial | BTC, ETH, USDC, DAI, LTC | - |
| Stripe | Europe, USA | EUR, USD, GBP, 135+ | - |
| PayDunya | Afrique Ouest | XOF | Orange, MTN, Moov, Wave |
