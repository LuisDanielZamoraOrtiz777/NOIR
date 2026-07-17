# Deployment checklist (production)

This document lists the steps to deploy Noir Atelier to production (Vercel frontend + Neon/Postgres backend).

1. Backend (Neon/Postgres)
- Ensure your Neon database is ready and you have the connection string.
- Run migrations (create tables): use the file `backend/server/scripts/create_contacts.sql` and `backend/server/schema.sql` if needed.
  ```bash
  psql "postgresql://<user>:<password>@<host>:5432/<db>?sslmode=require" -f backend/server/scripts/create_contacts.sql
  ```
- Set production environment variables (on your host or platform):
  - `DATABASE_URL` (Neon connection string)
  - `DB_SSL=true` (if required)
  - `JWT_SECRET` (strong secret)
  - `FRONTEND_ORIGIN` (e.g. `https://tu-frontend.vercel.app`)

2. Backend deployment
- Deploy your Express API to a host (Heroku, Render, Fly, Railway, or as a server behind Vercel functions).
- Verify health: `GET https://TU_BACKEND/api/health` returns `{ status: "ok" }`.

3. Frontend (Next.js) — Vercel recommended
- In Vercel project settings, set environment variables for the project:
  - `NEXT_PUBLIC_API_BASE` -> the base URL of your backend, e.g. `https://api.tu-dominio.com`.
- Ensure `next.config.js` is up-to-date (already configured in repo).
- Trigger a deployment (push to the production branch or click Redeploy in Vercel).

4. Verify admin contacts flow
- Login as admin via the unified `/acceso` form (now falls back to `/api/admin/login` if needed) or use `/api/admin/login` directly to get a token.
- Call `GET https://TU_BACKEND/api/admin/contactos` with header `Authorization: Bearer <TOKEN>` to list messages.

5. Troubleshooting
- If you see `Unexpected token '<'` in the dashboard, it means the frontend requested `/api/admin/contactos` but got HTML (likely because `NEXT_PUBLIC_API_BASE` is missing or points to the frontend). Ensure `NEXT_PUBLIC_API_BASE` points to your backend.
- Check CORS: backend uses `FRONTEND_ORIGIN` — ensure it includes your production frontend URL.

6. Useful commands (local testing)
```bash
# Run backend locally
cd backend/server
node server.js

# Run frontend locally
cd frontend
npm run dev

# Build frontend
cd frontend
npm run build
```

If you want, I can:
- Commit these example env files and deployment guide to the repo (done).
- Run local `npm run build` to verify the frontend builds cleanly.
- Prepare a small shell script to run migrations against Neon if you share a connection string (do NOT paste secrets here; instead run locally or in CI).
