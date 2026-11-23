import { NextResponse } from "next/server";
import { normalizeName, setStudentSession } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const nom = String(body.nom ?? "").trim().slice(0, 80);
  const prenom = String(body.prenom ?? "").trim().slice(0, 80);
  const key = `${normalizeName(nom)}|${normalizeName(prenom)}`;
  if (!normalizeName(nom) || !normalizeName(prenom)) {
    return NextResponse.json({ error: "Nom et prénom obligatoires." }, { status: 400 });
  }
  await setStudentSession({ nom, prenom, key });
  return NextResponse.json({ ok: true });
}
