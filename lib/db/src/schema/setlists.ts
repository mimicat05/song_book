import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { songsTable } from "./songs";

export const setlistsTable = pgTable("setlists", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  venue: text("venue"),
  date: text("date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const setlistSongsTable = pgTable("setlist_songs", {
  id: serial("id").primaryKey(),
  setlistId: integer("setlist_id").notNull().references(() => setlistsTable.id, { onDelete: "cascade" }),
  songId: integer("song_id").notNull().references(() => songsTable.id, { onDelete: "cascade" }),
  position: integer("position").notNull().default(0),
  notes: text("notes"),
});

export const insertSetlistSchema = createInsertSchema(setlistsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSetlistSongSchema = createInsertSchema(setlistSongsTable).omit({ id: true });
export type InsertSetlist = z.infer<typeof insertSetlistSchema>;
export type InsertSetlistSong = z.infer<typeof insertSetlistSongSchema>;
export type Setlist = typeof setlistsTable.$inferSelect;
export type SetlistSong = typeof setlistSongsTable.$inferSelect;
