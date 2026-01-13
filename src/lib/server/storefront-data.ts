import { execute, queryAll, queryOne } from "./d1";

export type ProductRecord = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  image?: string | null;
  stock: number;
  category?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SiteConfigRecord = {
  id: string;
  heroTitle: string;
  heroDescription: string;
  heroBadge: string;
  heroPanelTopTitle: string;
  heroPanelTopDescription: string;
  heroPanelBottomTitle: string;
  heroPanelBottomDescription: string;
  heroPanelFooter: string;
  createdAt: string;
  updatedAt: string;
};

export async function listProducts() {
  return queryAll<ProductRecord>(`SELECT * FROM Product ORDER BY name ASC`);
}

export async function getProductBySlug(slug: string) {
  return queryOne<ProductRecord>(`SELECT * FROM Product WHERE slug = ?`, [slug]);
}

export async function getProductById(id: string) {
  return queryOne<ProductRecord>(`SELECT * FROM Product WHERE id = ?`, [id]);
}

export async function getProductByIdentifier(identifier: string) {
  const product = await getProductById(identifier);
  if (product) return product;
  return getProductBySlug(identifier);
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export async function ensureUniqueSlug(base: string) {
  const safeBase = base || "doce-da-dona";
  let slug = safeBase;
  let suffix = 1;
  while (true) {
    const existing = await getProductBySlug(slug);
    if (!existing) return slug;
    slug = `${safeBase}-${suffix++}`;
  }
}

export async function createProductRecord(data: {
  name: string;
  description: string;
  price: number;
  stock: number;
  category?: string | null;
  image?: string | null;
  slug: string;
}) {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  await execute(
    `INSERT INTO Product (
      id, name, slug, description, price, image, stock, category, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.name,
      data.slug,
      data.description,
      data.price,
      data.image ?? null,
      data.stock,
      data.category ?? null,
      now,
      now,
    ],
  );

  return getProductById(id);
}

export async function updateProductPrice(id: string, price: number) {
  await execute(`UPDATE Product SET price = ?, updatedAt = ? WHERE id = ?`, [
    price,
    new Date().toISOString(),
    id,
  ]);
  return getProductById(id);
}

export async function deleteProductRecord(id: string) {
  const product = await getProductById(id);
  if (!product) return null;
  await execute(`DELETE FROM Product WHERE id = ?`, [id]);
  return product;
}

export async function getSiteConfig() {
  return queryOne<SiteConfigRecord>(`SELECT * FROM SiteConfig WHERE id = 'hero'`);
}

export async function saveSiteConfig(data: Omit<SiteConfigRecord, "id" | "createdAt" | "updatedAt">) {
  const now = new Date().toISOString();
  await execute(
    `INSERT INTO SiteConfig (
      id, heroTitle, heroDescription, heroBadge, heroPanelTopTitle, heroPanelTopDescription,
      heroPanelBottomTitle, heroPanelBottomDescription, heroPanelFooter, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      heroTitle=excluded.heroTitle,
      heroDescription=excluded.heroDescription,
      heroBadge=excluded.heroBadge,
      heroPanelTopTitle=excluded.heroPanelTopTitle,
      heroPanelTopDescription=excluded.heroPanelTopDescription,
      heroPanelBottomTitle=excluded.heroPanelBottomTitle,
      heroPanelBottomDescription=excluded.heroPanelBottomDescription,
      heroPanelFooter=excluded.heroPanelFooter,
      updatedAt=excluded.updatedAt`,
    [
      "hero",
      data.heroTitle,
      data.heroDescription,
      data.heroBadge,
      data.heroPanelTopTitle,
      data.heroPanelTopDescription,
      data.heroPanelBottomTitle,
      data.heroPanelBottomDescription,
      data.heroPanelFooter,
      now,
      now,
    ],
  );
  return getSiteConfig();
}
