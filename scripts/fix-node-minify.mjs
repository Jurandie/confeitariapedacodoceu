import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const packagesNeedingShim = ["core", "terser"];
const shimContent = 'export * from "./index.js";\nexport { default } from "./index.js";\n';

for (const pkg of packagesNeedingShim) {
  const target = resolve(`node_modules/@node-minify/${pkg}/dist/index.mjs`);
  const dir = dirname(target);

  try {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    if (!existsSync(target)) {
      writeFileSync(target, shimContent, "utf8");
      console.log(`[postinstall] Created @node-minify/${pkg} ESM shim.`);
    }
  } catch (error) {
    console.warn(`[postinstall] Failed to ensure @node-minify/${pkg} ESM shim:`, error);
  }
}
