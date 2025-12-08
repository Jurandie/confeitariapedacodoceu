"use server";
import { createHash } from "node:crypto";
import process from "node:process";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "@/lib/constants";

type CookieStore = Awaited<ReturnType<typeof cookies>>;

type OwnerConfig = {
  email: string;
  name: string;
  sessionSecret: string;
};

const DEFAULT_OWNER: OwnerConfig = {
  email: "pinheiroaqui@gmail.com",
  name: "Dona Caramelo",
  sessionSecret: "doce-segredo",
};

function getOwnerConfig(): OwnerConfig {
  return {
    email: process.env.OWNER_EMAIL ?? DEFAULT_OWNER.email,
    name: process.env.OWNER_NAME ?? DEFAULT_OWNER.name,
    sessionSecret: process.env.OWNER_SESSION_SECRET ?? DEFAULT_OWNER.sessionSecret,
  };
}

export async function getOwnerCredentials() {
  return getOwnerConfig();
}

function buildToken(email: string, secret: string) {
  return createHash("sha256").update(`${email}:${secret}`).digest("hex");
}

export async function getOwnerIdentity() {
  const { email, name } = getOwnerConfig();
  return { email, name };
}

export async function getOwnerToken() {
  const { email, sessionSecret } = getOwnerConfig();
  return buildToken(email, sessionSecret);
}

export async function isOwnerAuthenticated() {
  return ownerAuthenticatedFromStore(await cookies());
}

export async function ownerAuthenticatedFromStore(store: CookieStore) {
  const token = await getOwnerToken();
  return store.get(AUTH_COOKIE_NAME)?.value === token;
}
