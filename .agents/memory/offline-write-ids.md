---
name: Offline write IDs
description: How temporary IDs work for offline-created records before server sync
---

## Rule
When creating records offline (or when server is unreachable), generate a negative integer ID and store it in Dexie. Persist the counter in `syncMeta` table under key `lastTempId`.

**Why:** Server uses positive auto-increment IDs; negative IDs are safe to use as temporary keys without collision. The negative ID becomes the URL param (e.g., `/songs/-1`) until sync replaces it with the real server ID.

**How to apply:**
- `generateTempId()` in `src/lib/local-db.ts` — reads/writes `syncMeta.lastTempId`
- `isTempId(id)` returns `true` for `id < 0`
- `local-ops.ts` write functions: try server first → on failure, fall back to temp ID + `syncPending: true`
- `pushPendingToServer()` in `sync.ts` — on push, deletes temp record and replaces with real server ID record
- Song versions cannot be created on a temp-ID song (server requires a real song ID foreign key)
