# Casino Online - Base Inicial (Blackjack + Escalable)

Este repositorio contiene una **estructura inicial de backend** y una **base de datos PostgreSQL** para arrancar un casino online con juegos tipo blackjack.

## Estructura del proyecto

```text
.
├── backend/
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── app.js
│       ├── config/
│       │   └── env.js
│       ├── db/
│       │   └── pool.js
│       ├── middleware/
│       │   └── error-handler.js
│       ├── routes/
│       │   ├── health.routes.js
│       │   ├── games.routes.js
│       │   └── wallet.routes.js
│       └── services/
│           └── wallet.service.js
├── database/
│   ├── schema.sql
│   └── seed.sql
├── frontend/
│   ├── package.json
│   ├── index.html
│   └── src/
│       ├── App.tsx
│       └── main.tsx
├── docker-compose.yml
└── docs/
    └── architecture.md
```

## 1) Levantar la base de datos

Requisitos: Docker y Docker Compose.

```bash
docker compose up -d db
```

Esto crea PostgreSQL en `localhost:5432` con:

- DB: `casino_db`
- User: `casino_user`
- Password: `casino_pass`

## 2) Crear esquema y datos iniciales (SQL)

Opción A: desde el contenedor de PostgreSQL.

```bash
# Crear tablas
cat database/schema.sql | docker exec -i casino-db psql -U casino_user -d casino_db

# Insertar datos base (juegos, mesas)
cat database/seed.sql | docker exec -i casino-db psql -U casino_user -d casino_db
```

Opción B: desde el backend (ejecuta ambos scripts SQL automáticamente).

```bash
cd backend
npm install
npm run db:bootstrap
```

## 3) Ejecutar backend API

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Servidor en: `http://localhost:3000`

## 4) Ejecutar frontend (React + TypeScript + Vite 8)

```bash
cd frontend
npm install
npm run dev
```

Aplicación en: `http://localhost:5173`


## Endpoints de ejemplo

- `GET /health`
- `GET /games`
- `GET /wallet/:userId`
- `POST /wallet/:userId/deposit`
- `POST /wallet/:userId/withdraw`

## Siguientes pasos recomendados

- Autenticación JWT + refresh tokens.
- Motor de blackjack (baraja, manos, split/double/insurance).
- Ledger inmutable para auditoría y antifraude.
- Idempotency keys en operaciones de wallet.
- Límites/KYC/AML por jurisdicción.
