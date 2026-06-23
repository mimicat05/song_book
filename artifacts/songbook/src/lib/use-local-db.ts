import { useState, useEffect } from "react";
import { liveQuery } from "dexie";
import { db, type LocalSong, type LocalSongVersion, type LocalCategory, type LocalSetlist, type LocalSetlistSong } from "./local-db";

function useDexieQuery<T>(queryFn: () => Promise<T>, deps: unknown[]): T | undefined {
  const [result, setResult] = useState<T | undefined>(undefined);

  useEffect(() => {
    setResult(undefined);
    const observable = liveQuery(queryFn);
    const subscription = observable.subscribe({
      next: (val) => setResult(val),
      error: (err) => console.error("[useDexieQuery]", err),
    });
    return () => subscription.unsubscribe();
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  return result;
}

export type SongWithMeta = LocalSong & {
  categoryName: string | null;
  categoryColor: string | null;
  versions: { name: string; title: string | null }[];
};

export type SetlistWithCount = LocalSetlist & {
  songCount: number;
};

export type SetlistWithSongs = LocalSetlist & {
  songs: (LocalSetlistSong & {
    song: { id: number; title: string; artist?: string | null; key?: string | null };
  })[];
};

function buildCategoryMap(categories: LocalCategory[]): Map<number, LocalCategory> {
  return new Map(categories.map((c) => [c.id, c]));
}

export function useLocalSongs(filters?: {
  search?: string;
  categoryId?: number;
  language?: string;
}) {
  const search = filters?.search;
  const categoryId = filters?.categoryId;
  const language = filters?.language;

  const data = useDexieQuery(async () => {
    const [allSongs, allCategories, allVersions] = await Promise.all([
      db.songs.filter((s) => !s.pendingDelete).toArray(),
      db.categories.filter((c) => !c.pendingDelete).toArray(),
      db.songVersions.filter((v) => !v.pendingDelete).toArray(),
    ]);

    const catMap = buildCategoryMap(allCategories);
    const versionsBySongId = new Map<number, { name: string; title: string | null }[]>();
    for (const v of allVersions) {
      const existing = versionsBySongId.get(v.songId) ?? [];
      existing.push({ name: v.name, title: v.title ?? null });
      versionsBySongId.set(v.songId, existing);
    }

    let songs = allSongs;

    const searchLower = search?.toLowerCase();
    if (searchLower) {
      songs = songs.filter(
        (s) =>
          s.title.toLowerCase().includes(searchLower) ||
          (s.artist?.toLowerCase().includes(searchLower) ?? false) ||
          (s.lyrics?.toLowerCase().includes(searchLower) ?? false)
      );
    }

    if (categoryId !== undefined) {
      songs = songs.filter((s) => s.categoryId === categoryId);
    }

    if (language) {
      const versionSongIds = new Set(
        allVersions.filter((v) => v.name === language).map((v) => v.songId)
      );
      songs = songs.filter((s) => s.language === language || versionSongIds.has(s.id));
    }

    songs = [...songs].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    return songs.map((song): SongWithMeta => {
      const cat = song.categoryId ? catMap.get(song.categoryId) : undefined;
      return {
        ...song,
        categoryName: cat?.name ?? null,
        categoryColor: cat?.color ?? null,
        versions: versionsBySongId.get(song.id) ?? [],
      };
    });
  }, [search, categoryId, language]);

  return { data, isLoading: data === undefined };
}

export function useLocalSong(id: number) {
  const data = useDexieQuery(async () => {
    if (!id) return null;
    const [song, allCategories] = await Promise.all([
      db.songs.get(id),
      db.categories.toArray(),
    ]);
    if (!song || song.pendingDelete) return null;
    const catMap = buildCategoryMap(allCategories);
    const cat = song.categoryId ? catMap.get(song.categoryId) : undefined;
    return {
      ...song,
      categoryName: cat?.name ?? null,
      categoryColor: cat?.color ?? null,
    };
  }, [id]);

  return {
    data: data === undefined ? undefined : data,
    isLoading: data === undefined,
    isError: data === null,
  };
}

export function useLocalSongStats() {
  const data = useDexieQuery(async () => {
    const [allSongs, allCategories] = await Promise.all([
      db.songs.filter((s) => !s.pendingDelete).toArray(),
      db.categories.filter((c) => !c.pendingDelete).toArray(),
    ]);
    const catMap = buildCategoryMap(allCategories);

    const total = allSongs.length;

    const recentSongs = [...allSongs]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map((s) => {
        const cat = s.categoryId ? catMap.get(s.categoryId) : undefined;
        return {
          ...s,
          categoryName: cat?.name ?? null,
          categoryColor: cat?.color ?? null,
        };
      });

    const catCountMap = new Map<number | null, number>();
    for (const s of allSongs) {
      const key = s.categoryId ?? null;
      catCountMap.set(key, (catCountMap.get(key) ?? 0) + 1);
    }

    const byCategory = Array.from(catCountMap.entries()).map(([catId, count]) => {
      const cat = catId !== null ? catMap.get(catId) : undefined;
      return {
        categoryId: catId,
        categoryName: cat?.name ?? null,
        categoryColor: cat?.color ?? null,
        count,
      };
    });

    return { total, recentSongs, byCategory };
  }, []);

  return { data, isLoading: data === undefined, isError: false };
}

export function useLocalCategories() {
  const data = useDexieQuery(
    () => db.categories.filter((c) => !c.pendingDelete).toArray(),
    []
  );
  return { data, isLoading: data === undefined };
}

export function useLocalSetlists() {
  const data = useDexieQuery(async () => {
    const [setlists, setlistSongs] = await Promise.all([
      db.setlists.filter((sl) => !sl.pendingDelete).toArray(),
      db.setlistSongs.filter((ss) => !ss.pendingDelete).toArray(),
    ]);

    const countMap = new Map<number, number>();
    for (const ss of setlistSongs) {
      countMap.set(ss.setlistId, (countMap.get(ss.setlistId) ?? 0) + 1);
    }

    return [...setlists]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .map((sl): SetlistWithCount => ({
        ...sl,
        songCount: countMap.get(sl.id) ?? 0,
      }));
  }, []);

  return { data, isLoading: data === undefined };
}

export function useLocalSetlist(id: number) {
  const data = useDexieQuery(async () => {
    if (!id) return null;
    const [setlist, allSetlistSongs, allSongs] = await Promise.all([
      db.setlists.get(id),
      db.setlistSongs.where("setlistId").equals(id).filter((ss) => !ss.pendingDelete).toArray(),
      db.songs.filter((s) => !s.pendingDelete).toArray(),
    ]);
    if (!setlist || setlist.pendingDelete) return null;

    const songMap = new Map(allSongs.map((s) => [s.id, s]));
    const songs = allSetlistSongs
      .sort((a, b) => a.position - b.position)
      .map((ss) => {
        const song = songMap.get(ss.songId);
        return {
          ...ss,
          song: {
            id: ss.songId,
            title: song?.title ?? "(Unknown)",
            artist: song?.artist ?? null,
            key: song?.key ?? null,
          },
        };
      });

    return { ...setlist, songs };
  }, [id]);

  return {
    data: data === undefined ? undefined : data,
    isLoading: data === undefined,
    isError: data === null,
  };
}

export function useLocalSongVersions(songId: number) {
  const data = useDexieQuery(
    () =>
      db.songVersions
        .where("songId")
        .equals(songId)
        .filter((v) => !v.pendingDelete)
        .toArray(),
    [songId]
  );
  return { data: data ?? [], isLoading: data === undefined };
}

export function useHasSyncPending() {
  const data = useDexieQuery(async () => {
    const [songs, cats, setlists] = await Promise.all([
      db.songs.filter((s) => !!s.syncPending || !!s.pendingDelete).count(),
      db.categories.filter((c) => !!c.syncPending || !!c.pendingDelete).count(),
      db.setlists.filter((sl) => !!sl.syncPending || !!sl.pendingDelete).count(),
    ]);
    return songs + cats + setlists;
  }, []);
  return (data ?? 0) > 0;
}
