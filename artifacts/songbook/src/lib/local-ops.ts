import { db, generateTempId, isTempId, type LocalSong, type LocalCategory, type LocalSetlist } from "./local-db";

async function now() {
  return new Date().toISOString();
}

export async function createSong(data: {
  title: string;
  artist?: string;
  language?: string;
  lyrics?: string;
  chords?: string;
  key?: string;
  notes?: string;
  categoryId?: number | null;
}): Promise<{ id: number; isTemp: boolean }> {
  const ts = await now();
  if (navigator.onLine) {
    try {
      const resp = await fetch("/api/songs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (resp.ok) {
        const song = await resp.json();
        await db.songs.put({
          id: song.id,
          title: song.title,
          artist: song.artist ?? null,
          language: song.language ?? null,
          lyrics: song.lyrics ?? null,
          chords: song.chords ?? null,
          key: song.key ?? null,
          notes: song.notes ?? null,
          categoryId: song.categoryId ?? null,
          createdAt: song.createdAt,
          updatedAt: song.updatedAt,
          syncPending: false,
          pendingDelete: false,
        });
        return { id: song.id, isTemp: false };
      }
    } catch {}
  }
  const tempId = await generateTempId();
  await db.songs.put({
    id: tempId,
    title: data.title,
    artist: data.artist ?? null,
    language: data.language ?? null,
    lyrics: data.lyrics ?? null,
    chords: data.chords ?? null,
    key: data.key ?? null,
    notes: data.notes ?? null,
    categoryId: data.categoryId ?? null,
    createdAt: ts,
    updatedAt: ts,
    syncPending: true,
    pendingDelete: false,
  });
  return { id: tempId, isTemp: true };
}

export async function updateSong(
  id: number,
  data: {
    title?: string;
    artist?: string;
    language?: string;
    lyrics?: string;
    chords?: string;
    key?: string;
    notes?: string;
    categoryId?: number | null;
  }
): Promise<void> {
  const ts = await now();
  if (navigator.onLine && !isTempId(id)) {
    try {
      const resp = await fetch(`/api/songs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (resp.ok) {
        const song = await resp.json();
        await db.songs.update(id, {
          ...data,
          updatedAt: song.updatedAt,
          syncPending: false,
        });
        return;
      }
    } catch {}
  }
  await db.songs.update(id, { ...data, updatedAt: ts, syncPending: true });
}

export async function deleteSong(id: number): Promise<void> {
  if (isTempId(id)) {
    await db.songs.delete(id);
    return;
  }
  if (navigator.onLine) {
    try {
      const resp = await fetch(`/api/songs/${id}`, { method: "DELETE" });
      if (resp.ok || resp.status === 204 || resp.status === 404) {
        await db.songs.delete(id);
        await db.songVersions.where("songId").equals(id).delete();
        return;
      }
    } catch {}
  }
  await db.songs.update(id, { pendingDelete: true });
}

export async function createCategory(data: { name: string; color: string }): Promise<{ id: number; isTemp: boolean }> {
  const ts = await now();
  if (navigator.onLine) {
    try {
      const resp = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (resp.ok) {
        const cat = await resp.json();
        await db.categories.put({ ...cat, createdAt: cat.createdAt, syncPending: false, pendingDelete: false });
        return { id: cat.id, isTemp: false };
      }
    } catch {}
  }
  const tempId = await generateTempId();
  await db.categories.put({ id: tempId, ...data, createdAt: ts, syncPending: true, pendingDelete: false });
  return { id: tempId, isTemp: true };
}

export async function updateCategory(id: number, data: { name: string; color: string }): Promise<void> {
  if (navigator.onLine && !isTempId(id)) {
    try {
      const resp = await fetch(`/api/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (resp.ok) {
        await db.categories.update(id, { ...data, syncPending: false });
        return;
      }
    } catch {}
  }
  await db.categories.update(id, { ...data, syncPending: true });
}

export async function deleteCategory(id: number): Promise<void> {
  if (isTempId(id)) {
    await db.categories.delete(id);
    return;
  }
  if (navigator.onLine) {
    try {
      const resp = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (resp.ok || resp.status === 204 || resp.status === 404) {
        await db.categories.delete(id);
        await db.songs.where("categoryId").equals(id).modify({ categoryId: null });
        return;
      }
    } catch {}
  }
  await db.categories.update(id, { pendingDelete: true });
}

export async function createSetlist(data: { name: string; date?: string }): Promise<{ id: number; isTemp: boolean }> {
  const ts = await now();
  if (navigator.onLine) {
    try {
      const resp = await fetch("/api/setlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (resp.ok) {
        const sl = await resp.json();
        await db.setlists.put({ ...sl, createdAt: sl.createdAt, updatedAt: sl.updatedAt, syncPending: false, pendingDelete: false });
        return { id: sl.id, isTemp: false };
      }
    } catch {}
  }
  const tempId = await generateTempId();
  await db.setlists.put({ id: tempId, name: data.name, date: data.date ?? null, createdAt: ts, updatedAt: ts, syncPending: true, pendingDelete: false });
  return { id: tempId, isTemp: true };
}

export async function deleteSetlist(id: number): Promise<void> {
  if (isTempId(id)) {
    await db.setlists.delete(id);
    await db.setlistSongs.where("setlistId").equals(id).delete();
    return;
  }
  if (navigator.onLine) {
    try {
      const resp = await fetch(`/api/setlists/${id}`, { method: "DELETE" });
      if (resp.ok || resp.status === 204 || resp.status === 404) {
        await db.setlists.delete(id);
        await db.setlistSongs.where("setlistId").equals(id).delete();
        return;
      }
    } catch {}
  }
  await db.setlists.update(id, { pendingDelete: true });
}

export async function addSongToSetlist(
  setlistId: number,
  songId: number
): Promise<void> {
  const existing = await db.setlistSongs.where("setlistId").equals(setlistId).toArray();
  const position = existing.length + 1;

  if (navigator.onLine && !isTempId(setlistId)) {
    try {
      const resp = await fetch(`/api/setlists/${setlistId}/songs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songId }),
      });
      if (resp.ok) {
        const entry = await resp.json();
        await db.setlistSongs.put({ ...entry, syncPending: false, pendingDelete: false });
        return;
      }
    } catch {}
  }
  const tempId = await generateTempId();
  await db.setlistSongs.put({ id: tempId, setlistId, songId, position, syncPending: true, pendingDelete: false });
}

export async function removeSongFromSetlist(setlistSongEntryId: number): Promise<void> {
  if (isTempId(setlistSongEntryId)) {
    await db.setlistSongs.delete(setlistSongEntryId);
    return;
  }
  const entry = await db.setlistSongs.get(setlistSongEntryId);
  if (!entry) return;
  if (navigator.onLine) {
    try {
      const resp = await fetch(`/api/setlists/${entry.setlistId}/songs/${setlistSongEntryId}`, { method: "DELETE" });
      if (resp.ok || resp.status === 204 || resp.status === 404) {
        await db.setlistSongs.delete(setlistSongEntryId);
        return;
      }
    } catch {}
  }
  await db.setlistSongs.update(setlistSongEntryId, { pendingDelete: true });
}

export async function reorderSetlistSong(
  setlistId: number,
  setlistSongEntryId: number,
  newPosition: number
): Promise<void> {
  await db.setlistSongs.update(setlistSongEntryId, { position: newPosition, syncPending: true });
  if (navigator.onLine && !isTempId(setlistSongEntryId)) {
    try {
      await fetch(`/api/setlists/${setlistId}/songs/${setlistSongEntryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ position: newPosition }),
      });
      await db.setlistSongs.update(setlistSongEntryId, { syncPending: false });
    } catch {}
  }
}
