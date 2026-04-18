# EstateHub (React + Express + MySQL)

## Project structure

- `client/`: React app (Vite)
- `server/`: Express API (MySQL)

## Setup MySQL

1. Create the database/tables and seed demo data:

   - Run the SQL in `server/schema.sql` in MySQL Workbench **or**:

   ```sql
   SOURCE path/to/realestate/server/schema.sql;
   ```

2. Create `server/.env` from `server/.env.example` and set your MySQL password.

## Run the app (dev)

In one terminal:

```bash
cd server
npm run dev
```

In another terminal:

```bash
cd client
npm run dev
```

Then open the React app at `http://localhost:5173`.

## API endpoints

- `GET /api/health`
- `GET /api/properties`
- `GET /api/agents`
- `GET /api/blog-posts`
- `POST /api/contact`
- `POST /api/auth/login`

