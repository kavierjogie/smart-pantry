# Smart Pantry & Recipe Assistant

A full-stack web app that helps you track your pantry, reduce food waste, and discover recipes based on what you have — powered by Supabase and Groq AI.

## Features

- **Pantry management** — Add, edit, delete food items with expiry dates, quantities, and low-stock alerts
- **Recipe matching** — Recipes scored by how many ingredients you already have
- **Recipe search** — Live Spoonacular ingredient search ranked by pantry coverage
- **AI Food Assistant** — Chat with Groq AI about meal ideas, substitutions, and cooking tips
- **Shopping list** — Add missing ingredients from recipes; tick off and move to pantry when bought
- **Food Insights** — Analytics on stock health, expiring items, estimated value and waste
- **Cookbook recommendations** — Live Google Books search results by category
- **Full auth** — Sign up, login, logout via Supabase Auth with Row Level Security

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI components | Radix UI primitives + custom components |
| Database / Auth | Supabase (PostgreSQL + Auth) |
| AI | Groq API |
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

### 3. Get API keys

Visit https://console.groq.com/keys for the optional AI assistant key, https://spoonacular.com/food-api/console for a Spoonacular key used by recipe search, and https://console.cloud.google.com/apis/credentials for an optional Google Books API key.

### 4. Configure environment variables

```bash
cp .env.example .env.local
# Edit .env.local with your values
```

### 5. Run locally

```bash
npm run dev
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase public anon key |
| `GROQ_API_KEY` | Optional | Groq API key — AI disabled if missing |
| `SPOONACULAR_API_KEY` | Required for recipe search | Spoonacular Food API key, used only in the server-side recipe route |
| `GOOGLE_BOOKS_API_KEY` | Optional | Google Books API key, used only in the server-side cookbook route. Recommended if the public endpoint is rate-limited. |

Add the Google Books key to the project root `.env.local` as:

```env
GOOGLE_BOOKS_API_KEY=your_google_books_api_key
```

The cookbook search works without a key when Google Books allows unauthenticated requests. Keep this variable server-side: do not prefix it with `NEXT_PUBLIC_`.

**Security**: `GROQ_API_KEY` and `SPOONACULAR_API_KEY` have no `NEXT_PUBLIC_` prefix — they are only used server-side.

---

## Deploying to Vercel

1. Push to GitHub
2. Import repo in Vercel dashboard
3. Add the four environment variables
4. Deploy

In Supabase → Authentication → URL Configuration, add your Vercel URL to Site URL and Redirect URLs.

---

## Project Structure

```
app/
  (app)/dashboard, pantry, recipes, shopping, assistant, insights, cookbooks, profile
  auth/login, signup
  api/chat              ← Groq proxy, server-side only
components/ui, pantry, recipes, shopping, navigation
lib/supabase, db, data.ts, recipes.ts, utils.ts
types/index.ts
supabase/schema.sql
middleware.ts
.env.example
```
