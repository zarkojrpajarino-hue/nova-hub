# Nova Hub (Optimus-K)

Enterprise strategic management platform for startups and entrepreneurs. Integrates CRM, OBV validations, KPIs, AI advisors, financial projections, and peer-to-peer learning in a single workspace.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18.3, TypeScript 5.8, Vite 5.4 |
| UI | TailwindCSS 3.4, shadcn/ui (Radix UI) |
| State | React Query 5.83, React Context |
| Routing | React Router 6.30 |
| Forms | React Hook Form + Zod |
| Charts | Recharts 2.15 |
| Database | Supabase PostgreSQL (RLS enabled) |
| Auth | Supabase Auth (JWT) |
| Serverless | Deno Edge Functions (59 functions) |
| Testing | Vitest + React Testing Library |
| Deployment | Vercel (frontend) + Supabase (backend) |

## Prerequisites

- [Node.js 18+](https://nodejs.org/) and npm
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- A Supabase project (remote or local via `supabase start`)

## Getting Started

### 1. Clone & Install

```sh
git clone https://github.com/zarkojrpajarino-hue/nova-hub.git
cd nova-hub
npm install
```

### 2. Environment Setup

```sh
cp .env.example .env.local
```

Edit `.env.local` and fill in your values. The minimum required for development:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id
```

See `.env.example` for the full list including edge function secrets.

### 3. Supabase Setup

**Option A — Remote project (recommended):**
Point your `.env.local` at your Supabase project. RLS policies and schema are in the SQL files at the repo root.

**Option B — Local:**
```sh
supabase start
```

### 4. Run Development Server

```sh
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Production build (console/debugger stripped) |
| `npm run preview` | Preview production build locally |
| `npm run test` | Run all tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Run ESLint |

## Architecture

3-layer architecture with clean separation of concerns:

```
┌─────────────────────────────────────────┐
│  Presentation Layer (React components)  │
│  src/pages/ · src/components/           │
├─────────────────────────────────────────┤
│  Service Layer (business logic)         │
│  src/services/                          │
├─────────────────────────────────────────┤
│  Repository Layer (data access)         │
│  src/repositories/                      │
├─────────────────────────────────────────┤
│  Supabase (PostgreSQL + RLS + Auth)     │
│  + Deno Edge Functions (59 functions)   │
└─────────────────────────────────────────┘
```

## Key Modules

| Module | Description |
|---|---|
| **Dashboard** | KPI summary, rankings, recent activity, pending validations |
| **CRM** | Pipeline Kanban (cold→won), AI lead scoring, email pitch generator |
| **OBVs** | Unified validations — CRM, sales, and billing in one flow |
| **KPIs** | Learning Path (LP), Book Point (BP), Community Point (CP) with peer validation |
| **Tasks** | Kanban board, AI task executor with feedback loop |
| **Analytics** | Benchmarking, radar charts, temporal evolution, predictions |
| **Financial** | Cash flow projections, collections, debt tracking |
| **Masters** | Maestría program with applications and peer voting |
| **Meetings** | Meeting intelligence, transcription, and insight extraction |
| **Learning** | Personalized roadmaps and learning path tracking |

## Edge Functions

59 Deno serverless functions in `supabase/functions/`, organized by category:

- **AI Generation** — pitch decks, playbooks, tasks, learning roadmaps, email pitches
- **AI Advisors** — business advisor, career coach, competitor analysis, SWOT
- **Intelligence** — lead scoring, market research, geo-intelligence, meeting analysis
- **Integrations** — Stripe sync, Google Analytics, Slack notifications, Vercel deploy
- **Utilities** — Excel export, email sending, business info extraction

All functions are secured with JWT auth and CORS origin whitelisting.

## Environment Variables

### Frontend (Vite)

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `VITE_SUPABASE_PROJECT_ID` | Yes | Supabase project ID |
| `VITE_SENTRY_DSN` | No | Sentry error tracking DSN |
| `VITE_STRIPE_PUBLISHABLE_KEY` | No | Stripe publishable key (when payments enabled) |

### Edge Function Secrets

Set via `supabase secrets set KEY=value` or Supabase Dashboard > Settings > Edge Functions:

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Anthropic API key for AI features |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key for admin operations |
| `ALLOWED_ORIGINS` | Comma-separated allowed CORS origins |
| `CRON_SECRET` | Secret for cron job authentication |
| `ADMIN_SECRET` | Secret for admin-only endpoints |
| `STRIPE_SECRET_KEY` | Stripe secret key (when payments enabled) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |

## Feature Flags

Configured in `src/config/features.ts`:

```ts
ENABLE_PAYMENTS = false      // Enable Stripe payment flow
SHOW_UPGRADE_HINTS = false   // Show upgrade prompts to users
DEMO_MODE = false            // Show demo data banner
```

## Deployment

**Frontend → Vercel:**
Connect the GitHub repo to Vercel. Set all `VITE_*` environment variables in the Vercel dashboard.

**Edge Functions → Supabase:**
```sh
supabase functions deploy --project-ref your-project-id
supabase secrets set ANTHROPIC_API_KEY=sk-ant-... ALLOWED_ORIGINS=https://your-domain.vercel.app,...
```

**Database migrations:**
Apply SQL files at the repo root in order:
1. `1_SCHEMA_STRUCTURE.sql`
2. `2_RLS_POLICIES.sql`
3. `3_CONFIGURATION_TABLES.sql`

## Contributing

1. Fork the repo and create a feature branch
2. Make changes — run `npm run lint` and `npm test` before committing
3. Follow existing commit message conventions (`feat:`, `fix:`, `chore:`, `security:`)
4. Open a pull request against `main`
