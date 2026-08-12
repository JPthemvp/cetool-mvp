-- ── Add Shodan columns to scans table ────────────────────────────────────────
-- Run this in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/iiaxvkcebqyrpqyaurcq/sql/new

alter table public.scans
  add column if not exists shodan_ip          text,
  add column if not exists shodan_ports       jsonb,   -- full array of open ports
  add column if not exists shodan_risky_count int,     -- ports matching high-risk service list
  add column if not exists shodan_vuln_count  int,     -- known CVEs from Shodan
  add column if not exists shodan_tags        jsonb;   -- Shodan classification tags

-- Refresh the scan_summary view to expose Shodan columns
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
  pathway,
  ip,
  user_agent,
  shodan_ip,
  shodan_ports,
  shodan_risky_count,
  shodan_vuln_count,
  shodan_tags
from public.scans;

-- Re-grant select (recreating the view drops previous grants)
grant select on public.scan_summary to service_role;
