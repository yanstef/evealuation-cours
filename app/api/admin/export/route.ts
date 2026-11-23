import { isAdmin } from "@/lib/auth";
import { ensureSchema, sql } from "@/lib/db";

const esc = (v: unknown) => {
  let s = String(v ?? "");
  if (/^[=+\-@]/.test(s)) s = "'" + s; // neutralise l'injection de formules Excel
  return `"${s.replace(/"/g, '""')}"`;
};

export async function GET(req: Request) {
  if (!(await isAdmin())) return new Response("Non autorisé", { status: 401 });
  const examId = Number(new URL(req.url).searchParams.get("examId"));
  await ensureSchema();
  const rows = await sql()`SELECT nom, prenom, score, max_score, needs_review, created_at
    FROM submissions WHERE exam_id = ${examId} ORDER BY nom, prenom`;
  const lines = [["Nom", "Prénom", "Score", "Sur", "Note /20", "À corriger manuellement", "Date"].map(esc).join(";")];
  for (const r of rows) {
    const note = Number(r.max_score) ? ((Number(r.score) / Number(r.max_score)) * 20).toFixed(2) : "";
    lines.push([r.nom, r.prenom, r.score, r.max_score, note, r.needs_review ? "oui" : "non", new Date(r.created_at as string).toISOString()].map(esc).join(";"));
  }
  return new Response("﻿" + lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="resultats-${examId}.csv"`,
    },
  });
}
