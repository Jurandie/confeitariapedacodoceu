import { NextResponse } from "next/server";
import { getOwnerCredentials, getOwnerIdentity } from "@/lib/server/auth";
import { generateAccessCode, storeOwnerAccessCode, getAccessCodeTtl } from "@/lib/server/access-codes";
import { sendOwnerAccessCodeEmail } from "@/lib/server/mailer";

type RequestPayload = {
  email?: string;
};

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as RequestPayload;
  const email = payload.email?.trim().toLowerCase();
  const { email: ownerEmail } = await getOwnerCredentials();
  const { name } = await getOwnerIdentity();

  if (!email) {
    return NextResponse.json({ ok: false, message: "Informe o email cadastrado." }, { status: 400 });
  }

  if (email !== ownerEmail.toLowerCase()) {
    return NextResponse.json(
      { ok: false, message: "Esse email nao tem acesso ao painel." },
      { status: 401 },
    );
  }

  const code = generateAccessCode();
  const expiresAt = await storeOwnerAccessCode(ownerEmail, code);
  const mailResult = await sendOwnerAccessCodeEmail({
    to: ownerEmail,
    code,
    ownerName: name,
    expiresAt,
  });
  const ttl = getAccessCodeTtl();

  return NextResponse.json({
    ok: true,
    message:
      mailResult.delivered || process.env.NODE_ENV === "production"
        ? `Codigo enviado para ${ownerEmail}. Ele expira em ${ttl} minutos.`
        : `Codigo gerado para testes locais: ${mailResult.previewCode}. Ele expira em ${ttl} minutos.`,
    expiresAt,
  });
}
