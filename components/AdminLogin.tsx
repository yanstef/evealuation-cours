"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) router.refresh();
    else setError((await res.json().catch(() => ({}))).error ?? "Erreur.");
  }

  return (
    <form onSubmit={submit} className="card">
      <h2>Espace enseignant</h2>
      <label htmlFor="pw">Mot de passe</label>
      <input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      <p><button type="submit">Se connecter</button></p>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
