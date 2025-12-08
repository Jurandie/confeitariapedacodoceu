import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ownerAuthenticatedFromStore } from "@/lib/server/auth";

type UpdateProductPayload = {
  price?: number;
};

type RouteParams = {
  productId?: string;
};

function extractIdentifier(request: Request, params?: RouteParams) {
  if (params?.productId) return params.productId;
  const segments = new URL(request.url).pathname.split("/");
  return segments.pop() || segments.pop() || "";
}

async function findProductOr404(identifier: string) {
  if (!identifier) return null;
  return prisma.product.findFirst({
    where: {
      OR: [{ id: identifier }, { slug: identifier }],
    },
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<RouteParams> },
) {
  const cookieStore = await cookies();
  if (!(await ownerAuthenticatedFromStore(cookieStore))) {
    return NextResponse.json({ message: "Nao autorizado." }, { status: 401 });
  }

  const payload = (await request.json().catch(() => ({}))) as UpdateProductPayload;
  const cents = typeof payload.price === "number" ? Math.floor(payload.price) : undefined;

  if (!cents || cents <= 0) {
    return NextResponse.json(
      { message: "Informe um preco valido em centavos para atualizar." },
      { status: 400 },
    );
  }

  try {
    const params = context?.params ? await context.params : undefined;
    const identifier = extractIdentifier(request, params);
    const product = await findProductOr404(identifier);
    if (!product) {
      return NextResponse.json(
        { message: "Produto nao encontrado ou nao foi possivel atualizar." },
        { status: 404 },
      );
    }

    const updated = await prisma.product.update({
      where: { id: product.id },
      data: { price: cents },
    });
    revalidatePath("/");
    revalidatePath(`/product/${updated.slug}`);
    return NextResponse.json({ product: updated });
  } catch (error) {
    console.error("[api/products] PATCH error", error);
    return NextResponse.json(
      { message: "Produto nao encontrado ou nao foi possivel atualizar.", error: String(error) },
      { status: 404 },
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<RouteParams> },
) {
  const cookieStore = await cookies();
  if (!(await ownerAuthenticatedFromStore(cookieStore))) {
    return NextResponse.json({ message: "Nao autorizado." }, { status: 401 });
  }

  try {
    const params = context?.params ? await context.params : undefined;
    const identifier = extractIdentifier(request, params);
    const product = await findProductOr404(identifier);
    if (!product) {
      return NextResponse.json(
        { message: "Produto nao encontrado ou nao foi possivel remover." },
        { status: 404 },
      );
    }

    const deleted = await prisma.product.delete({
      where: { id: product.id },
    });
    revalidatePath("/");
    revalidatePath(`/product/${deleted.slug}`);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/products] DELETE error", error);
    return NextResponse.json(
      { message: "Produto nao encontrado ou nao foi possivel remover.", error: String(error) },
      { status: 404 },
    );
  }
}
