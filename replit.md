# Songbook

A personal offline-first songbook for musicians — store song lyrics, create setlists, and organize songs by category.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, served at `/api`)
- `pnpm --filter @workspace/songbook run dev` — run the frontend (port 21003, served at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run typecheck:libs` — rebuild lib declarations (run this before API server typecheck when schema changes)
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Frontend: React + Vite, TanStack Query, Wouter router, shadcn/ui, Tailwind CSS
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source-of-truth API contract
- `lib/db/src/schema/` — Drizzle ORM schema (categories, songs, setlists, setlist_songs)
- `lib/api-client-react/src/generated/` — generated React Query hooks (do not edit)
- `lib/api-zod/src/generated/` — generated Zod schemas (do not edit)
- `artifacts/api-server/src/routes/` — Express route handlers (categories, songs, setlists)
- `artifacts/songbook/src/pages/` — React pages (dashboard, songs, setlists, categories)
- `artifacts/songbook/src/components/` — shared UI components and layout

## Architecture decisions

- Contract-first: OpenAPI spec drives codegen for both React hooks and Zod validators
- Routes mount at `/api` prefix; all route files handle paths without the prefix
- `/songs/stats` registered BEFORE `/songs/:id` to prevent Express treating "stats" as an id param
- `removeSongFromSetlist` deletes by junction table row id (`setlist_songs.id`), not song id
- Always run `pnpm run typecheck:libs` before leaf artifact typechecks after any `lib/` schema changes

## Product

- Song library with full lyrics, chords, key, tempo, notes, and category tagging
- Searchable and filterable song list
- Setlists (stage lineups) with ordered songs, drag-to-reorder, and song management
- Category management with custom colors
- Dashboard with stats, recent songs, and category breakdown
- Dark mode support, warm analog aesthetic

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm run typecheck:libs` before `pnpm --filter @workspace/api-server run typecheck` — stale lib declarations cause false TS errors
- Do NOT run `pnpm dev` at the workspace root — use workflows or per-package filter commands
- `lucide-react` does not have a `Metronome` icon — use `Timer` instead

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
