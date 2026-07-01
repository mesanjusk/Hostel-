# Hostel Essentials

Your all-in-one hostel survival kit — checklist, budget, notes, documents, emergency contacts, shopping recommendations, and a hostel survival guide, for students moving into a hostel for the first time. No passwords, no email, no forms — login is a WhatsApp deep-link.

## Tech stack

- **Next.js 15** (App Router) + **TypeScript** (strict)
- **TailwindCSS v4** + hand-built shadcn/ui-style primitives ([why "hand-built"](#a-note-on-shadcnui))
- **Framer Motion** for animation, **Lottie** for the packing-complete celebration
- **MongoDB Atlas** + **Mongoose**
- **NextAuth v5 (Auth.js)** — JWT sessions, Credentials provider
- **WhatsApp Meta Cloud API** — passwordless deep-link login (see [Authentication](#authentication))
- **Zod** + **React Hook Form**
- **PWA** (installable, offline fallback) via `@ducanh2912/next-pwa`
- Dark/light theme via `next-themes`

## Authentication

This app does **not** use OTP codes typed into the app. Instead, it uses a WhatsApp deep-link "login ticket" flow:

1. You type your mobile number and hit Continue.
2. The app generates a single-use, short-lived token and shows a **"Continue on WhatsApp"** button (and a QR code for desktop) that opens WhatsApp with a pre-filled message (`HOSTEL <token>`) to your business number.
3. You hit Send in WhatsApp. Meta delivers that message to this app's webhook, which verifies the token, confirms the sender's WhatsApp number matches what you typed, and marks the ticket verified.
4. The browser (which has been polling in the background) picks up the "verified" status and signs you in — auto-creating your account on first login. No separate registration form, no password, no email, no forgot-password flow.
5. First-time users complete a one-step profile (name, college, hostel, room) before reaching the dashboard.

No pre-approved Meta message template is required for login — the confirmation reply happens inside the customer-initiated WhatsApp session window. A template is only needed if you use the admin Broadcast composer to message users outside that window.

## Project structure

```
app/                  Routes (App Router). (auth) and (dashboard) are route groups.
components/ui/        Hand-built shadcn/ui-style primitives (button, card, dialog, form, ...)
components/shared/    Reusable app components (navbar, sidebar, empty states, progress ring, ...)
features/<name>/      Client-side view components + form dialogs, one folder per feature
actions/              Server Actions ("use server") — validate with Zod, call services/, revalidate
services/             Data access layer — the only place that talks to Mongoose models directly
models/               Mongoose schemas
lib/                  Auth config, DB connection, WhatsApp client, validations, utilities
types/                Shared TypeScript types + enums (checklist categories, etc.)
scripts/              seed.ts (starter content), make-admin.ts, generate-icons.ts
```

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. MongoDB Atlas setup

1. Create a free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
2. Database Access → add a database user with a strong password.
3. Network Access → add your IP (or `0.0.0.0/0` for quick testing — restrict this for production).
4. Get your connection string (Connect → Drivers) and put it in `MONGODB_URI` — include a database name at the end, e.g. `.../Hostel?retryWrites=true`.

### 3. Meta WhatsApp Cloud API setup

1. Create an app at [developers.facebook.com](https://developers.facebook.com/) → add the **WhatsApp** product.
2. Under WhatsApp → API Setup, note your **Phone number ID** (`META_PHONE_NUMBER_ID`) and generate a permanent **access token** (`META_ACCESS_TOKEN`) — a System User token is recommended over the 24h test token.
3. Note the **actual WhatsApp Business phone number** attached to that ID (digits with country code, e.g. `919876543210`) — this is `META_BUSINESS_NUMBER`, used to build the login deep-link/QR. It is *not* the same as the Phone number ID.
4. Under App Settings → Basic, note your **App ID** (`META_APP_ID`) and **App Secret** (`META_APP_SECRET`) — the app secret is used to verify that incoming webhook requests genuinely come from Meta.
5. Pick any string as your webhook verify token (`META_VERIFY_TOKEN`) — you'll enter this same value in the Meta dashboard in the next step.
6. Under WhatsApp → Configuration → Webhook, set the callback URL to `https://<your-domain>/api/whatsapp/webhook` and the verify token to the value from step 5, then subscribe to the **messages** field. This requires a publicly reachable HTTPS URL — deploy first (or use a tunnel like ngrok for local testing).

### 4. Environment variables

Copy `.env.example` to `.env.local` and fill in the values from steps 2-3, plus a generated `NEXTAUTH_SECRET`:

```bash
cp .env.example .env.local
openssl rand -base64 32   # paste the output as NEXTAUTH_SECRET
```

### 5. Seed starter content (optional but recommended)

Populates real starter content for the Shopping and Hostel Guide sections:

```bash
npm run seed
```

### 6. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Note: the WhatsApp webhook needs a public HTTPS URL, so full login testing (deep-link → real WhatsApp message → webhook) only works once deployed, or via a tunnel pointed at your local server with the webhook URL updated in Meta's dashboard accordingly.

### 7. Make yourself an admin

The first user must log in once (via the normal WhatsApp flow) to create their account, then be promoted:

```bash
npm run make-admin -- 9876543210
```

This unlocks `/admin` (analytics, user list, product/guide content management, WhatsApp broadcast).

## Deploying to Vercel

1. Push this repo to GitHub and import it in [Vercel](https://vercel.com/new).
2. In the Vercel project's **Settings → Environment Variables**, add every variable from `.env.example`:
   `MONGODB_URI`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (set this to your production URL, e.g. `https://your-app.vercel.app`), `META_PHONE_NUMBER_ID`, `META_ACCESS_TOKEN`, `META_VERIFY_TOKEN`, `META_APP_ID`, `META_APP_SECRET`, `META_BUSINESS_NUMBER`.
   Missing any of these (especially `NEXTAUTH_SECRET` or `MONGODB_URI`) will cause every request to fail with `MIDDLEWARE_INVOCATION_FAILED`, since middleware initializes the auth session on every request.
3. In MongoDB Atlas → Network Access, allow Vercel's outbound IPs (or `0.0.0.0/0`) so the deployed app can connect.
4. Deploy. Then go back to Meta's WhatsApp → Configuration → Webhook settings and point the callback URL at `https://<your-vercel-domain>/api/whatsapp/webhook`.
5. Run `npm run seed` and `npm run make-admin -- <your-number>` locally (or from any machine) pointed at the same `MONGODB_URI` — these are one-off maintenance scripts, not part of the deployed app.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run start` | Run a production build locally |
| `npm run lint` | ESLint |
| `npm run seed` | Populate Shopping/Guide starter content |
| `npm run make-admin -- <mobile>` | Promote an existing user to admin |

## A note on shadcn/ui

This environment's network policy blocks the shadcn CLI's registry API (`ui.shadcn.com`), so the primitives in `components/ui/` were hand-written to match shadcn's standard "new-york" style, structure, and Radix UI + Tailwind conventions exactly. If you have registry access elsewhere, `npx shadcn@latest add <component>` will still work against this `components.json` and should produce compatible output.

## Known limitations of this build environment

Live MongoDB and Meta Graph API connectivity could not be verified from inside the sandboxed session this app was built in (both raw MongoDB TCP and `graph.facebook.com` are blocked by that environment's egress policy) — this is a sandbox restriction, not an application defect. Everything was verified via `tsc --noEmit`, `next lint`, and `next build` after every change, plus UI review. Live end-to-end testing (real WhatsApp login, real database reads/writes) should be your first check after deploying or running locally with real credentials.
