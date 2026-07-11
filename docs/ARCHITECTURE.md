# Architecture OMNIPAY

## Structure
- `frontend/` : interface client Next.js 15 + TypeScript
- `backend/` : API REST Express + TypeScript
- `docs/` : documentation opérationnelle et business

## Flux
1. Frontend appelle `NEXT_PUBLIC_API_BASE_URL`
2. Backend valide JWT et entrées
3. Backend persiste MongoDB (`MONGODB_URI`)
4. Réponses normalisées JSON

## Sécurité
- `helmet`, `cors`, `express-rate-limit`
- secrets uniquement via `.env`
- chiffrement applicatif AES-256-GCM pour données sensibles
- `sanitizeFilter` activé sur Mongoose
