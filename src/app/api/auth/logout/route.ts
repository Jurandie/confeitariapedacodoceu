import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "@/lib/constants";
import { deleteOwnerSessionFromStore } from "@/lib/server/auth";

export async function POST() {
  const cookieStore = await cookies();
  try {
    await deleteOwnerSessionFromStore(cookieStore);
  } catch (error) {
    console.error("[auth/logout] falha ao invalidar sessao", error);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    maxAge: 0,
    path: "/",
  });
  return response;
}
