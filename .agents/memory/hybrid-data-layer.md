---
name: Hybrid local/server data layer
description: Architecture for offline-first data with IndexedDB primary and PostgreSQL server as master backup
---

## Rule
All reads come from IndexedDB (Dexie). Writes go to local DB first, then server when online.

**Why:** Enables offline reading of song lyrics on stage (primary use case). Also enables cross-device sync and JSON export/import.

**How to apply:**
- All page data hooks live in `src/lib/use-local-db.ts` and use `useDexieQuery` (custom hook wrapping `liveQuery` from Dexie)
- All write operations live in `src/lib/local-ops.ts` (createSong, updateSong, deleteSong, createCategory, etc.)
- Server pull endpoint: `GET /api/export` returns all data in one payload
- Sync engine: `src/lib/sync.ts` — `fullSync()` pushes pending then pulls server
- Settings page at `/settings` has Sync, Export Song Pack, Import Song Pack, Clear Local Data
- Compact sync status (wifi indicator + sync button) lives in sidebar bottom

## Critical: do NOT use dexie-react-hooks
`dexie-react-hooks` causes "Invalid hook call / multiple React copies" error in this project.
Use the custom `useDexieQuery` in `use-local-db.ts` which wraps `liveQuery` from the main `dexie` package with standard `useState`/`useEffect`.
