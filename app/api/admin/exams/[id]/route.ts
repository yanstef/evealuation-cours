import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { ensureSchema, sql } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH : active cette évaluation (une seule active à la fois) ou la désactive. */
export async function PATCH(req: Request, ctx: Ctx) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const id = Number((await ctx.params).id);
  const body = await req.json().catch(() => ({}));
  await ensureSchema();
  const q = sql();
  if (body.active) {
    await q`UPDATE exams SET active = (id = ${id})`;
  } else {
    await q`UPDATE exams SET active = false WHERE id = ${id}`;
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const id = Number((await ctx.params).id);
  await ensureSchema();
  await sql()`DELETE FROM exams WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
