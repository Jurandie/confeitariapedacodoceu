import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/constants";
import { loginOwnerWithPassword } from "@/lib/server/auth";

type LoginPayload = {
  phone?: string;
  login?: string;
  password?: string;
};

export async function POST(request: Request) {
  const data = (await request.json().catch(() => ({}))) as LoginPayload;
  const phoneValue = (data.login ?? data.phone)?.toString().trim() ?? "";
  const passwordValue = data.password?.toString().trim() ?? "";

  if (!phoneValue || !passwordValue) {
    return NextResponse.json(
      { ok: false, message: "Informe login e senha para acessar o painel." },
      { status: 400 },
    );
  }

  try {
    const result = await loginOwnerWithPassword(phoneValue, passwordValue);
    if (!result.success) {
      return NextResponse.json(
        { ok: false, message: result.message ?? "Login ou senha invalidos." },
        { status: 401 },
      );
    }

    const maxAge = Math.max(
      60,
      Math.floor((result.session.expiresAt - Date.now()) / 1000),
    );

    const response = NextResponse.json({ ok: true, owner: result.owner });
    const isSecure = new URL(request.url).protocol === "https:";
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: result.session.token,
      httpOnly: true,
      sameSite: "strict",
      secure: isSecure,
      path: "/",
      maxAge,
    });
    return response;
  } catch (error) {
    console.error("[auth/login] erro de autenticacao", error);
    return NextResponse.json(
      { ok: false, message: "Nao foi possivel autenticar agora." },
      { status: 500 },
    );
  }
}
