"use server";

import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "@/lib/constants";
import { getServerEnv } from "@/lib/server/env";
import { getDb } from "@/lib/server/d1";

type CookieStore = Awaited<ReturnType<typeof cookies>>;

type OwnerAccountRecord = {
  id: string;
  name: string;
  phone: string;
  passwordHash: string;
  passwordSalt: string;
  createdAt: string;
  updatedAt: string;
};

type OwnerSessionRecord = {
  id: string;
  ownerId: string;
  token: string;
  expiresAt: number;
  createdAt: string;
};

export type OwnerProfile = {
  name: string;
  phone: string;
};

const DEFAULT_OWNER = {
  name: "Dona Exemplo",
  phone: "login-demo-123",
  password: "SenhaAleatoria42!",
  sessionSecret: "segredo-demo-2025",
};

function normalizePhone(phone: string) {
  return phone.trim();
}

// Adapted from https://github.com/G4brym/authentication-using-d1-example/blob/main/src/foundation/auth.ts
async function hashWithSalt(value: string, salt: string) {
  const utf8 = new TextEncoder().encode(`${salt}:${value}`);
  const hashBuffer = await crypto.subtle.digest({ name: "SHA-256" }, utf8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function buildDefaultOwnerConfig() {
  const env = getServerEnv();
  return {
    name: env.OWNER_NAME ?? DEFAULT_OWNER.name,
    phone: normalizePhone(env.OWNER_PHONE ?? DEFAULT_OWNER.phone),
    password: env.OWNER_PASSWORD ?? DEFAULT_OWNER.password,
    passwordSalt: env.OWNER_SESSION_SECRET ?? DEFAULT_OWNER.sessionSecret,
  };
}

async function ensureOwnerAccount(): Promise<OwnerAccountRecord> {
  const db = getDb();
  const fallback = buildDefaultOwnerConfig();
  try {
    const existing = await db
      .prepare(
        `SELECT id, name, phone, passwordHash, passwordSalt, createdAt, updatedAt FROM OwnerAccount LIMIT 1`,
      )
      .all<OwnerAccountRecord>()
      .then((res) => res.results ?? []);
    if (existing.length) {
      const owner = existing[0];
      const desiredHash = await hashWithSalt(fallback.password, fallback.passwordSalt);
      const needsPhoneUpdate = normalizePhone(owner.phone) !== fallback.phone;
      const needsAuthUpdate =
        owner.passwordHash !== desiredHash || owner.passwordSalt !== fallback.passwordSalt;

      if (needsPhoneUpdate || needsAuthUpdate) {
        await db
          .prepare(
            `UPDATE OwnerAccount
             SET phone = ?1, passwordHash = ?2, passwordSalt = ?3, updatedAt = CURRENT_TIMESTAMP
             WHERE id = ?4`,
          )
          .bind(fallback.phone, desiredHash, fallback.passwordSalt, owner.id)
          .run();

        return {
          ...owner,
          phone: fallback.phone,
          passwordHash: desiredHash,
          passwordSalt: fallback.passwordSalt,
          updatedAt: new Date().toISOString(),
        };
      }

      return owner;
    }

    const passwordHash = await hashWithSalt(fallback.password, fallback.passwordSalt);
    const id = crypto.randomUUID();
    await db
      .prepare(
        `INSERT INTO OwnerAccount (id, name, phone, passwordHash, passwordSalt, createdAt, updatedAt)
         VALUES (?1, ?2, ?3, ?4, ?5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      )
      .bind(id, fallback.name, fallback.phone, passwordHash, fallback.passwordSalt)
      .run();

    return {
      id,
      name: fallback.name,
      phone: fallback.phone,
      passwordHash,
      passwordSalt: fallback.passwordSalt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    throw new Error(
      'Falha ao acessar tabela OwnerAccount. Execute as migracoes D1 (prisma/d1) e confirme o binding "DB".',
      { cause: error as Error },
    );
  }
}

async function createOwnerSession(ownerId: string) {
  const db = getDb();
  const token = crypto.randomUUID();
  const expiresAt = Date.now() + 1000 * 60 * 60 * 8; // 8h
  await db
    .prepare(
      `INSERT INTO OwnerSession (id, ownerId, token, expiresAt, createdAt) VALUES (?1, ?2, ?3, ?4, CURRENT_TIMESTAMP)`,
    )
    .bind(crypto.randomUUID(), ownerId, token, expiresAt)
    .run();

  return { token, expiresAt };
}

async function findSessionByToken(token: string) {
  const db = getDb();
  const now = Date.now();
  const { results } = await db
    .prepare(
      `SELECT s.id, s.ownerId, s.token, s.expiresAt, s.createdAt, o.name as ownerName, o.phone as ownerPhone
       FROM OwnerSession s
       INNER JOIN OwnerAccount o ON o.id = s.ownerId
       WHERE s.token = ?1 AND s.expiresAt > ?2`,
    )
    .bind(token, now)
    .all<OwnerSessionRecord & { ownerName: string; ownerPhone: string }>();

  if (!results?.length) return null;
  const session = results[0];
  return {
    session: {
      id: session.id,
      ownerId: session.ownerId,
      token: session.token,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
    },
    owner: { name: session.ownerName, phone: session.ownerPhone } as OwnerProfile,
  };
}

export async function deleteOwnerSession(token: string) {
  const db = getDb();
  await db.prepare(`DELETE FROM OwnerSession WHERE token = ?1`).bind(token).run();
}

export async function deleteOwnerSessionFromStore(store: CookieStore) {
  const token = store.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return;
  await deleteOwnerSession(token);
}

export async function loginOwnerWithPassword(phone: string, password: string) {
  const owner = await ensureOwnerAccount();
  if (normalizePhone(phone) !== normalizePhone(owner.phone)) {
    return { success: false as const, message: "Login ou senha invalidos." };
  }
  const incomingHash = await hashWithSalt(password, owner.passwordSalt);
  if (incomingHash !== owner.passwordHash) {
    return { success: false as const, message: "Login ou senha invalidos." };
  }

  const session = await createOwnerSession(owner.id);
  return {
    success: true as const,
    owner: { name: owner.name, phone: owner.phone } satisfies OwnerProfile,
    session,
  };
}

export async function getOwnerIdentity(): Promise<OwnerProfile> {
  const owner = await ensureOwnerAccount();
  return { name: owner.name, phone: owner.phone };
}

export async function ownerAuthenticatedFromStore(store: CookieStore) {
  const token = store.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return false;
  const session = await findSessionByToken(token);
  return Boolean(session);
}

export async function getOwnerSessionFromStore(
  store: CookieStore,
): Promise<{ session: OwnerSessionRecord; owner: OwnerProfile } | null> {
  const token = store.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return findSessionByToken(token);
}

export async function isOwnerAuthenticated() {
  return ownerAuthenticatedFromStore(await cookies());
}
