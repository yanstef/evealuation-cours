import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { ensureSchema, sql } from "@/lib/db";
import { parseQuestions } from "@/lib/parse";

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  const title = String(form.get("title") ?? "").trim().slice(0, 200);
  if (!(file instanceof File)) return NextResponse.json({ error: "Fichier manquant." }, { status: 400 });
  if (!title) return NextResponse.json({ error: "Titre obligatoire." }, { status: 400 });
  if (file.size > 2_000_000) return NextResponse.json({ error: "Fichier trop volumineux (2 Mo max)." }, { status: 400 });

  let questions;
  try {
    questions = await parseQuestions(Buffer.from(await file.arrayBuffer()), file.name);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Fichier illisible." }, { status: 400 });
  }

  await ensureSchema();
  const q = sql();
  const exam = await q`INSERT INTO exams (title, active) VALUES (${title}, false) RETURNING id`;
  const examId = exam[0].id as number;
  for (const qu of questions) {
    await q`INSERT INTO questions (exam_id, position, type, text, options, correct, expected, points)
      VALUES (${examId}, ${qu.position}, ${qu.type}, ${qu.text}, ${qu.options ? JSON.stringify(qu.options) : null}::jsonb, ${qu.correct}, ${qu.expected}, ${qu.points})`;
  }
  return NextResponse.json({ ok: true, examId, count: questions.length });
}
