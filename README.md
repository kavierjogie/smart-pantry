# Smart Pantry & Recipe Assistant

A full-stack web app that helps you track your pantry, reduce food waste, and discover recipes based on what you have — powered by Supabase, TheMealDB and Groq AI.

## Features

- **Demo mode** — "Try the demo" on the login page opens the full app with a sample pantry, no sign-up needed. Demo data lives in `localStorage`, so it works even without Supabase.
- **Pantry management** — Add, edit, delete food items with expiry dates, quantities, prices and low-stock alerts
- **Recipe matching** — Recipes scored by how many ingredients you already have
- **Recipe search** — Live [TheMealDB](https://www.themealdb.com) search ranked by pantry coverage, with dietary filtering
- **AI Food Assistant** — Chat with Groq AI about meal ideas, substitutions, and cooking tips
- **Shopping list** — Add missing ingredients from recipes; tick off and move to pantry when bought
- **Food Insights** — Analytics on stock health, expiring items, estimated value and waste
- **Cookbook recommendations** — Live [Open Library](https://openlibrary.org) search results by category
- **Full auth** — Sign up, login, logout via Supabase Auth with Row Level Security

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| UI | React 19, Tailwind CSS 4, Radix UI primitives |
| Database / Auth | Supabase (PostgreSQL + Auth) |
| AI | Groq API |
| Recipes / Books | TheMealDB, Open Library (no keys needed) |
| Charts | Recharts |
| Notifications | Sonner |
| Deployment | Vercel |

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Create a free project at https://supabase.com
2. Go to SQL Editor and run the entire contents of `supabase/schema.sql`
3. Go to Settings → API and copy your Project URL and anon key

### 3. Configure environment variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
GROQ_API_KEY=gsk_your_groq_api_key_here
```

Get a Groq key at https://console.groq.com/keys (optional — the assistant is disabled without it).

### 4. Run locally

```bash
npm run dev
```

Open http://localhost:3000 and sign up, or click **Try the demo**.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase public anon key |
| `GROQ_API_KEY` | Optional | Groq API key — AI assistant disabled if missing |
| `THEMEALDB_API_BASE_URL` | Optional | Override the TheMealDB base URL (defaults to the free public API) |

**Security**: `GROQ_API_KEY` has no `NEXT_PUBLIC_` prefix — it is only used server-side in `/api/chat`. The chat and recipe API routes only accept requests from signed-in users or demo sessions.

---

## Deploying to Vercel

1. Push to GitHub
2. Import repo in Vercel dashboard
3. Add the environment variables above
4. Deploy

In Supabase → Authentication → URL Configuration, add your Vercel URL to Site URL and Redirect URLs.

---

## Project Structure

```
app/
  (app)/        dashboard, pantry, recipes, shopping, assistant, insights, cookbooks, profile
  auth/         login, signup
  api/chat      Groq proxy (server-side only)
  api/recipes   TheMealDB search + pantry matching
  api/cookbooks Open Library search
components/     ui, pantry, recipes, shopping, assistant, navigation, try-demo-button
lib/            supabase clients, db/ helpers, demo.ts (demo mode), recipes.ts (matching), data.ts
types/index.ts
supabase/schema.sql
middleware.ts   auth guard (bypassed for demo sessions)
```
