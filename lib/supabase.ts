/**
 * Supabase client factory.
 *
 * Two clients:
 *   - `supabasePublic`  — uses the anon key, safe in browser and server components
 *   - `supabaseAdmin`   — uses the service_role key, server-side only (API routes)
 *
 * The admin client bypasses Row Level Security and must never be imported into
 * client components. It lives here (no "use client" directive) so Next.js
 * tree-shaking keeps it server-only.
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!url || !anonKey) {
  console.warn(
    "[supabase] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. " +
      "Scan logging will be disabled until .env.local is filled in.",
  );
}

const NO_REALTIME = {
  realtime: { params: { eventsPerSecond: 0 } },
} as const;

/** Public client — read-only queries, respects RLS. */
export const supabasePublic = createClient(
  url ?? "https://placeholder.supabase.co",
  anonKey ?? "placeholder",
  NO_REALTIME,
);

/** Admin client — full access, server-side only. */
export const supabaseAdmin = createClient(
  url ?? "https://placeholder.supabase.co",
  serviceKey ?? "placeholder",
  { auth: { persistSession: false }, ...NO_REALTIME },
);
