import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/server/auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    maxAge: 0,
    path: "/",
  });
  return response;
}
