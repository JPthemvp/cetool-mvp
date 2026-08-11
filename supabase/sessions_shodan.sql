-- ── Add Shodan columns to sessions table ────────────────────────────────────
-- Run this in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/iiaxvkcebqyrpqyaurcq/sql/new

alter table public.sessions
  add column if not exists shodan_ip          text,
  add column if not exists shodan_ports       jsonb,   -- full array of open ports
  add column if not exists shodan_risky_count int,     -- ports matching high-risk service list
  add column if not exists shodan_vuln_count  int,     -- known CVEs from Shodan
  add column if not exists shodan_tags        jsonb;   -- Shodan classification tags
