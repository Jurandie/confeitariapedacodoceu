import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/constants";
import { getOwnerCredentials, getOwnerIdentity, getOwnerToken } from "@/lib/server/auth";
import { verifyOwnerAccessCode } from "@/lib/server/access-codes";

type LoginPayload = {
  email?: string;
  code?: string;
};

export async function POST(request: Request) {
  const data = (await request.json().catch(() => ({}))) as LoginPayload;
  const { email, code } = data;
  const { email: ownerEmail } = await getOwnerCredentials();
  const { name } = await getOwnerIdentity();

  if (!email || !code) {
    return NextResponse.json(
      { ok: false, message: "Informe email e codigo recebido para acessar o painel." },
      { status: 400 },
    );
  }

  if (email !== ownerEmail) {
    return NextResponse.json(
      { ok: false, message: "Nao encontramos esse email para o painel." },
      { status: 401 },
    );
  }

  const verification = await verifyOwnerAccessCode(ownerEmail, code);
  if (!verification.valid) {
    return NextResponse.json(
      { ok: false, message: verification.reason ?? "Codigo invalido." },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ ok: true, owner: { email: ownerEmail, name } });
  const token = await getOwnerToken();
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return response;
}
