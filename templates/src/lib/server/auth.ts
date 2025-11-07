import { betterAuth } from "better-auth";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getRequestEvent } from "$app/server";
import type { getDrizzle } from "$lib/server/db";

export default (drizzle: ReturnType<typeof getDrizzle>) =>
  betterAuth({
    database: drizzleAdapter(drizzle, {
      provider: "sqlite",
    }),
    emailAndPassword: {
      enabled: true,
    },
    plugins: [sveltekitCookies(getRequestEvent)],
  });
