import { NextResponse } from "next/server";
import { checkAdminPassword, setAdminSession } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (!checkAdminPassword(String(body.password ?? ""))) {
    return NextResponse.json({ error: "Mot de passe incorrect." }, { status: 401 });
  }
  await setAdminSession();
  return NextResponse.json({ ok: true });
}
