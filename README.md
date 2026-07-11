# 🚀 OMNIPAY - Fintech Complète (Architecture Pro)

OMNIPAY est une base **production-ready** organisée en deux apps :
- `frontend/` : Next.js + TypeScript + Tailwind + composants UI type shadcn
- `backend/` : Node.js + Express + TypeScript + MongoDB + JWT

## ✅ Modules couverts
- Authentification (signup/login, 2FA/KYC prêts)
- Paiements (wallet, transferts, transactions, reçus)
- E-commerce (produits, checkout, commandes)
- Investissement (portfolio, performance, risque)
- Ressources (budgets, objectifs, reporting)
- Admin (monitoring, conformité, analytics)

## 🧱 Architecture
Voir :
- `/docs/ARCHITECTURE.md`
- `/docs/SETUP.md`
- `/docs/DEPLOYMENT.md`
- `/docs/LEGAL_COMPLIANCE_BENIN.md`
- `/docs/PITCH_DECK_TEMPLATE.md`
- `/docs/FUNDRAISING_STRATEGY.md`

## ⚡ Démarrage rapide
1. Copier `.env.example` vers `.env`
2. Installer les dépendances : `npm install`
3. Lancer backend : `npm run dev --workspace backend`
4. Lancer frontend : `npm run dev --workspace frontend`

## 🔒 Sécurité
- JWT signé, mots de passe hashés (bcrypt)
- Chiffrement AES-256-GCM utilitaire pour champs sensibles
- Helmet + CORS strict + Rate limiting
- Validation d'entrées + variables d'environnement obligatoires

## 🖼️ Aperçu visuel (README spectaculaire)
- Hero fintech moderne
- Modules business clairement séparés
- UI dark premium orientée conversion
