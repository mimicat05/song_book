import Dexie, { type Table } from "dexie";

export interface LocalSong {
  id: number;
  title: string;
  artist?: string | null;
  language?: string | null;
  lyrics?: string | null;
  chords?: string | null;
  key?: string | null;
  notes?: string | null;
  categoryId?: number | null;
  createdAt: string;
  updatedAt: string;
  syncPending?: boolean;
  pendingDelete?: boolean;
}

export interface LocalSongVersion {
  id: number;
  songId: number;
  name: string;
  title?: string | null;
  artist?: string | null;
  lyrics?: string | null;
  chords?: string | null;
  key?: string | null;
  createdAt: string;
  updatedAt: string;
  syncPending?: boolean;
  pendingDelete?: boolean;
}

export interface LocalCategory {
  id: number;
  name: string;
  color: string;
  createdAt: string;
  syncPending?: boolean;
  pendingDelete?: boolean;
}

export interface LocalSetlist {
  id: number;
  name: string;
  description?: string | null;
  venue?: string | null;
  date?: string | null;
  createdAt: string;
  updatedAt: string;
  syncPending?: boolean;
  pendingDelete?: boolean;
}

export interface LocalSetlistSong {
  id: number;
  setlistId: number;
  songId: number;
  position: number;
  notes?: string | null;
  syncPending?: boolean;
  pendingDelete?: boolean;
}

export interface SyncMeta {
  key: string;
  value: string;
}

class SongbookDB extends Dexie {
  songs!: Table<LocalSong>;
  songVersions!: Table<LocalSongVersion>;
  categories!: Table<LocalCategory>;
  setlists!: Table<LocalSetlist>;
  setlistSongs!: Table<LocalSetlistSong>;
  syncMeta!: Table<SyncMeta>;

  constructor() {
    super("songbook-v1");
    this.version(1).stores({
      songs: "id, title, artist, language, categoryId, updatedAt, syncPending, pendingDelete",
      songVersions: "id, songId, name, syncPending",
      categories: "id, name, syncPending",
      setlists: "id, name, date, updatedAt, syncPending",
      setlistSongs: "id, setlistId, songId, position, syncPending",
      syncMeta: "key",
    });
  }
}

export const db = new SongbookDB();

let _tempIdCounter: number | null = null;

async function getNextTempId(): Promise<number> {
  if (_tempIdCounter === null) {
    const meta = await db.syncMeta.get("lastTempId");
    _tempIdCounter = meta ? parseInt(meta.value, 10) : -1;
  }
  const id = _tempIdCounter!;
  _tempIdCounter!--;
  await db.syncMeta.put({ key: "lastTempId", value: String(_tempIdCounter) });
  return id;
}

export async function generateTempSongId(): Promise<number> {
  return getNextTempId();
}

export async function generateTempId(): Promise<number> {
  return getNextTempId();
}

export function isTempId(id: number): boolean {
  return id < 0;
}
