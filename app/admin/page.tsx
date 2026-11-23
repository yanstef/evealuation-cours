import { isAdmin } from "@/lib/auth";
import { ensureSchema, sql } from "@/lib/db";
import AdminLogin from "@/components/AdminLogin";
import AdminPanel, { type AdminExam, type AdminSubmission } from "@/components/AdminPanel";

export const dynamic = "force-dynamic";

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ exam?: string }> }) {
  const header = <header className="top"><h1>Espace enseignant</h1></header>;

  if (!(await isAdmin())) {
    return <>{header}<main><AdminLogin /></main></>;
  }

  await ensureSchema();
  const q = sql();
  const exams = (await q`SELECT e.id, e.title, e.active,
      (SELECT count(*) FROM questions WHERE exam_id = e.id)::int AS questions,
      (SELECT count(*) FROM submissions WHERE exam_id = e.id)::int AS submissions
    FROM exams e ORDER BY e.id DESC`) as unknown as AdminExam[];

  const sel = Number((await searchParams).exam);
  const selectedId = exams.find((e) => e.id === sel)?.id ?? null;
  const results = selectedId
    ? ((await q`SELECT id, nom, prenom, score::float AS score, max_score::float AS max_score, needs_review, created_at
        FROM submissions WHERE exam_id = ${selectedId} ORDER BY nom, prenom`) as unknown as AdminSubmission[])
    : [];

  return <>{header}<main><AdminPanel exams={exams} results={results} selectedId={selectedId} /></main></>;
}
