import { betterAuth } from 'better-auth';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { getRequestEvent } from '$app/server';
import { getDrizzle } from '$lib/server/db';

export const createAuth = (d1: D1Database) =>
  betterAuth({
    database: drizzleAdapter(getDrizzle(d1), { provider: 'sqlite' }),
    emailAndPassword: { enabled: true },
    plugins: [sveltekitCookies(getRequestEvent)],
  });

export const auth = createAuth(null!);
