# Dylan's Roster Manager

A personal social CRM for people who treat relationships like systems. Built because $29/month is insane for a glorified contact log and two API calls.

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Supabase** (Auth + Postgres)
- **Anthropic Claude API** (claude-haiku-4-5)
- **Recharts** (weekly volume chart)
- **Vercel** (deployment)

## Setup

### 1. Clone and install

```bash
git clone <your-repo-url>
cd dylans-roster-manager
npm install
```

### 2. Set up Supabase

Create a project at [supabase.com](https://supabase.com), then run this SQL in the SQL Editor:

```sql
-- contacts
create table contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  tier text check (tier in ('A','B','C')) default 'B',
  notes text,
  reply_tone text,
  created_at timestamptz default now()
);

-- interactions
create table interactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  contact_id uuid references contacts on delete cascade,
  direction text check (direction in ('sent','received')) not null,
  content text not null,
  platform text,
  logged_at timestamptz default now()
);

-- RLS: users can only see their own data
alter table contacts enable row level security;
alter table interactions enable row level security;
create policy "own contacts" on contacts for all using (auth.uid() = user_id);
create policy "own interactions" on interactions for all using (auth.uid() = user_id);
```

### 3. Configure environment

Create `.env.local` in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### 4. Create your account

In the Supabase dashboard, go to **Authentication > Users** and create a user manually.

**Important:** After creating your account, disable public signups: **Authentication > Settings > Disable "Allow new users to sign up"**

### 5. Run locally

```bash
npm run dev
```

## Deployment (Vercel)

1. Push to GitHub
2. Import in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `ANTHROPIC_API_KEY`
4. Deploy

## Install on iPhone

Open your Vercel URL in Safari > Share > **Add to Home Screen**

## Security

- All AI API calls are server-side only (Next.js API routes)
- Anthropic API key never touches the browser
- Row Level Security on all database tables
- No public signup — accounts created manually in Supabase

## License

MIT
