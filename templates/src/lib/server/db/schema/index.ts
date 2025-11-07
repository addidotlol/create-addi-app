import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const data = sqliteTable("data", {
  id: text("id"),
});
