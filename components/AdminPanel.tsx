"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export type AdminExam = { id: number; title: string; active: boolean; questions: number; submissions: number };
export type AdminSubmission = { id: number; nom: string; prenom: string; score: number; max_score: number; needs_review: boolean; created_at: string };

export default function AdminPanel({ exams, results, selectedId }: { exams: AdminExam[]; results: AdminSubmission[]; selectedId: number | null }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setMsg("");
    const fd = new FormData();
    fd.set("title", title);
    fd.set("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      setMsg(`✔ ${data.count} questions importées. Activez l'évaluation pour l'ouvrir aux étudiants.`);
      setTitle("");
      setFile(null);
      router.refresh();
    } else setMsg(`✘ ${data.error ?? "Erreur"}`);
  }

  async function setActive(id: number, active: boolean) {
    await fetch(`/api/admin/exams/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active }) });
    router.refresh();
  }
  async function remove(id: number) {
    if (!confirm("Supprimer cette évaluation et tous les résultats associés ?")) return;
    await fetch(`/api/admin/exams/${id}`, { method: "DELETE" });
    router.push("/admin");
    router.refresh();
  }

  return (
    <>
      <form onSubmit={upload} className="card">
        <h2>Charger une série de questions</h2>
        <label htmlFor="title">Titre de l'évaluation</label>
        <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <label htmlFor="file">Fichier Excel (.xlsx) ou CSV</label>
        <input id="file" type="file" accept=".xlsx,.csv" onChange={(e) => setFile(e.target.files?.[0] ?? null)} required />
        <p className="muted">
          Colonnes : <code>type</code> (qcm / ouverte), <code>question</code>, <code>option_a</code> … <code>option_f</code>,{" "}
          <code>reponse_correcte</code> (ex. B ou A,C), <code>reponse_attendue</code> (questions ouvertes), <code>points</code>.
        </p>
        <button type="submit" disabled={busy}>{busy ? "Import…" : "Importer"}</button>
        {msg && <p className={msg.startsWith("✔") ? "" : "error"}>{msg}</p>}
      </form>

      <div className="card">
        <h2>Évaluations</h2>
        {exams.length === 0 ? <p className="muted">Aucune évaluation.</p> : (
          <table>
            <thead><tr><th>Titre</th><th>Questions</th><th>Soumissions</th><th></th></tr></thead>
            <tbody>
              {exams.map((x) => (
                <tr key={x.id}>
                  <td>{x.title} {x.active && <span className="badge active">ACTIVE</span>}</td>
                  <td>{x.questions}</td>
                  <td>{x.submissions}</td>
                  <td className="row">
                    <a className="btn ghost" style={{ background: "#fff", color: "#282154", border: "1px solid #282154" }} href={`/admin?exam=${x.id}`}>Résultats</a>
                    <button className={x.active ? "ghost" : "gold"} onClick={() => setActive(x.id, !x.active)}>{x.active ? "Désactiver" : "Activer"}</button>
                    <button className="danger" onClick={() => remove(x.id)}>Supprimer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedId && (
        <div className="card">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h2>Résultats</h2>
            <a className="btn" href={`/api/admin/export?examId=${selectedId}`}>Exporter en CSV</a>
          </div>
          {results.length === 0 ? <p className="muted">Aucune soumission.</p> : (
            <table>
              <thead><tr><th>Nom</th><th>Prénom</th><th>Score</th><th>/20</th><th></th></tr></thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.id}>
                    <td>{r.nom}</td>
                    <td>{r.prenom}</td>
                    <td>{r.score} / {r.max_score}</td>
                    <td>{r.max_score ? ((r.score / r.max_score) * 20).toFixed(1) : "—"}</td>
                    <td>{r.needs_review && <span className="badge ko">À corriger</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </>
  );
}
