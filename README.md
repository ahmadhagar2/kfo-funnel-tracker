# KFO Funnel Tracker

Internal web app for **hagar.kollegen, kieferorthopädie am stadttheater** — tracks the new patient funnel across reception and consultation rooms with real-time sync via Supabase.

## Setup

### 1. Supabase project

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the migration file: `supabase/migrations/001_init.sql`
3. Go to **Settings → API** and copy your **Project URL** and **anon public** key
4. Go to **Database → Replication** and ensure `funnel_entries` is added to the `supabase_realtime` publication (the migration does this automatically)

### 2. Environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_ACCESS_PIN=1234
```

### 3. Install and run

```bash
npm install
npm run dev
```

## Deploy to Vercel / Netlify

1. Push this repo to GitHub
2. Connect to Vercel or Netlify
3. Set the three environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_ACCESS_PIN`)
4. Build command: `npm run build`
5. Output directory: `dist`

## Views

- **Empfang** — fast tap-based data entry for reception staff
- **Planbesprechung** — one-click counter for consultation rooms
- **Dashboard** — management cockpit with KPIs, funnel visualization, and charts
