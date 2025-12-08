import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ownerAuthenticatedFromStore } from "@/lib/server/auth";

export async function GET() {
  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ products });
}

type CreateProductPayload = {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  category?: string;
  image?: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

async function ensureUniqueSlug(base: string) {
  const safeBase = base || "doce-da-dona";
  let slug = safeBase;
  let suffix = 1;
  while (true) {
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (!existing) return slug;
    slug = `${safeBase}-${suffix++}`;
  }
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  if (!(await ownerAuthenticatedFromStore(cookieStore))) {
    return NextResponse.json({ message: "Nao autorizado." }, { status: 401 });
  }

  const payload = (await request.json().catch(() => ({}))) as CreateProductPayload;
  const { name, description, price, stock, category, image } = payload;

  if (!name || !description || typeof price !== "number") {
    return NextResponse.json(
      { message: "Nome, descricao e preco (em centavos) sao obrigatorios." },
      { status: 400 },
    );
  }

  if (price <= 0) {
    return NextResponse.json({ message: "Preco precisa ser maior que zero." }, { status: 422 });
  }

  const normalizedSlug = slugify(name);
  const slug = await ensureUniqueSlug(normalizedSlug);

  const product = await prisma.product.create({
    data: {
      name,
      description,
      price: Math.floor(price),
      stock: typeof stock === "number" && stock >= 0 ? Math.floor(stock) : 20,
      category: category?.trim() || "doces",
      image: image?.trim() || null,
      slug,
    },
  });

  return NextResponse.json({ product });
}
