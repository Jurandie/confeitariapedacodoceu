import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ownerAuthenticatedFromStore } from "@/lib/server/auth";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { promises as fs } from "node:fs";

const DEFAULT_MAX_UPLOAD = 5 * 1024 * 1024; // 5MB

export async function POST(request: Request) {
  const cookieStore = cookies();
  if (!(await ownerAuthenticatedFromStore(cookieStore))) {
    return NextResponse.json({ message: "Nao autorizado." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ message: "Envie um arquivo de imagem valido." }, { status: 400 });
  }

  const maxUpload =
    Number(process.env.UPLOAD_LIMIT_BYTES ?? DEFAULT_MAX_UPLOAD) || DEFAULT_MAX_UPLOAD;

  if (file.size > maxUpload) {
    return NextResponse.json(
      { message: `Imagem maior do que o limite de ${(maxUpload / 1024 / 1024).toFixed(1)}MB.` },
      { status: 413 },
    );
  }

  const ext = path.extname(file.name || "").toLowerCase();
  const allowedExts = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif"];
  const finalExt = allowedExts.includes(ext) ? ext : ".png";
  const filename = `${randomUUID()}${finalExt}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  const buffer = Buffer.from(await file.arrayBuffer());

  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(path.join(uploadDir, filename), buffer);

  return NextResponse.json({
    ok: true,
    path: `/uploads/${filename}`,
  });
}
