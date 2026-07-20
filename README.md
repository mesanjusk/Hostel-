# Pack with Me

Your all-in-one hostel survival kit — checklist, budget, notes, documents, emergency contacts, shopping recommendations, and a hostel survival guide, for students moving into a hostel for the first time. Login is a mobile number + login code. Students self-register or reset their code via a 6-digit WhatsApp OTP — that verified code becomes their permanent login code, no separate password step. Admins can also provision accounts directly with an admin-issued 7-digit code.

## Architecture

This app is split into two independently deployed projects:

```
backend/    Express + TypeScript + Mongoose REST API — deploy to Render
frontend/   Vite + React + TypeScript SPA — deploy to Vercel
```

The frontend talks to the backend entirely over HTTP (CORS), authenticating with a JWT bearer token. There is no shared server runtime between them. Accounts can be admin-provisioned (mobile + admin-issued 7-digit code) or self-registered via WhatsApp OTP (the verified 6-digit code becomes the login code); either way, login itself is always mobile number + login code, never a password.

## WhatsApp OTP setup

Self-registration and forgot-code both send a one-time code over WhatsApp via the Meta Cloud API. This requires:

1. A [Facebook Developer App](https://developers.facebook.com/) with the **WhatsApp** product added, and a WhatsApp Business Account (WABA) with a phone number registered to it (Meta's free test number works for development).
2. A **permanent System User access token** (Meta Business Settings → System Users), assigned the `whatsapp_business_messaging` permission — the token from the WhatsApp quick-start page expires in 24h and isn't suitable for production.
3. The **Phone Number ID** (WhatsApp → API Setup in the Meta dashboard — a numeric ID, not the phone number itself).
4. An **Authentication-category template** submitted for approval in Meta's Template Library (e.g. named `instify_otp`), with a `{{1}}` body placeholder for the code and a URL button with the code as its parameter. A first-time contact has no open 24h conversation window, so a template message is the only way to reach them — free-form text is rejected by the Graph API.

Set these on the backend (see `backend/.env.example`):

| Key | Value |
| --- | --- |
| `WHATSAPP_ACCESS_TOKEN` | the permanent System User token from step 2 |
| `WHATSAPP_PHONE_NUMBER_ID` | the numeric Phone Number ID from step 3 |
| `WHATSAPP_API_VERSION` | `v18.0` (or your Graph API version) |
| `WHATSAPP_OTP_TEMPLATE_NAME` | your approved template's name |
| `WHATSAPP_OTP_TEMPLATE_LANGUAGE` | must match the template's approved language, e.g. `en_US` |

In local dev (`NODE_ENV` unset or not `production`), if the WhatsApp send fails or these vars are unset, the OTP request response includes a `devOtp` field with the plaintext code so you can test the flow without a live WhatsApp send.

## Admin registration-count WhatsApp campaign

A go-live monitoring campaign: admins whose WhatsApp window is open get a text with the count of new student registrations, either on a timer or once a quantity threshold is hit — one number, not a message per signup (`backend/src/jobs/whatsappCampaignJob.ts`). Fully controlled at runtime from **Admin panel → WhatsApp Campaign** (`/admin/whatsapp-campaign`) — no env vars, no deploy needed to change anything:

- **Start / Pause** — the campaign only runs while explicitly turned on.
- **Trigger mode** — *Time-based* (broadcast every N minutes) or *Quantity-based* (broadcast once N new registrations have accumulated since the last send).
- **Skip if zero** (time mode) — don't send when that interval had no new registrations, instead of texting "0" every tick.
- **Optional end date** — the campaign auto-pauses once passed.
- **Admin roster** — every `role: "admin"` account (see `npm run make-admin`) with their live WhatsApp opt-in window status, and a per-admin on/off switch to exclude a specific admin from the campaign without touching their opt-in window.

WhatsApp only allows free-form text within the 24h window opened by the *recipient* messaging in first, so this only reaches admins who've opted in:

1. **Opt in**: each admin sends any WhatsApp message (e.g. `HOSTEL`) to the business number. The webhook (`backend/src/routes/whatsapp.routes.ts`) records the timestamp on that admin's `User` document and treats the window as open for the next ~23h — this shows live on the admin panel's roster table.
2. **If the window lapses**: that admin just stops receiving the campaign (silently, no error) until they message the business number again — there's no automated reminder/reactivation step, by design.
3. **Per-admin opt-out**: independent of the window, any admin can be switched off from the master admin panel, or from their own **Profile → WhatsApp registration alerts** toggle — either one flips the same setting.

Reuses the same `WHATSAPP_ACCESS_TOKEN`/`WHATSAPP_PHONE_NUMBER_ID` as WhatsApp OTP above — no separate credentials or Meta template needed.

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

Seed the City catalog (powers the city picker on registration/profile):

```bash
npm run seed:cities
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
   - Build command: `npm install --include=dev && npm run build` (the `--include=dev` is required because `NODE_ENV=production` below otherwise makes npm skip `devDependencies`, which include `typescript` and `@types/*`)
   - Start command: `npm start`
   - (A `backend/render.yaml` blueprint is included if you prefer Render's Blueprint deploy.)
2. In the Render service's **Environment** tab, add:
   | Key | Value |
   | --- | --- |
   | `MONGODB_URI` | Your MongoDB Atlas connection string |
   | `JWT_SECRET` | Generate with `openssl rand -base64 32` |
   | `CORS_ORIGIN` | Your deployed frontend URL, e.g. `https://your-frontend.vercel.app` (comma-separate if you also want to allow `http://localhost:5173` for local testing against the prod API) |
   | `NODE_ENV` | `production` |
   | `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_API_VERSION`, `WHATSAPP_OTP_TEMPLATE_NAME`, `WHATSAPP_OTP_TEMPLATE_LANGUAGE` | See "WhatsApp OTP setup" above — required for self-registration and forgot-code to send real messages |
3. In MongoDB Atlas → Network Access, allow Render's outbound IPs (or `0.0.0.0/0`).
4. Deploy. Your API will be live at something like `https://hostel-dpqg.onrender.com` — note this URL, the frontend needs it.
5. Run `npm run make-admin -- <mobile>`, `npm run seed`, and `npm run seed:cities` locally (or from any machine) pointed at the same `MONGODB_URI` — these are one-off maintenance scripts, not part of the deployed service.

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
| `backend/` | `npm run seed:cities` | Populate the City catalog (registration/profile city picker) |
| `frontend/` | `npm run dev` | Local dev server |
| `frontend/` | `npm run build` | Production build |
