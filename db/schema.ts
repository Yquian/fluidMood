import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";
import type { InferSelectModel } from "drizzle-orm";

export const moodEntries = sqliteTable("mood_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  text: text("text").notNull(),
  primaryColor: text("primary_color").notNull(),
  secondaryColor: text("secondary_color").notNull(),
  speed: real("speed").notNull(),
  turbulence: real("turbulence").notNull(),
  tags: text("tags").notNull(),
  echo: text("echo").notNull(),
});

export type MoodEntry = InferSelectModel<typeof moodEntries>;
