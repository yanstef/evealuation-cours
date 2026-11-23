import { neon } from "@neondatabase/serverless";

let schemaReady: Promise<void> | null = null;

export function sql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL manquante");
  return neon(url);
}

/** Crée les tables au premier appel (idempotent). */
export async function ensureSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      const q = sql();
      await q`CREATE TABLE IF NOT EXISTS exams (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        active BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
      await q`CREATE TABLE IF NOT EXISTS questions (
        id SERIAL PRIMARY KEY,
        exam_id INT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
        position INT NOT NULL,
        type TEXT NOT NULL,
        text TEXT NOT NULL,
        options JSONB,
        correct TEXT,
        expected TEXT,
        points NUMERIC NOT NULL DEFAULT 1
      )`;
      await q`CREATE TABLE IF NOT EXISTS submissions (
        id SERIAL PRIMARY KEY,
        exam_id INT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
        nom TEXT NOT NULL,
        prenom TEXT NOT NULL,
        student_key TEXT NOT NULL,
        answers JSONB NOT NULL,
        details JSONB NOT NULL,
        score NUMERIC NOT NULL,
        max_score NUMERIC NOT NULL,
        needs_review BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (exam_id, student_key)
      )`;
    })().catch((e) => {
      schemaReady = null;
      throw e;
    });
  }
  return schemaReady;
}
