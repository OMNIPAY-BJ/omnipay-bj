# Architecture OMNIPAY

## Structure
- `frontend/` : interface client Next.js 15 + TypeScript
- `backend/` : API REST Express + TypeScript
- `docs/` : documentation opérationnelle et business

## Flux
1. Frontend appelle `NEXT_PUBLIC_API_BASE_URL`
2. Backend valide JWT et entrées
3. Backend persiste PostgreSQL via Drizzle (`DATABASE_URL`)
4. Réponses normalisées JSON

## Sécurité
- `helmet`, `cors`, `express-rate-limit`
- `pg` + Drizzle ORM pour les accès PostgreSQL
- secrets uniquement via `.env` / variables de plateforme
