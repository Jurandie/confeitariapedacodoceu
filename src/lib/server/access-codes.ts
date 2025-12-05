import "server-only";
import { randomInt, createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";

const DEFAULT_TTL_MINUTES = 10;

type MemoryCode = {
  codeHash: string;
  expiresAt: Date;
  consumedAt?: Date;
};

const memoryCodes = new Map<string, MemoryCode>();

function hashCode(code: string, email: string) {
  return createHash("sha256").update(`${email}:${code}`).digest("hex");
}

function saveCodeInMemory(email: string, codeHash: string, expiresAt: Date) {
  memoryCodes.set(email, { codeHash, expiresAt });
}

function getMemoryCandidate(email: string) {
  const entry = memoryCodes.get(email);
  if (!entry) return null;
  const now = new Date();
  if (entry.expiresAt <= now || entry.consumedAt) {
    memoryCodes.delete(email);
    return null;
  }
  return entry;
}

function consumeMemoryCode(email: string) {
  const entry = memoryCodes.get(email);
  if (entry) {
    entry.consumedAt = new Date();
    memoryCodes.set(email, entry);
  }
}

export function generateAccessCode() {
  return String(randomInt(100000, 999999));
}

export function getAccessCodeTtl() {
  const envMinutes = Number(process.env.OWNER_CODE_TTL_MINUTES ?? DEFAULT_TTL_MINUTES);
  return Number.isFinite(envMinutes) && envMinutes > 0 ? envMinutes : DEFAULT_TTL_MINUTES;
}

export async function storeOwnerAccessCode(email: string, rawCode: string) {
  const expiresAt = new Date(Date.now() + getAccessCodeTtl() * 60 * 1000);
  const codeHash = hashCode(rawCode, email);

  try {
    await prisma.ownerAccessCode.create({
      data: { email, codeHash, expiresAt },
    });

    await prisma.ownerAccessCode.deleteMany({
      where: { expiresAt: { lt: new Date(Date.now() - 60 * 60 * 1000) } },
    });
  } catch (error) {
    console.warn("[access-codes] Falha ao gravar no banco, usando memoria", error);
    saveCodeInMemory(email, codeHash, expiresAt);
  }

  return expiresAt;
}

type Candidate =
  | { source: "db"; id: string; codeHash: string; expiresAt: Date }
  | { source: "memory"; codeHash: string; expiresAt: Date };

async function loadCandidate(email: string): Promise<Candidate | null> {
  const now = new Date();
  try {
    const record = await prisma.ownerAccessCode.findFirst({
      where: { email, expiresAt: { gt: now }, consumedAt: null },
      orderBy: { createdAt: "desc" },
    });
    if (record) {
      return { source: "db", id: record.id, codeHash: record.codeHash, expiresAt: record.expiresAt };
    }
  } catch (error) {
    console.warn("[access-codes] Falha ao buscar no banco, usando memoria", error);
  }

  const memoryCandidate = getMemoryCandidate(email);
  if (memoryCandidate) {
    return {
      source: "memory",
      codeHash: memoryCandidate.codeHash,
      expiresAt: memoryCandidate.expiresAt,
    };
  }

  return null;
}

export async function verifyOwnerAccessCode(email: string, code: string) {
  if (!code) return { valid: false, reason: "Informe o codigo recebido por email." };

  const candidate = await loadCandidate(email);
  if (!candidate) {
    return { valid: false, reason: "Solicite um novo codigo. Nao encontramos um codigo ativo." };
  }

  const matches = candidate.codeHash === hashCode(code, email);
  if (!matches) {
    return { valid: false, reason: "Codigo incorreto. Tente novamente." };
  }

  if (candidate.source === "db") {
    await prisma.ownerAccessCode.update({ where: { id: candidate.id }, data: { consumedAt: new Date() } });
  } else {
    consumeMemoryCode(email);
  }

  return { valid: true };
}
