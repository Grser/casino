<<<<<<< HEAD
# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
=======
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
>>>>>>> 14748ada3a9ae464be0ca5f5c241d947dc1ce46a
