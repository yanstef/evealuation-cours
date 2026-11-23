import { NextResponse } from "next/server";
import { getStudent } from "@/lib/auth";
import { ensureSchema, sql } from "@/lib/db";
import { gradeOpenAnswers, type OpenItem } from "@/lib/grade";

export const maxDuration = 60;

type Q = {
  id: number; position: number; type: "qcm" | "open"; text: string;
  options: string[] | null; correct: string | null; expected: string | null; points: string | number;
};

export async function POST(req: Request) {
  const student = await getStudent();
  if (!student) return NextResponse.json({ error: "Session expirée, reconnectez-vous." }, { status: 401 });

  await ensureSchema();
  const q = sql();

  const exams = await q`SELECT id FROM exams WHERE active = true ORDER BY id DESC LIMIT 1`;
  if (!exams.length) return NextResponse.json({ error: "Aucune évaluation active." }, { status: 404 });
  const examId = exams[0].id as number;

  const existing = await q`SELECT id FROM submissions WHERE exam_id = ${examId} AND student_key = ${student.key}`;
  if (existing.length) return NextResponse.json({ error: "Vous avez déjà soumis cette évaluation." }, { status: 409 });

  const body = await req.json().catch(() => ({}));
  const answers: Record<string, string | string[]> = body.answers && typeof body.answers === "object" ? body.answers : {};

  const questions = (await q`SELECT id, position, type, text, options, correct, expected, points
    FROM questions WHERE exam_id = ${examId} ORDER BY position`) as unknown as Q[];

  const details: Record<string, unknown>[] = [];
  const openItems: OpenItem[] = [];
  let needsReview = false;

  for (const qu of questions) {
    const pts = Number(qu.points);
    const raw = answers[String(qu.id)];
    if (qu.type === "qcm") {
      const picked = (Array.isArray(raw) ? raw : raw ? [raw] : [])
        .map((x) => String(x).toLowerCase())
        .filter((x) => /^[a-f]$/.test(x))
        .filter((x, i, a) => a.indexOf(x) === i)
        .sort();
      const ok = picked.join(",") === qu.correct;
      details.push({
        id: qu.id, position: qu.position, type: "qcm", text: qu.text, options: qu.options,
        answer: picked.join(","), score: ok ? pts : 0, points: pts,
        feedback: ok ? "Bonne réponse." : "Réponse incorrecte.",
      });
    } else {
      const answer = (typeof raw === "string" ? raw : "").trim().slice(0, 4000);
      const d = {
        id: qu.id, position: qu.position, type: "open", text: qu.text,
        answer, score: 0, points: pts, feedback: "Aucune réponse.",
      };
      details.push(d);
      if (answer) openItems.push({ id: qu.id, question: qu.text, expected: qu.expected ?? "", answer, points: pts });
    }
  }

  if (openItems.length) {
    try {
      const grades = await gradeOpenAnswers(openItems);
      for (const g of grades) {
        const d = details.find((x) => x.id === g.id)!;
        d.score = g.score;
        d.feedback = g.feedback;
      }
    } catch (e) {
      console.error("Correction LLM échouée", e);
      needsReview = true;
      for (const it of openItems) {
        const d = details.find((x) => x.id === it.id)!;
        d.feedback = "Correction automatique indisponible : cette réponse sera corrigée manuellement.";
      }
    }
  }

  const score = details.reduce((s, d) => s + Number(d.score), 0);
  const maxScore = details.reduce((s, d) => s + Number(d.points), 0);

  const inserted = await q`INSERT INTO submissions (exam_id, nom, prenom, student_key, answers, details, score, max_score, needs_review)
    VALUES (${examId}, ${student.nom}, ${student.prenom}, ${student.key}, ${JSON.stringify(answers)}::jsonb, ${JSON.stringify(details)}::jsonb, ${score}, ${maxScore}, ${needsReview})
    ON CONFLICT (exam_id, student_key) DO NOTHING RETURNING id`;
  if (!inserted.length) return NextResponse.json({ error: "Vous avez déjà soumis cette évaluation." }, { status: 409 });

  return NextResponse.json({ ok: true });
}
