import { Router } from "express";
import { db, songsTable, categoriesTable } from "@workspace/db";
import { eq, desc, ilike, and, sql } from "drizzle-orm";
import {
  CreateSongBody,
  UpdateSongBody,
  UpdateSongParams,
  DeleteSongParams,
  GetSongParams,
  ListSongsQueryParams,
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

router.get("/songs/stats", async (_req, res) => {
  const total = await db.$count(songsTable);

  const recentRaw = await db
    .select({
      song: songsTable,
      category: categoriesTable,
    })
    .from(songsTable)
    .leftJoin(categoriesTable, eq(songsTable.categoryId, categoriesTable.id))
    .orderBy(desc(songsTable.createdAt))
    .limit(5);

  const byCategoryRaw = await db
    .select({
      categoryId: songsTable.categoryId,
      categoryName: categoriesTable.name,
      categoryColor: categoriesTable.color,
      count: sql<number>`count(*)::int`,
    })
    .from(songsTable)
    .leftJoin(categoriesTable, eq(songsTable.categoryId, categoriesTable.id))
    .groupBy(songsTable.categoryId, categoriesTable.name, categoriesTable.color);

  res.json({
    total,
    recentSongs: recentRaw.map((r) => formatSong(r.song as unknown as Record<string, unknown>, r.category as Record<string, unknown> | null)),
    byCategory: byCategoryRaw.map((r) => ({
      categoryId: r.categoryId,
      categoryName: r.categoryName ?? null,
      categoryColor: r.categoryColor ?? null,
      count: r.count,
    })),
  });
});

router.get("/songs", async (req, res) => {
  const queryParams = ListSongsQueryParams.safeParse({
    categoryId: req.query.categoryId ? Number(req.query.categoryId) : undefined,
    search: req.query.search,
  });

  const conditions = [];
  if (queryParams.success && queryParams.data.categoryId) {
    conditions.push(eq(songsTable.categoryId, queryParams.data.categoryId));
  }
  if (queryParams.success && queryParams.data.search) {
    conditions.push(ilike(songsTable.title, `%${queryParams.data.search}%`));
  }

  const rows = await db
    .select({ song: songsTable, category: categoriesTable })
    .from(songsTable)
    .leftJoin(categoriesTable, eq(songsTable.categoryId, categoriesTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(songsTable.updatedAt));

  res.json(rows.map((r) => formatSong(r.song as unknown as Record<string, unknown>, r.category as Record<string, unknown> | null)));
});

router.post("/songs", async (req, res) => {
  const parsed = CreateSongBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const [song] = await db.insert(songsTable).values(parsed.data).returning();
  let category = null;
  if (song.categoryId) {
    [category] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, song.categoryId));
  }
  res.status(201).json(formatSong(song as unknown as Record<string, unknown>, category));
});

router.get("/songs/:id", async (req, res) => {
  const params = GetSongParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [row] = await db
    .select({ song: songsTable, category: categoriesTable })
    .from(songsTable)
    .leftJoin(categoriesTable, eq(songsTable.categoryId, categoriesTable.id))
    .where(eq(songsTable.id, params.data.id));
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(formatSong(row.song as unknown as Record<string, unknown>, row.category as Record<string, unknown> | null));
});

router.patch("/songs/:id", async (req, res) => {
  const params = UpdateSongParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = UpdateSongBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const [song] = await db
    .update(songsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(songsTable.id, params.data.id))
    .returning();
  if (!song) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  let category = null;
  if (song.categoryId) {
    [category] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, song.categoryId));
  }
  res.json(formatSong(song as unknown as Record<string, unknown>, category));
});

router.delete("/songs/:id", async (req, res) => {
  const params = DeleteSongParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(songsTable).where(eq(songsTable.id, params.data.id));
  res.status(204).send();
});

export default router;
