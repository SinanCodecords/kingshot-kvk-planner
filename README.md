# Kingshot Tools

Web tools for our Kingshot alliance. Next.js (App Router) + Tailwind + shadcn/ui, with Convex for the database and server functions.

## Tools

| Tool | Player page | Admin |
| --- | --- | --- |
| KvK Appointment Planner | `/kvk` (sign-up), `/kvk/schedule` (public schedule) | `/admin/kvk` |

## Development

```bash
pnpm install
pnpm convex dev   # keeps Convex functions in sync, writes .env.local
pnpm dev          # http://localhost:3000
```

Set the admin password on the Convex deployment (dashboard → Settings → Environment Variables, or):

```bash
pnpm convex env set ADMIN_PASSWORD 'your-password'
```

## Layout

- `src/lib/tools.ts` — tools registry shown on the home page
- `src/app/<tool>/` — routes for each tool
- `src/components/tools/<tool>/` — UI for each tool
- `convex/<tool>/` — Convex functions for each tool; `convex/schema.ts` holds all tables
- `convex/lib/kvk.ts` — ranking and auto-assign logic (shared with the browser)

To add a tool: add an entry to `src/lib/tools.ts`, a route folder under `src/app/`, its components, and its Convex functions.

## Deploying (Vercel)

1. In the Convex dashboard, generate a Production deploy key and add it to Vercel as `CONVEX_DEPLOY_KEY`.
2. Set the Vercel build command to `pnpm convex deploy --cmd 'pnpm build'`.
3. `pnpm convex env set --prod ADMIN_PASSWORD 'your-password'`.
