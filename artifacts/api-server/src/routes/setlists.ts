import { Router } from "express";
import { db, setlistsTable, setlistSongsTable, songsTable, categoriesTable } from "@workspace/db";
import { eq, desc, asc, sql } from "drizzle-orm";
import {
  CreateSetlistBody,
  UpdateSetlistBody,
  UpdateSetlistParams,
  DeleteSetlistParams,
  GetSetlistParams,
  AddSongToSetlistBody,
  AddSongToSetlistParams,
  RemoveSongFromSetlistParams,
  ReorderSetlistSongBody,
  ReorderSetlistSongParams,
} from "@workspace/api-zod";

const router = Router();

function formatSong(song: Record<string, unknown>, category?: Record<string, unknown> | null) {
  return {
    ...song,
    createdAt: (song.createdAt as Date).toISOString(),
    updatedAt: (song.updatedAt as Date).toISOString(),
    categoryName: category ? (category.name as string) : null,
    categoryColor: category ? (category.color as string) : null,
  };
}

router.get("/setlists", async (_req, res) => {
  const setlists = await db.select().from(setlistsTable).orderBy(desc(setlistsTable.updatedAt));
  const counts = await db
    .select({ setlistId: setlistSongsTable.setlistId, count: sql<number>`count(*)::int` })
    .from(setlistSongsTable)
    .groupBy(setlistSongsTable.setlistId);
  const countMap = new Map(counts.map((c) => [c.setlistId, c.count]));
  res.json(
    setlists.map((s) => ({
      ...s,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
      songCount: countMap.get(s.id) ?? 0,
    }))
  );
});

router.post("/setlists", async (req, res) => {
  const parsed = CreateSetlistBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const [setlist] = await db.insert(setlistsTable).values(parsed.data).returning();
  res.status(201).json({ ...setlist, createdAt: setlist.createdAt.toISOString(), updatedAt: setlist.updatedAt.toISOString(), songCount: 0 });
});

router.get("/setlists/:id", async (req, res) => {
  const params = GetSetlistParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [setlist] = await db.select().from(setlistsTable).where(eq(setlistsTable.id, params.data.id));
  if (!setlist) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const rows = await db
    .select({ ss: setlistSongsTable, song: songsTable, category: categoriesTable })
    .from(setlistSongsTable)
    .innerJoin(songsTable, eq(setlistSongsTable.songId, songsTable.id))
    .leftJoin(categoriesTable, eq(songsTable.categoryId, categoriesTable.id))
    .where(eq(setlistSongsTable.setlistId, params.data.id))
    .orderBy(asc(setlistSongsTable.position));

  const songs = rows.map((r) => ({
    ...r.ss,
    song: formatSong(r.song as unknown as Record<string, unknown>, r.category as Record<string, unknown> | null),
  }));

  res.json({
    ...setlist,
    createdAt: setlist.createdAt.toISOString(),
    updatedAt: setlist.updatedAt.toISOString(),
    songs,
  });
});

router.patch("/setlists/:id", async (req, res) => {
  const params = UpdateSetlistParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = UpdateSetlistBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const [setlist] = await db
    .update(setlistsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(setlistsTable.id, params.data.id))
    .returning();
  if (!setlist) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(setlistSongsTable)
    .where(eq(setlistSongsTable.setlistId, setlist.id));
  res.json({
    ...setlist,
    createdAt: setlist.createdAt.toISOString(),
    updatedAt: setlist.updatedAt.toISOString(),
    songCount: countRow?.count ?? 0,
  });
});

router.delete("/setlists/:id", async (req, res) => {
  const params = DeleteSetlistParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(setlistsTable).where(eq(setlistsTable.id, params.data.id));
  res.status(204).send();
});

router.post("/setlists/:id/songs", async (req, res) => {
  const params = AddSongToSetlistParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = AddSongToSetlistBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const [maxRow] = await db
    .select({ max: sql<number>`coalesce(max(position), -1)::int` })
    .from(setlistSongsTable)
    .where(eq(setlistSongsTable.setlistId, params.data.id));
  const position = parsed.data.position ?? (maxRow?.max ?? -1) + 1;

  const [ss] = await db
    .insert(setlistSongsTable)
    .values({ setlistId: params.data.id, songId: parsed.data.songId, position, notes: parsed.data.notes })
    .returning();

  const [row] = await db
    .select({ song: songsTable, category: categoriesTable })
    .from(songsTable)
    .leftJoin(categoriesTable, eq(songsTable.categoryId, categoriesTable.id))
    .where(eq(songsTable.id, ss.songId));

  res.status(201).json({
    ...ss,
    song: formatSong(row.song as unknown as Record<string, unknown>, row.category as Record<string, unknown> | null),
  });
});

router.delete("/setlists/:id/songs/:songId", async (req, res) => {
  const params = RemoveSongFromSetlistParams.safeParse({ id: Number(req.params.id), songId: Number(req.params.songId) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid params" });
    return;
  }
  await db
    .delete(setlistSongsTable)
    .where(eq(setlistSongsTable.id, params.data.songId));
  res.status(204).send();
});

router.patch("/setlists/:id/songs/:songId", async (req, res) => {
  const params = ReorderSetlistSongParams.safeParse({ id: Number(req.params.id), songId: Number(req.params.songId) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid params" });
    return;
  }
  const parsed = ReorderSetlistSongBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const [current] = await db
    .select()
    .from(setlistSongsTable)
    .where(eq(setlistSongsTable.id, params.data.songId));
  if (!current) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const targetPosition = parsed.data.position;
  const [displaced] = await db
    .select()
    .from(setlistSongsTable)
    .where(eq(setlistSongsTable.setlistId, current.setlistId))
    .where(eq(setlistSongsTable.position, targetPosition));

  if (displaced && displaced.id !== current.id) {
    await db
      .update(setlistSongsTable)
      .set({ position: current.position })
      .where(eq(setlistSongsTable.id, displaced.id));
  }

  const [ss] = await db
    .update(setlistSongsTable)
    .set({ position: targetPosition, notes: parsed.data.notes })
    .where(eq(setlistSongsTable.id, params.data.songId))
    .returning();

  const [row] = await db
    .select({ song: songsTable, category: categoriesTable })
    .from(songsTable)
    .leftJoin(categoriesTable, eq(songsTable.categoryId, categoriesTable.id))
    .where(eq(songsTable.id, ss.songId));

  res.json({
    ...ss,
    song: formatSong(row.song as unknown as Record<string, unknown>, row.category as Record<string, unknown> | null),
  });
});

export default router;
