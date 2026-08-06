-- ── CE Readiness Tool — Supabase schema ───────────────────────────────────────
-- Run this once in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/iiaxvkcebqyrpqyaurcq/sql/new

create table if not exists public.scans (
  id            bigserial primary key,
  domain        text        not null,
  scanned_at    timestamptz not null default now(),
  mode          text        not null default 'passive',
  reachable     boolean     not null default true,
  score         int,
  grade         text,
  findings_pass int         not null default 0,
  findings_fail int         not null default 0,
  findings_warn int         not null default 0,
  -- Sanitised org info (no PII — UEN only, no names)
  uen           text,
  sector        text,
  pathway       text,
  -- Raw findings blob for drill-down
  findings      jsonb,
  -- Request metadata
  ip            text,
  user_agent    text
);

-- Index for the admin dashboard queries
create index if not exists scans_scanned_at_idx on public.scans (scanned_at desc);
create index if not exists scans_domain_idx     on public.scans (domain);

-- Grant table-level access to service_role (bypasses RLS) and anon/authenticated
grant all on public.scans to service_role;
grant usage, select on sequence public.scans_id_seq to service_role;

-- Row Level Security: blocks anon/authenticated direct access
alter table public.scans enable row level security;

-- No public read/write — all access goes through the server-side admin client
create policy "No public access" on public.scans
  as restrictive for all using (false);

-- Summary view for the admin endpoint (no raw findings blob)
create or replace view public.scan_summary as
  select
    id,
    domain,
    scanned_at,
    mode,
    reachable,
    score,
    grade,
    findings_pass,
    findings_fail,
    findings_warn,
    uen,
    sector,
    pathway
  from public.scans
  order by scanned_at desc;
