import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ownerAuthenticatedFromStore } from "@/lib/server/auth";
import { getServerEnv } from "@/lib/server/env";
const DEFAULT_MAX_UPLOAD = 5 * 1024 * 1024; // 5MB

export async function POST(request: Request) {
  const cookieStore = await cookies();
  if (!(await ownerAuthenticatedFromStore(cookieStore))) {
    return NextResponse.json({ message: "Nao autorizado." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ message: "Envie um arquivo de imagem valido." }, { status: 400 });
  }

  const env = getServerEnv();
  const maxUpload =
    Number(env.UPLOAD_LIMIT_BYTES ?? DEFAULT_MAX_UPLOAD) || DEFAULT_MAX_UPLOAD;
  if (file.size > maxUpload) {
    return NextResponse.json(
      { message: `Imagem maior do que o limite de ${(maxUpload / 1024 / 1024).toFixed(1)}MB.` },
      { status: 413 },
    );
  }

  const mimeType = file.type || "image/png";
  const arrayBuffer = await file.arrayBuffer();
  const base64 = toBase64(arrayBuffer);
  const dataUri = `data:${mimeType};base64,${base64}`;

  return NextResponse.json({ ok: true, path: dataUri });
}

function toBase64(buffer: ArrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    const slice = bytes.subarray(i, i + chunk);
    binary += String.fromCharCode(...slice);
  }
  return btoa(binary);
}
