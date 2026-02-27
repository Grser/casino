# Casino Online - Base Inicial (Blackjack + Escalable)

Este repositorio contiene una **estructura inicial de backend**, una **base de datos PostgreSQL** y dos apps front:

- `frontend/`: frontend de referencia.
- `src/` (raíz): frontend activo para ejecución en la raíz del repo con Vite.

## Estructura del proyecto

```text
.
├── backend/
├── database/
├── docs/
├── frontend/
├── src/
├── docker-compose.yml
└── package.json
```

## 1) Levantar la base de datos

```bash
docker compose up -d db
```

## 2) Crear esquema y datos iniciales

```bash
cat database/schema.sql | docker exec -i casino-db psql -U casino_user -d casino_db
cat database/seed.sql | docker exec -i casino-db psql -U casino_user -d casino_db
```

## 3) Ejecutar backend API

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Servidor en: `http://localhost:3000`

## 4) Ejecutar frontend (raíz)

```bash
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
