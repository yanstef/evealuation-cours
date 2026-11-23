"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nom, prenom }),
    });
    if (res.ok) {
      router.push("/exam");
    } else {
      setError((await res.json().catch(() => ({}))).error ?? "Erreur de connexion.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card">
      <h2>Connexion</h2>
      <label htmlFor="nom">Nom</label>
      <input id="nom" type="text" value={nom} onChange={(e) => setNom(e.target.value)} autoComplete="family-name" required />
      <label htmlFor="prenom">Prénom</label>
      <input id="prenom" type="text" value={prenom} onChange={(e) => setPrenom(e.target.value)} autoComplete="given-name" required />
      <p className="muted">Une seule tentative est autorisée par étudiant. Saisissez votre identité telle qu'elle figure sur la liste de la classe.</p>
      <button type="submit" disabled={busy}>{busy ? "Connexion…" : "Accéder à l'évaluation"}</button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
