import { redirect } from "next/navigation";
import { getStudent } from "@/lib/auth";
import { ensureSchema, sql } from "@/lib/db";
import ExamForm, { type PublicQuestion } from "@/components/ExamForm";
import LogoutButton from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

type Detail = {
  id: number; position: number; type: "qcm" | "open"; text: string; answer: string;
  score: number; points: number; feedback: string; options?: string[] | null;
};

const LETTERS = ["a", "b", "c", "d", "e", "f"];

export default async function ExamPage() {
  const student = await getStudent();
  if (!student) redirect("/");

  await ensureSchema();
  const q = sql();
  const exams = await q`SELECT id, title FROM exams WHERE active = true ORDER BY id DESC LIMIT 1`;

  const shell = (children: React.ReactNode) => (
    <>
      <header className="top">
        <h1>{exams[0]?.title ?? "Évaluation de cours"} · {student.prenom} {student.nom}</h1>
        <LogoutButton />
      </header>
      <main>{children}</main>
    </>
  );

  if (!exams.length) {
    return shell(<div className="card"><h2>Aucune évaluation disponible</h2><p>Revenez plus tard.</p></div>);
  }
  const examId = exams[0].id as number;

  const done = await q`SELECT details, score, max_score, needs_review FROM submissions
    WHERE exam_id = ${examId} AND student_key = ${student.key}`;

  if (done.length) {
    const s = done[0];
    const details = s.details as Detail[];
    const score = Number(s.score);
    const max = Number(s.max_score);
    return shell(
      <>
        <div className="card">
          <h2>Résultat</h2>
          <div className="score-big">{score} / {max}</div>
          <p className="muted">Soit {max ? ((score / max) * 20).toFixed(1) : "—"} / 20</p>
          {s.needs_review && (
            <p className="error">Certaines réponses ouvertes seront corrigées manuellement : la note peut évoluer.</p>
          )}
        </div>
        {details.map((d) => {
          const cls = d.score >= d.points ? "ok" : d.score > 0 ? "partial" : "ko";
          return (
            <div className="card" key={d.id}>
              <div className="q-num">Question {d.position}</div>
              <div className="q-text">{d.text}</div>
              <span className={`badge ${cls}`}>{d.score} / {d.points}</span>
              <p>
                <strong>Votre réponse : </strong>
                {d.type === "qcm"
                  ? d.answer
                    ? d.answer.split(",").map((l) => d.options?.[LETTERS.indexOf(l)] ?? l).join(" ; ")
                    : "—"
                  : d.answer || "—"}
              </p>
              <div className="feedback">{d.feedback}</div>
            </div>
          );
        })}
      </>
    );
  }

  const rows = await q`SELECT id, position, type, text, options, correct, points FROM questions
    WHERE exam_id = ${examId} ORDER BY position`;
  const questions: PublicQuestion[] = rows.map((r) => ({
    id: r.id as number,
    position: r.position as number,
    type: r.type as "qcm" | "open",
    text: r.text as string,
    options: (r.options as string[] | null) ?? null,
    multiple: r.type === "qcm" && String(r.correct).includes(","),
    points: Number(r.points),
  }));

  return shell(<ExamForm questions={questions} />);
}
