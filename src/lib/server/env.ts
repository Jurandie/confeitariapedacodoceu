import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";

type EnvValues = Record<string, string | undefined>;

function readCloudflareEnv(): EnvValues | undefined {
  try {
    const context = getCloudflareContext();
    return (context?.env as EnvValues) ?? undefined;
  } catch {
    return undefined;
  }
}

export function getServerEnv(): EnvValues {
  // Merge Cloudflare bindings with process.env so local .env overrides still apply in dev.
  const cloudflareEnv = readCloudflareEnv() ?? {};
  const nodeEnv =
    typeof globalThis === "object" && "process" in globalThis
      ? ((globalThis as { process?: { env?: EnvValues } }).process?.env ?? {})
      : {};

  return { ...nodeEnv, ...cloudflareEnv };
}

export function getEnvValue(key: string) {
  return getServerEnv()[key];
}
