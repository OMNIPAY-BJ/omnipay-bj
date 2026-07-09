# OmniPay - Documentation API

## Aperçu

OmniPay est une plateforme de paiement internationale supportant plusieurs gateways :
- **Flutterwave** : Afrique (Mobile Money, cartes)
- **Paystack** : Nigeria, Ghana, Kenya, Afrique du Sud
- **Coinbase Commerce** : Bitcoin, Ethereum, USDC
- **Stripe** : Europe, USA (cartes internationales)
- **PayDunya** : Afrique de l'Ouest francophone

Base URL : `https://omnipay-eu.com`

---

## Authentification

Toutes les requêtes protégées nécessitent un header :
```
Authorization: ******
```

Le token est obtenu via l'endpoint `/api/auth/login`.

---

## Endpoints

### Authentification

#### POST /api/auth/register
Créer un compte utilisateur.

**Body :**
```json
{
  "email": "user@example.com",
  "password": "motdepasse123",
  "name": "Jean Dupont",
  "phone": "+229 90 00 00 00"
}
```

**Réponse :**
```json
{
  "success": true,
  "message": "Compte créé avec succès",
  "user": { "id": 1, "email": "user@example.com", "name": "Jean Dupont" }
}
```

#### POST /api/auth/login
Se connecter et obtenir un token.

**Body :**
```json
{
  "email": "user@example.com",
  "password": "motdepasse123"
}
```

**Réponse :**
```json
{
  "success": true,
  "token": "eyJ...",
  "user": { "id": 1, "email": "...", "name": "...", "role": "client", "balance": 0 }
}
```

---

### Paiements

#### POST /api/payments/router
**Routeur intelligent** — sélectionne automatiquement la meilleure gateway.

**Body :**
```json
{
  "amount": 5000,
  "currency": "XOF",
  "email": "client@example.com",
  "name": "Jean Dupont",
  "phone": "+229 90 00 00 00",
  "description": "Recharge OmniPay",
  "userId": 42,
  "country": "BJ",
  "isCrypto": false,
  "redirectUrl": "https://omnipay-eu.com/payment-success.html"
}
```

**Réponse :**
```json
{
  "success": true,
  "selectedGateway": "flutterwave",
  "gatewayEndpoint": "/api/payments/flutterwave",
  "txRef": "OMNIPAY-ROUTER-1720000000",
  "message": "Paiement routé vers flutterwave"
}
```

#### POST /api/payments/flutterwave
Créer un paiement Flutterwave (Afrique).

**Body :**
```json
{
  "amount": 5000,
  "currency": "XOF",
  "email": "client@example.com",
  "name": "Jean Dupont",
  "phone": "+229 90 00 00 00",
  "description": "Recharge OmniPay",
  "userId": 42,
  "country": "BJ"
}
```

**Réponse :**
```json
{
  "success": true,
  "gateway": "flutterwave",
  "txRef": "OMNIPAY-FLW-1720000000-ABC123",
  "paymentUrl": "https://checkout.flutterwave.com/v3/hosted/pay/..."
}
```

#### POST /api/payments/paystack
Créer un paiement Paystack (Nigeria, Ghana, Kenya...).

**Body :**
```json
{
  "amount": 5000,
  "currency": "NGN",
  "email": "client@example.com",
  "name": "John Doe",
  "description": "OmniPay Top-up",
  "userId": 42
}
```

**Réponse :**
```json
{
  "success": true,
  "gateway": "paystack",
  "reference": "OMNIPAY-PSK-1720000000-XYZ",
  "accessCode": "ACCESS_CODE",
  "paymentUrl": "https://checkout.paystack.com/..."
}
```

#### POST /api/payments/coinbase
Créer un paiement crypto (Coinbase Commerce).

**Body :**
```json
{
  "amount": 10,
  "currency": "USD",
  "description": "OmniPay Crypto Payment",
  "userId": 42,
  "email": "client@example.com"
}
```

**Réponse :**
```json
{
  "success": true,
  "gateway": "coinbase",
  "chargeCode": "ABC123XY",
  "hostedUrl": "https://commerce.coinbase.com/charges/ABC123XY",
  "expiresAt": "2026-07-09T08:44:20Z",
  "addresses": { "bitcoin": "1A1zP...", "ethereum": "0x..." }
}
```

---

### Cartes Virtuelles

#### GET /api/cards/virtual?userId=42
Lister les cartes virtuelles d'un utilisateur.

**Réponse :**
```json
{
  "success": true,
  "count": 2,
  "cards": [
    {
      "id": 1,
      "card_number": "5123 4567 8901 2345",
      "card_name": "Jean Dupont",
      "card_type": "Virtual Mastercard",
      "expiry_date": "07/29",
      "created_at": "2026-07-09T08:00:00Z"
    }
  ]
}
```

#### POST /api/cards/virtual
Créer une nouvelle carte virtuelle.

**Body :**
```json
{
  "userId": 42,
  "cardName": "Jean Dupont"
}
```

#### POST /api/cards/create
Créer une carte virtuelle (endpoint existant).

**Body :**
```json
{
  "userId": 42,
  "cardName": "Jean Dupont"
}
```

---

### Cartes Cadeaux

#### GET /api/giftcards
Lister les cartes cadeaux disponibles.

**Query params optionnels :**
- `brand` : filtrer par marque (ex: `Steam`, `Transcash`)

**Réponse :**
```json
{
  "success": true,
  "brands": ["Transcash", "PCS Mastercard", "Steam", "Amazon", "Google Play", "iTunes / App Store"],
  "count": 13,
  "giftCards": [
    {
      "id": "steam-10",
      "brand": "Steam",
      "denomination": 10,
      "currency": "USD",
      "description": "Carte Steam 10$ - Jeux et contenu en ligne",
      "available": true
    }
  ]
}
```

#### POST /api/giftcards
Acheter une carte cadeau.

**Body :**
```json
{
  "cardId": "steam-10",
  "userId": 42,
  "quantity": 2
}
```

**Réponse :**
```json
{
  "success": true,
  "message": "2 carte(s) cadeau Steam achetée(s) avec succès",
  "order": {
    "cardId": "steam-10",
    "brand": "Steam",
    "denomination": 10,
    "currency": "USD",
    "quantity": 2,
    "totalAmount": 20,
    "codes": ["ABCD-EFGH-IJKL-MNOP", "QRST-UVWX-YZ12-3456"]
  }
}
```

---

### Dashboard

#### GET /api/dashboard/client/[userId]
Données du dashboard client.

#### GET /api/dashboard/admin
Données du dashboard administrateur.

#### GET /api/users/balance?userId=42
Solde et informations d'un utilisateur.

---

### Webhooks

#### POST /api/webhooks/flutterwave
Webhook de confirmation Flutterwave.
Vérification via header `verif-hash`.

#### POST /api/webhooks/paystack
Webhook de confirmation Paystack.
Vérification HMAC SHA-512 via header `x-paystack-signature`.

#### POST /api/webhooks/coinbase
Webhook de confirmation Coinbase Commerce.
Vérification HMAC SHA-256 via header `x-cc-webhook-signature`.

---

## Codes d'erreur

| Code | Description |
|------|-------------|
| 400  | Requête invalide (champs manquants ou invalides) |
| 401  | Non autorisé (token manquant ou invalide) |
| 403  | Accès refusé (droits insuffisants) |
| 404  | Ressource introuvable |
| 405  | Méthode HTTP non autorisée |
| 500  | Erreur interne du serveur |
| 503  | Service indisponible (gateway non configurée) |

## Format d'erreur standard

```json
{
  "error": "Description de l'erreur",
  "details": "Détails techniques (optionnel)"
}
```

---

## Exemples cURL

### Créer un paiement Flutterwave
```bash
curl -X POST https://omnipay-eu.com/api/payments/flutterwave \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000,
    "currency": "XOF",
    "email": "client@example.com",
    "name": "Jean Dupont",
    "userId": 42,
    "country": "BJ"
  }'
```

### Router automatique
```bash
curl -X POST https://omnipay-eu.com/api/payments/router \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 10000,
    "currency": "XOF",
    "email": "client@example.com",
    "country": "BJ",
    "userId": 42
  }'
```

### Acheter une carte cadeau Steam
```bash
curl -X POST https://omnipay-eu.com/api/giftcards \
  -H "Content-Type: application/json" \
  -d '{
    "cardId": "steam-10",
    "userId": 42,
    "quantity": 1
  }'
```
