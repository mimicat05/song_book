import { Router } from "express";
import { db, songsTable, categoriesTable, setlistsTable, setlistSongsTable, songVersionsTable } from "@workspace/db";
import { asc, desc } from "drizzle-orm";

const router = Router();

router.get("/export", async (_req, res) => {
  const [songs, categories, setlists, setlistSongs, versions] = await Promise.all([
    db.select().from(songsTable).orderBy(desc(songsTable.updatedAt)),
    db.select().from(categoriesTable).orderBy(asc(categoriesTable.id)),
    db.select().from(setlistsTable).orderBy(desc(setlistsTable.updatedAt)),
    db.select().from(setlistSongsTable).orderBy(asc(setlistSongsTable.setlistId), asc(setlistSongsTable.position)),
    db.select().from(songVersionsTable).orderBy(asc(songVersionsTable.songId)),
  ]);

  res.json({
    exportedAt: new Date().toISOString(),
    version: 1,
    songs: songs.map((s) => ({
      ...s,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    })),
    categories: categories.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
    })),
    setlists: setlists.map((sl) => ({
      ...sl,
      createdAt: sl.createdAt.toISOString(),
      updatedAt: sl.updatedAt.toISOString(),
    })),
    setlistSongs,
    songVersions: versions.map((v) => ({
      ...v,
      createdAt: v.createdAt.toISOString(),
      updatedAt: v.updatedAt.toISOString(),
    })),
  });
});

export default router;
