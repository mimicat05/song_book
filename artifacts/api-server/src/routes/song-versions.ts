import { Router } from "express";
import { db, songVersionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  CreateSongVersionBody,
  UpdateSongVersionBody,
  CreateSongVersionParams,
  ListSongVersionsParams,
  UpdateSongVersionParams,
  DeleteSongVersionParams,
} from "@workspace/api-zod";

const router = Router();

function formatVersion(v: Record<string, unknown>) {
  return {
    ...v,
    createdAt: (v.createdAt as Date).toISOString(),
    updatedAt: (v.updatedAt as Date).toISOString(),
  };
}

router.get("/songs/:id/versions", async (req, res) => {
  const params = ListSongVersionsParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const versions = await db
    .select()
    .from(songVersionsTable)
    .where(eq(songVersionsTable.songId, params.data.id))
    .orderBy(songVersionsTable.createdAt);
  res.json(versions.map((v) => formatVersion(v as unknown as Record<string, unknown>)));
});

router.post("/songs/:id/versions", async (req, res) => {
  const params = CreateSongVersionParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = CreateSongVersionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const [version] = await db
    .insert(songVersionsTable)
    .values({ ...parsed.data, songId: params.data.id })
    .returning();
  res.status(201).json(formatVersion(version as unknown as Record<string, unknown>));
});

router.patch("/songs/:id/versions/:versionId", async (req, res) => {
  const params = UpdateSongVersionParams.safeParse({
    id: Number(req.params.id),
    versionId: Number(req.params.versionId),
  });
  if (!params.success) {
    res.status(400).json({ error: "Invalid params" });
    return;
  }
  const parsed = UpdateSongVersionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const [version] = await db
    .update(songVersionsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(
      and(
        eq(songVersionsTable.id, params.data.versionId),
        eq(songVersionsTable.songId, params.data.id)
      )
    )
    .returning();
  if (!version) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(formatVersion(version as unknown as Record<string, unknown>));
});

router.delete("/songs/:id/versions/:versionId", async (req, res) => {
  const params = DeleteSongVersionParams.safeParse({
    id: Number(req.params.id),
    versionId: Number(req.params.versionId),
  });
  if (!params.success) {
    res.status(400).json({ error: "Invalid params" });
    return;
  }
  const deleted = await db
    .delete(songVersionsTable)
    .where(
      and(
        eq(songVersionsTable.id, params.data.versionId),
        eq(songVersionsTable.songId, params.data.id)
      )
    )
    .returning();
  if (!deleted.length) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.status(204).send();
});

export default router;
