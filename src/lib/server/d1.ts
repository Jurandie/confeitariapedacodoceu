import type { D1Database } from "@cloudflare/workers-types";
import { getCloudflareContext } from "@opennextjs/cloudflare";

type EnvWithDb = {
  DB: D1Database;
};

function getContext() {
  try {
    return getCloudflareContext();
  } catch {
    return undefined;
  }
}

function resolveDb() {
  const context = getContext();
  const db = (context?.env as EnvWithDb | undefined)?.DB;
  if (!db) {
    throw new Error('D1 binding "DB" nao configurado para este ambiente.');
  }
  return db;
}

function prepare(sql: string, params: unknown[]) {
  const db = resolveDb();
  const statement = db.prepare(sql);
  return params.length ? statement.bind(...params) : statement;
}

export async function queryAll<T>(sql: string, params: unknown[] = []) {
  const { results } = await prepare(sql, params).all<T>();
  return (results ?? []) as T[];
}

export async function queryOne<T>(sql: string, params: unknown[] = []) {
  const { results } = await prepare(sql, params).all<T>();
  if (!results?.length) return null;
  return results[0] as T;
}

export async function execute(sql: string, params: unknown[] = []) {
  return prepare(sql, params).run();
}

export async function withTransaction<T>(callback: (db: D1Database) => Promise<T>) {
  const db = resolveDb();
  await db.exec("BEGIN");
  try {
    const result = await callback(db);
    await db.exec("COMMIT");
    return result;
  } catch (error) {
    await db.exec("ROLLBACK");
    throw error;
  }
}

export function getDb() {
  return resolveDb();
}
