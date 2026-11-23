"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export type PublicQuestion = {
  id: number;
  position: number;
  type: "qcm" | "open";
  text: string;
  options: string[] | null;
  multiple: boolean;
  points: number;
};

const LETTERS = ["a", "b", "c", "d", "e", "f"];

export default function ExamForm({ questions }: { questions: PublicQuestion[] }) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<number, string | string[]>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function toggle(q: PublicQuestion, letter: string) {
    setAnswers((prev) => {
      if (!q.multiple) return { ...prev, [q.id]: letter };
      const cur = (prev[q.id] as string[] | undefined) ?? [];
      return { ...prev, [q.id]: cur.includes(letter) ? cur.filter((l) => l !== letter) : [...cur, letter] };
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!confirm("Confirmer l'envoi ? Vous ne pourrez plus modifier vos réponses.")) return;
    setBusy(true);
    setError("");
    const res = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });
    if (res.ok || res.status === 409) {
      router.refresh();
    } else {
      setError((await res.json().catch(() => ({}))).error ?? "Erreur lors de l'envoi.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      {questions.map((q) => (
        <div className="card" key={q.id}>
          <div className="q-num">Question {q.position} · {q.points} pt{q.points > 1 ? "s" : ""}</div>
          <div className="q-text">{q.text}</div>
          {q.type === "qcm" ? (
            <>
              {q.multiple && <p className="muted">Plusieurs réponses possibles.</p>}
              {q.options!.map((opt, i) => {
                const letter = LETTERS[i];
                const cur = answers[q.id];
                const checked = Array.isArray(cur) ? cur.includes(letter) : cur === letter;
                return (
                  <label className="opt" key={letter}>
                    <input
                      type={q.multiple ? "checkbox" : "radio"}
                      name={`q${q.id}`}
                      checked={checked}
                      onChange={() => toggle(q, letter)}
                    />
                    <span>{opt}</span>
                  </label>
                );
              })}
            </>
          ) : (
            <textarea
              value={(answers[q.id] as string) ?? ""}
              onChange={(e) => setAnswers((p) => ({ ...p, [q.id]: e.target.value }))}
              maxLength={4000}
              placeholder="Votre réponse…"
            />
          )}
        </div>
      ))}
      <button type="submit" className="gold" disabled={busy}>
        {busy ? "Correction en cours… (quelques secondes)" : "Envoyer mes réponses"}
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
