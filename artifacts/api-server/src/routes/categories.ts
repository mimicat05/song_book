import { Router } from "express";
import { db, categoriesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateCategoryBody, UpdateCategoryBody, UpdateCategoryParams, DeleteCategoryParams } from "@workspace/api-zod";

const router = Router();

router.get("/categories", async (req, res) => {
  const categories = await db
    .select()
    .from(categoriesTable)
    .orderBy(categoriesTable.name);
  res.json(categories.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() })));
});

router.post("/categories", async (req, res) => {
  const parsed = CreateCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const [category] = await db.insert(categoriesTable).values(parsed.data).returning();
  res.status(201).json({ ...category, createdAt: category.createdAt.toISOString() });
});

router.patch("/categories/:id", async (req, res) => {
  const params = UpdateCategoryParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = UpdateCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const [category] = await db
    .update(categoriesTable)
    .set(parsed.data)
    .where(eq(categoriesTable.id, params.data.id))
    .returning();
  if (!category) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ ...category, createdAt: category.createdAt.toISOString() });
});

router.delete("/categories/:id", async (req, res) => {
  const params = DeleteCategoryParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(categoriesTable).where(eq(categoriesTable.id, params.data.id));
  res.status(204).send();
});

export default router;
