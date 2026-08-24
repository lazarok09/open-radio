import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

/** Optional durable connection. Database-backed persistence activates when configured. */
const globalState = globalThis as typeof globalThis & { __openRadioSql?: ReturnType<typeof postgres> | null };
export const sql = globalState.__openRadioSql ?? (globalState.__openRadioSql = process.env.DATABASE_URL ? postgres(process.env.DATABASE_URL, { max: 4, prepare: false }) : null);
export const db = sql ? drizzle(sql) : null;
