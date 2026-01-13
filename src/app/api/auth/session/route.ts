import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getOwnerSessionFromStore } from "@/lib/server/auth";

export async function GET() {
  const cookieStore = await cookies();
  const session = await getOwnerSessionFromStore(cookieStore);

  return NextResponse.json({
    authenticated: Boolean(session),
    owner: session?.owner ?? null,
  });
}
