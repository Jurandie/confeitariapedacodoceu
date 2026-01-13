import { defineCloudflareConfig } from "@opennextjs/cloudflare/config";

// Base configuration for the OpenNext Cloudflare adapter.
// We are not enabling any optional caches yet; bindings such as D1 are
// configured through wrangler.toml.
export default defineCloudflareConfig();
