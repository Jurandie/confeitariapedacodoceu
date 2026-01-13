import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  createProductRecord,
  ensureUniqueSlug,
  listProducts,
  slugify,
} from "@/lib/server/storefront-data";
import { ownerAuthenticatedFromStore } from "@/lib/server/auth";

export async function GET() {
  const products = await listProducts();

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

export async function POST(request: Request) {
  try {
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

    const inlineImage = typeof image === "string" ? image.trim() : null;
    const INLINE_IMAGE_LIMIT = 1_000_000; // ~1MB em base64 (~700KB bin) para evitar toobig no D1
    if (inlineImage && inlineImage.length > INLINE_IMAGE_LIMIT) {
      return NextResponse.json(
        { message: "Imagem muito grande. Comprima ou envie um arquivo menor que 500KB." },
        { status: 413 },
      );
    }

    const normalizedSlug = slugify(name);
    const slug = await ensureUniqueSlug(normalizedSlug);

    const product = await createProductRecord({
      name,
      description,
      price: Math.floor(price),
      stock: typeof stock === "number" && stock >= 0 ? Math.floor(stock) : 20,
      category: category?.trim() || "doces",
      image: inlineImage ?? null,
      slug,
    });

    if (!product) {
      return NextResponse.json({ message: "Nao foi possivel criar o doce." }, { status: 500 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error("[api/products] erro ao criar doce", error);
    const message =
      error instanceof Error ? error.message : "Nao foi possivel criar o doce agora.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
