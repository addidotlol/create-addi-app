import { drizzle } from "drizzle-orm/d1";
import * as schemas from "./schema";
import * as authSchemas from "./schema/auth";

export const getDrizzle = (binding: D1Database) => {
  const db = drizzle(binding, {
    casing: "snake_case",
    schema: {
      ...schemas,
      ...authSchemas,
    },
  });

  return db;
};
