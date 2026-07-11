# Guide déploiement

## Frontend (Vercel)
1. Importer repo dans Vercel
2. Root Directory: `frontend`
3. Variables: `NEXT_PUBLIC_API_BASE_URL`
4. Build command: `npm run build`

## Backend (Railway/Render)
1. Root Directory: `backend`
2. Start command: `npm run start`
3. Build command: `npm run build`
4. Variables: `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`

## Checklist production
- HTTPS actif
- Secrets injectés via dashboard
- CORS limité au domaine frontend
- Monitoring logs/erreurs activé
