import "server-only";
import { createHash } from "node:crypto";
import process from "node:process";
import { cookies } from "next/headers";

const AUTH_COOKIE_NAME = "doces-owner-auth";
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
  const store = await cookies();
  return ownerAuthenticatedFromStore(store);
}

export async function ownerAuthenticatedFromStore(store: CookieStore | Promise<CookieStore>) {
  const resolvedStore = await store;
  const token = await getOwnerToken();
  return resolvedStore.get(AUTH_COOKIE_NAME)?.value === token;
}

export { AUTH_COOKIE_NAME };
