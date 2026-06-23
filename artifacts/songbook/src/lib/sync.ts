import { db, type LocalSong, type LocalCategory, type LocalSetlist, type LocalSetlistSong, type LocalSongVersion, isTempId } from "./local-db";

export type SyncStatus = "idle" | "syncing" | "success" | "error";

export interface SyncProgress {
  status: SyncStatus;
  message: string;
  lastSyncAt: string | null;
}

export async function getLastSyncAt(): Promise<string | null> {
  const meta = await db.syncMeta.get("lastSyncAt");
  return meta?.value ?? null;
}

export async function useOnlineCheck(): Promise<boolean> {
  return navigator.onLine;
}

export interface ExportPack {
  exportedAt: string;
  version: number;
  songs: LocalSong[];
  categories: LocalCategory[];
  setlists: LocalSetlist[];
  setlistSongs: LocalSetlistSong[];
  songVersions: LocalSongVersion[];
}

export async function syncFromServer(onProgress?: (msg: string) => void): Promise<void> {
  onProgress?.("Connecting to server...");

  const resp = await fetch("/api/export");
  if (!resp.ok) {
    throw new Error(`Server returned ${resp.status}`);
  }

  const data: ExportPack = await resp.json();
  onProgress?.(`Received ${data.songs.length} songs, ${data.categories.length} categories...`);

  await db.transaction(
    "rw",
    db.songs,
    db.songVersions,
    db.categories,
    db.setlists,
    db.setlistSongs,
    async () => {
      await db.categories.bulkPut(
        data.categories.map((c) => ({ ...c, syncPending: false, pendingDelete: false }))
      );

      await db.songs.bulkPut(
        data.songs.map((s) => ({ ...s, syncPending: false, pendingDelete: false }))
      );

      await db.songVersions.bulkPut(
        data.songVersions.map((v) => ({ ...v, syncPending: false, pendingDelete: false }))
      );

      await db.setlists.bulkPut(
        data.setlists.map((sl) => ({ ...sl, syncPending: false, pendingDelete: false }))
      );

      await db.setlistSongs.bulkPut(
        data.setlistSongs.map((ss) => ({ ...ss, syncPending: false, pendingDelete: false }))
      );
    }
  );

  onProgress?.("Cleaning up deleted records...");
  const serverSongIds = new Set(data.songs.map((s) => s.id));
  const serverCatIds = new Set(data.categories.map((c) => c.id));
  const serverSetlistIds = new Set(data.setlists.map((sl) => sl.id));

  const localSongs = await db.songs.filter((s) => !isTempId(s.id)).toArray();
  const localCats = await db.categories.filter((c) => !isTempId(c.id)).toArray();
  const localSetlists = await db.setlists.filter((sl) => !isTempId(sl.id)).toArray();

  const deletedSongIds = localSongs.filter((s) => !serverSongIds.has(s.id)).map((s) => s.id);
  const deletedCatIds = localCats.filter((c) => !serverCatIds.has(c.id)).map((c) => c.id);
  const deletedSetlistIds = localSetlists.filter((sl) => !serverSetlistIds.has(sl.id)).map((sl) => sl.id);

  if (deletedSongIds.length > 0) await db.songs.bulkDelete(deletedSongIds);
  if (deletedCatIds.length > 0) await db.categories.bulkDelete(deletedCatIds);
  if (deletedSetlistIds.length > 0) await db.setlists.bulkDelete(deletedSetlistIds);

  await db.syncMeta.put({ key: "lastSyncAt", value: new Date().toISOString() });
  onProgress?.("Sync complete!");
}

export async function pushPendingToServer(): Promise<{ pushed: number; errors: number }> {
  let pushed = 0;
  let errors = 0;

  const pendingSongs = await db.songs.filter((s) => !!s.syncPending && !s.pendingDelete).toArray();
  const pendingDeleteSongs = await db.songs.filter((s) => !!s.pendingDelete).toArray();

  for (const song of pendingDeleteSongs) {
    if (!isTempId(song.id)) {
      try {
        await fetch(`/api/songs/${song.id}`, { method: "DELETE" });
        await db.songs.delete(song.id);
        pushed++;
      } catch {
        errors++;
      }
    } else {
      await db.songs.delete(song.id);
    }
  }

  for (const song of pendingSongs) {
    try {
      const { syncPending, pendingDelete, ...songData } = song;
      if (isTempId(song.id)) {
        const resp = await fetch("/api/songs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: song.title,
            artist: song.artist,
            language: song.language,
            lyrics: song.lyrics,
            chords: song.chords,
            key: song.key,
            notes: song.notes,
            categoryId: song.categoryId,
          }),
        });
        if (resp.ok) {
          const created = await resp.json();
          await db.songs.delete(song.id);
          await db.songs.put({ ...created, syncPending: false, pendingDelete: false });
          pushed++;
        } else {
          errors++;
        }
      } else {
        const resp = await fetch(`/api/songs/${song.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: song.title,
            artist: song.artist,
            language: song.language,
            lyrics: song.lyrics,
            chords: song.chords,
            key: song.key,
            notes: song.notes,
            categoryId: song.categoryId,
          }),
        });
        if (resp.ok) {
          await db.songs.update(song.id, { syncPending: false });
          pushed++;
        } else {
          errors++;
        }
      }
    } catch {
      errors++;
    }
  }

  const pendingCategories = await db.categories.filter((c) => !!c.syncPending && !c.pendingDelete).toArray();
  const pendingDeleteCats = await db.categories.filter((c) => !!c.pendingDelete).toArray();

  for (const cat of pendingDeleteCats) {
    if (!isTempId(cat.id)) {
      try {
        await fetch(`/api/categories/${cat.id}`, { method: "DELETE" });
        await db.categories.delete(cat.id);
        pushed++;
      } catch {
        errors++;
      }
    } else {
      await db.categories.delete(cat.id);
    }
  }

  for (const cat of pendingCategories) {
    try {
      if (isTempId(cat.id)) {
        const resp = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: cat.name, color: cat.color }),
        });
        if (resp.ok) {
          const created = await resp.json();
          await db.categories.delete(cat.id);
          await db.categories.put({ ...created, syncPending: false, pendingDelete: false });
          pushed++;
        } else {
          errors++;
        }
      } else {
        const resp = await fetch(`/api/categories/${cat.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: cat.name, color: cat.color }),
        });
        if (resp.ok) {
          await db.categories.update(cat.id, { syncPending: false });
          pushed++;
        } else {
          errors++;
        }
      }
    } catch {
      errors++;
    }
  }

  const pendingSetlists = await db.setlists.filter((sl) => !!sl.syncPending && !sl.pendingDelete).toArray();
  const pendingDeleteSetlists = await db.setlists.filter((sl) => !!sl.pendingDelete).toArray();

  for (const sl of pendingDeleteSetlists) {
    if (!isTempId(sl.id)) {
      try {
        await fetch(`/api/setlists/${sl.id}`, { method: "DELETE" });
        await db.setlists.delete(sl.id);
        pushed++;
      } catch {
        errors++;
      }
    } else {
      await db.setlists.delete(sl.id);
    }
  }

  for (const sl of pendingSetlists) {
    try {
      if (isTempId(sl.id)) {
        const resp = await fetch("/api/setlists", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: sl.name, date: sl.date }),
        });
        if (resp.ok) {
          const created = await resp.json();
          await db.setlists.delete(sl.id);
          await db.setlists.put({ ...created, syncPending: false, pendingDelete: false });
          pushed++;
        } else {
          errors++;
        }
      } else {
        const resp = await fetch(`/api/setlists/${sl.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: sl.name, date: sl.date }),
        });
        if (resp.ok) {
          await db.setlists.update(sl.id, { syncPending: false });
          pushed++;
        } else {
          errors++;
        }
      }
    } catch {
      errors++;
    }
  }

  return { pushed, errors };
}

export async function fullSync(onProgress?: (msg: string) => void): Promise<void> {
  if (navigator.onLine) {
    onProgress?.("Uploading local changes...");
    await pushPendingToServer();
    onProgress?.("Downloading latest from server...");
    await syncFromServer(onProgress);
  } else {
    throw new Error("No internet connection. Please connect and try again.");
  }
}

export function exportSongPack(data: {
  songs: LocalSong[];
  categories: LocalCategory[];
  setlists: LocalSetlist[];
  setlistSongs: LocalSetlistSong[];
  songVersions: LocalSongVersion[];
}): string {
  const pack: ExportPack = {
    exportedAt: new Date().toISOString(),
    version: 1,
    ...data,
  };
  return JSON.stringify(pack, null, 2);
}

export async function exportLocalData(): Promise<string> {
  const [songs, categories, setlists, setlistSongs, songVersions] = await Promise.all([
    db.songs.filter((s) => !s.pendingDelete).toArray(),
    db.categories.filter((c) => !c.pendingDelete).toArray(),
    db.setlists.filter((sl) => !sl.pendingDelete).toArray(),
    db.setlistSongs.filter((ss) => !ss.pendingDelete).toArray(),
    db.songVersions.filter((v) => !v.pendingDelete).toArray(),
  ]);

  return exportSongPack({ songs, categories, setlists, setlistSongs, songVersions });
}

export async function importSongPack(jsonText: string): Promise<{ imported: number; errors: string[] }> {
  const errors: string[] = [];
  let imported = 0;

  let pack: ExportPack;
  try {
    pack = JSON.parse(jsonText);
  } catch {
    throw new Error("Invalid file: could not parse JSON.");
  }

  if (!pack.version || !Array.isArray(pack.songs)) {
    throw new Error("Invalid song pack format.");
  }

  await db.transaction(
    "rw",
    db.songs,
    db.songVersions,
    db.categories,
    db.setlists,
    db.setlistSongs,
    async () => {
      if (pack.categories?.length) {
        await db.categories.bulkPut(
          pack.categories.map((c) => ({ ...c, syncPending: true, pendingDelete: false }))
        );
        imported += pack.categories.length;
      }

      if (pack.songs?.length) {
        await db.songs.bulkPut(
          pack.songs.map((s) => ({ ...s, syncPending: true, pendingDelete: false }))
        );
        imported += pack.songs.length;
      }

      if (pack.songVersions?.length) {
        await db.songVersions.bulkPut(
          pack.songVersions.map((v) => ({ ...v, syncPending: true, pendingDelete: false }))
        );
        imported += pack.songVersions.length;
      }

      if (pack.setlists?.length) {
        await db.setlists.bulkPut(
          pack.setlists.map((sl) => ({ ...sl, syncPending: true, pendingDelete: false }))
        );
        imported += pack.setlists.length;
      }

      if (pack.setlistSongs?.length) {
        await db.setlistSongs.bulkPut(
          pack.setlistSongs.map((ss) => ({ ...ss, syncPending: true, pendingDelete: false }))
        );
        imported += pack.setlistSongs.length;
      }
    }
  );

  return { imported, errors };
}
