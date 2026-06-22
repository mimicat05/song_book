import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { categoriesTable } from "./categories";

export const songsTable = pgTable("songs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  artist: text("artist"),
  language: text("language"),
  lyrics: text("lyrics"),
  chords: text("chords"),
  key: text("key"),
  notes: text("notes"),
  categoryId: integer("category_id").references(() => categoriesTable.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSongSchema = createInsertSchema(songsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSong = z.infer<typeof insertSongSchema>;
export type Song = typeof songsTable.$inferSelect;

export const songVersionsTable = pgTable("song_versions", {
  id: serial("id").primaryKey(),
  songId: integer("song_id").notNull().references(() => songsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  title: text("title"),
  lyrics: text("lyrics"),
  chords: text("chords"),
  key: text("key"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSongVersionSchema = createInsertSchema(songVersionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSongVersion = z.infer<typeof insertSongVersionSchema>;
export type SongVersion = typeof songVersionsTable.$inferSelect;
