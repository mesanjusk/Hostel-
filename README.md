# Pack with Me

Your all-in-one hostel survival kit — checklist, budget, notes, documents, emergency contacts, shopping recommendations, and a hostel survival guide, for students moving into a hostel for the first time. Login is a mobile number + admin-issued 7-digit code (no passwords, no OTP/SMS provider).

## Architecture

This app is split into two independently deployed projects:

```
backend/    Express + TypeScript + Mongoose REST API — deploy to Render
frontend/   Vite + React + TypeScript SPA — deploy to Vercel
```

The frontend talks to the backend entirely over HTTP (CORS), authenticating with a JWT bearer token. There is no shared server runtime between them — MSG91 OTP and the WhatsApp Meta Cloud API broadcast feature from the original Next.js build have been removed; the only login path now is an admin-provisioned mobile number + 7-digit login code.

## Tech stack

**Backend** (`backend/`): Express, TypeScript, MongoDB Atlas + Mongoose, JWT auth (`jsonwebtoken` + `bcryptjs`), Zod validation.

**Frontend** (`frontend/`): Vite, React 19, TypeScript, React Router v7, TailwindCSS v4, hand-built shadcn/ui-style primitives, Framer Motion, React Hook Form + Zod, Recharts, Sonner.

## Local setup

### 1. MongoDB Atlas

Create a free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas), add a database user, allow your IP (or `0.0.0.0/0` for quick testing), and grab the connection string — include a database name at the end, e.g. `.../Hostel?retryWrites=true`.

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Fill in `backend/.env`:
- `MONGODB_URI` — from step 1
- `JWT_SECRET` — generate with `openssl rand -base64 32`
- `CORS_ORIGIN` — `http://localhost:5173` for local dev (comma-separate multiple origins)
- `PORT` — `4000` (default)

Bootstrap the first admin account (there's no self-signup — every account is admin-provisioned):

```bash
npm run make-admin -- <your-10-digit-mobile-number>
```

This prints a one-time 7-digit login code — save it, it can't be retrieved again (only regenerated).

Optionally seed starter Shopping/Guide content:

```bash
npm run seed
```

Run the backend:

```bash
npm run dev
```

It listens on `http://localhost:4000` (health check at `/health`).

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env
```

Set `VITE_API_URL=http://localhost:4000` in `frontend/.env`, then:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and log in with the mobile number + code from `make-admin`.

## Deploying

### Backend → Render

1. Push this repo to GitHub and create a new **Web Service** on [Render](https://dashboard.render.com/), pointing at this repo with **Root Directory** set to `backend`.
   - Build command: `npm install && npm run build`
   - Start command: `npm start`
   - (A `backend/render.yaml` blueprint is included if you prefer Render's Blueprint deploy.)
2. In the Render service's **Environment** tab, add:
   | Key | Value |
   | --- | --- |
   | `MONGODB_URI` | Your MongoDB Atlas connection string |
   | `JWT_SECRET` | Generate with `openssl rand -base64 32` |
   | `CORS_ORIGIN` | Your deployed frontend URL, e.g. `https://your-frontend.vercel.app` (comma-separate if you also want to allow `http://localhost:5173` for local testing against the prod API) |
   | `NODE_ENV` | `production` |
3. In MongoDB Atlas → Network Access, allow Render's outbound IPs (or `0.0.0.0/0`).
4. Deploy. Your API will be live at something like `https://hostel-dpqg.onrender.com` — note this URL, the frontend needs it.
5. Run `npm run make-admin -- <mobile>` and `npm run seed` locally (or from any machine) pointed at the same `MONGODB_URI` — these are one-off maintenance scripts, not part of the deployed service.

### Frontend → Vercel

1. Import this repo in [Vercel](https://vercel.com/new), setting **Root Directory** to `frontend`.
   - Framework preset: Vite
   - Build command: `npm run build` (default)
   - Output directory: `dist` (default)
2. In the Vercel project's **Settings → Environment Variables**, add:
   | Key | Value |
   | --- | --- |
   | `VITE_API_URL` | Your deployed backend URL, e.g. `https://hostel-dpqg.onrender.com` |
3. Deploy. Once you have the Vercel URL, go back to the Render backend's `CORS_ORIGIN` env var and set it to that exact Vercel URL (then redeploy/restart the backend so CORS picks it up) — until this is set, the browser will block API calls from the deployed frontend with a CORS error.

## Project structure

```
backend/
  src/
    routes/        Express routers, one per feature (auth, checklist, budget, ...)
    services/      Data access layer — the only place that talks to Mongoose models
    models/        Mongoose schemas
    validations/   Zod request-body schemas
    middleware/    JWT auth (requireAuth, requireAdmin)
    lib/           JWT signing, phone normalization, PIN hashing, etc.
  scripts/         make-admin.ts, seed.ts

frontend/
  src/
    pages/         One file per route, thin wrappers around features/
    features/      Feature UI (forms, views, dialogs), one folder per vertical
    components/ui/       Hand-built shadcn/ui-style primitives
    components/shared/   Navbar, sidebar, bottom nav, FAB, etc.
    context/        Auth context (JWT storage + current user)
    lib/            API client, utilities
```

## Scripts

| Location | Command | Purpose |
| --- | --- | --- |
| `backend/` | `npm run dev` | Local dev server (tsx watch) |
| `backend/` | `npm run build` / `npm start` | Production build / run |
| `backend/` | `npm run make-admin -- <mobile>` | Create/promote an admin account with a fresh login code |
| `backend/` | `npm run seed` | Populate Shopping/Guide starter content |
| `frontend/` | `npm run dev` | Local dev server |
| `frontend/` | `npm run build` | Production build |
