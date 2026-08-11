-- ── CE Readiness Tool — Sessions schema ────────────────────────────────────────
-- Run this in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/iiaxvkcebqyrpqyaurcq/sql/new

create table if not exists public.sessions (
  id              text        primary key,           -- UUID generated in the browser
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  current_step    text,                              -- last step the user advanced past

  -- Setup fields (captured after onboard → discover)
  org_name        text,
  uen             text,
  sector          text,
  pathway         text,
  has_internal_it boolean,

  -- Discover fields (captured after discover → assess)
  domain          text,
  scan_grade      text,
  scan_score      int,
  scan_pass       int,
  scan_fail       int,
  scan_warn       int,

  -- Assess fields (captured after prepare → results)
  clauses_answered  int,
  clauses_total     int,
  completion_pct    int,

  -- Results fields (captured after results → next steps)
  certifiable     boolean,
  blocking_count  int,
  gaps_count      int,

  -- Request metadata
  ip              text,
  user_agent      text
);

-- Indexes
create index if not exists sessions_updated_at_idx on public.sessions (updated_at desc);
create index if not exists sessions_uen_idx         on public.sessions (uen);

-- Permissions (service_role bypasses RLS, anon has no access)
grant all on public.sessions to service_role;

alter table public.sessions enable row level security;

create policy "No public access" on public.sessions
  as restrictive for all using (false);
