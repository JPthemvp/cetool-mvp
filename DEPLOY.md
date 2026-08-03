# Storing data and shipping it

Two separate questions, in the order they matter.

---

## 1. Where the data lives

### Where it lives today

`localStorage`, under the key `cyber-essentials-tool.v1`. One browser, one device,
no server. This is deliberate for a prototype and it has a real security virtue:
**there is no central store of Singapore SME security weaknesses to steal.**

Keep that in mind before moving it. A database holding "these 400 clinics have no
offline backup and run Server 2012" is a target worth attacking. Whatever you pick,
the design goal is to hold as little as possible, for as short as possible.

### Option A — Resume token, no accounts (recommended first step)

This is what IASME's readiness tool does, and it fits an SME that will not create
an account for a government form.

- Server generates a random token (say 32 bytes, base64url).
- Whole session blob is stored under that token with a TTL.
- User gets a link: `https://…/resume/AbC123…`. That link **is** the password.
- No email, no password, no PII needed to retrieve.

Storage that suits it, all with a free tier and native expiry:

| Service | Free tier | Why it fits |
|---|---|---|
| **Upstash Redis** | 10k commands/day | `SET key value EX 2592000` — TTL is one argument. Serverless-native, works on Vercel edge. Best fit. |
| **Vercel KV** | Included on Hobby | Same Redis model, zero config on Vercel, one click. |
| **Cloudflare KV** | 100k reads/day | If you deploy on Cloudflare instead. |

Wiring it up is one API route and a driver swap:

```ts
// app/api/session/[token]/route.ts
import { Redis } from "@upstash/redis";
const redis = Redis.fromEnv();
const TTL = 60 * 60 * 24 * 30; // 30 days, then it evaporates

export async function GET(_: Request, { params }: { params: { token: string } }) {
  const data = await redis.get(params.token);
  return Response.json(data ?? {}, { status: data ? 200 : 404 });
}

export async function PUT(req: Request, { params }: { params: { token: string } }) {
  await redis.set(params.token, await req.json(), { ex: TTL });
  return new Response(null, { status: 204 });
}
```

Then in `components/store.tsx`, the existing `useEffect` that writes to
`localStorage` also `PUT`s to `/api/session/<token>`. The store is already a single
serialisable blob, so this is genuinely a small change.

**Do:** rate-limit by IP, cap the body size, and set the TTL server-side so a client
cannot ask for forever.
**Do not:** make the token guessable, or put it in a URL you then log.

### Option B — Real database, if you need to query across SMEs

Only worth it if you want aggregate reporting ("what % of clinics fail A.8.4(g)?"),
which is genuinely valuable to CSA but changes the risk profile completely.

| Service | Free tier | Notes |
|---|---|---|
| **Neon** | 0.5 GB, scales to zero | Postgres, best free Postgres for serverless |
| **Supabase** | 500 MB | Postgres + auth if you later want accounts |
| **Turso** | 500 DBs, 9 GB | libSQL/SQLite, very cheap per-tenant DBs |

If you go here, **separate the two things you are storing**:

- *Assessment answers* — need to persist, tied to a token.
- *Aggregate statistics* — anonymised, no org identifier, written once and never
  joined back. Store these in a different table with no foreign key to the first.

That separation is what lets you answer CSA's questions without holding a
kompromat file on every SME in the country.

### Option C — No server at all

Add "Download my session" / "Restore from file" buttons that read and write the
store blob as JSON. Zero infrastructure, zero risk, and it solves the "I want to
finish this on the office PC" case. Worth adding regardless of A or B, because it
also gives the SME a copy to hand their IT vendor.

### What I would actually do

1. Ship with `localStorage` + Option C (file export/import). No backend, no risk.
2. Add Option A (Upstash + resume token) when users ask to switch devices.
3. Only consider Option B once someone has a concrete reporting requirement, and
   then split the tables as above.

---

## 2. Getting it online

### Push to GitHub

From `C:\Users\USER\Desktop\sg-cyber-ready`:

```bash
git init -b main
```

```bash
git add -A && git commit -m "Cyber Essentials Tool — initial commit"
```

Create the remote and push (GitHub CLI, easiest — it handles auth):

```bash
gh repo create cyber-essentials-tool --private --source=. --remote=origin --push
```

No `gh`? Create the repo in the GitHub web UI, then:

```bash
git remote add origin https://github.com/<you>/cyber-essentials-tool.git && git push -u origin main
```

**Check before pushing:** `.gitignore` already excludes `node_modules/`, `.next/`,
`data/*.db` and `.env.local`. Nothing in the repo holds secrets today, but confirm
with `git status` that no `sg-cyber-ready-result.json` from your own machine is
staged — those contain your real configuration state.

### Deploy to Vercel

The app is a stock Next.js 15 App Router project with no database, so this is close
to zero-config.

**Via the dashboard:**

1. vercel.com → **Add New… → Project** → import the GitHub repo.
2. Framework preset: **Next.js** (auto-detected). Build command, output directory
   and install command: leave as defaults.
3. Environment variables: **none required.**
4. **Deploy.** First build takes about a minute.

**Via CLI:**

```bash
npx vercel --prod
```

**Two things that matter for this app specifically:**

- **The scanner works on Vercel** because of the DNS-over-HTTPS fallback. Serverless
  functions cannot reliably use port 53, so a scanner built only on `node:dns` would
  silently fail in production. `lib/resolver.ts` falls back to DoH over 443, which
  is exactly why that fallback exists.
- **`/api/scan` must stay on the Node runtime.** It uses `node:tls` for the
  certificate inspection, which the Edge runtime does not provide. The route already
  declares `export const runtime = "nodejs"` — leave it.

Expect the scan route to take 2–4 seconds. Vercel Hobby allows 10s, so it fits, but
if you add checks keep an eye on it and raise `maxDuration` if needed.

### Free alternatives

| Host | Fit |
|---|---|
| **Vercel** | Best — built for Next.js, Node runtime, generous Hobby tier |
| **Netlify** | Works via `@netlify/plugin-nextjs`; slightly more setup |
| **Cloudflare Pages** | Needs the OpenNext adapter, and `node:tls` is a problem — would need the TLS check reworked |
| **Render** | Runs it as a plain Node service; simplest mental model, slower cold starts |

Vercel unless you have a reason.

### One caution before it is public

Right now anyone can point the scanner at any domain. That is fine for a prototype
and matches what the Internet Hygiene Portal does, but before a public launch add:

- rate limiting per IP on `/api/scan`,
- a blocklist for obvious targets you should not be scanning on someone's behalf,
- and ideally domain ownership verification (a DNS TXT record) before storing
  results against an organisation.

Without that, a public deployment is a free reconnaissance service with your name
on the logs.
