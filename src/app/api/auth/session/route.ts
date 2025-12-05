import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getOwnerIdentity, ownerAuthenticatedFromStore } from "@/lib/server/auth";

export async function GET() {
  const cookieStore = cookies();
  const authenticated = await ownerAuthenticatedFromStore(cookieStore);

  return NextResponse.json({
    authenticated,
    owner: authenticated ? await getOwnerIdentity() : null,
  });
}
