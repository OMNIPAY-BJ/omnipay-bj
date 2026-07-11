# Setup local (FR)

## Prérequis
- Node.js 20+
- npm 10+
- PostgreSQL accessible (ex: Neon)

## Installation
```bash
npm install
cp .env.example .env
```

## Lancement
```bash
npm run dev --workspace backend
npm run dev --workspace frontend
```

## Vérification
- API: `GET http://localhost:4000/api/v1/health`
- Frontend: `http://localhost:3000`
