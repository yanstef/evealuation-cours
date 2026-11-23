import ExcelJS from "exceljs";
import { Readable } from "node:stream";

export type ParsedQuestion = {
  position: number;
  type: "qcm" | "open";
  text: string;
  options: string[] | null;
  correct: string | null; // lettres, ex. "B" ou "A,C"
  expected: string | null;
  points: number;
};

const norm = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

const LETTERS = ["a", "b", "c", "d", "e", "f"];

export async function parseQuestions(buffer: Buffer, filename: string): Promise<ParsedQuestion[]> {
  const wb = new ExcelJS.Workbook();
  if (filename.toLowerCase().endsWith(".csv")) {
    await wb.csv.read(Readable.from(buffer));
  } else {
    await wb.xlsx.load(buffer as unknown as ArrayBuffer);
  }
  const ws = wb.worksheets[0];
  if (!ws) throw new Error("Fichier vide");

  const headerRow = ws.getRow(1);
  const cols: Record<string, number> = {};
  headerRow.eachCell((cell, i) => {
    cols[norm(cell.text)] = i;
  });

  const need = (names: string[]) => names.map((n) => cols[n]).find((v) => v !== undefined);
  const cType = need(["type"]);
  const cQ = need(["question", "enonce"]);
  const cCorrect = need(["reponse_correcte", "bonne_reponse", "correct"]);
  const cExpected = need(["reponse_attendue", "bareme", "corrige"]);
  const cPoints = need(["points", "note", "bareme_points"]);
  if (!cQ) throw new Error("Colonne « question » introuvable (ligne 1)");
  const cOpts = LETTERS.map((l) => need([`option_${l}`, `choix_${l}`, l]));

  const out: ParsedQuestion[] = [];
  ws.eachRow((row, rowNum) => {
    if (rowNum === 1) return;
    const text = row.getCell(cQ).text.trim();
    if (!text) return;

    const rawType = cType ? norm(row.getCell(cType).text) : "";
    const options = cOpts
      .map((c) => (c ? row.getCell(c).text.trim() : ""))
      .filter((o) => o !== "");
    const isQcm = rawType ? rawType.startsWith("qcm") || rawType === "choix" : options.length >= 2;
    const pts = cPoints ? Number(row.getCell(cPoints).text.replace(",", ".")) : 1;
    const points = Number.isFinite(pts) && pts > 0 ? pts : 1;

    if (isQcm) {
      if (options.length < 2) throw new Error(`Ligne ${rowNum} : un QCM nécessite au moins 2 options`);
      const correct = (cCorrect ? row.getCell(cCorrect).text : "")
        .toLowerCase()
        .split(/[^a-f]+/)
        .filter(Boolean)
        .filter((l, i, a) => a.indexOf(l) === i)
        .sort();
      if (!correct.length) throw new Error(`Ligne ${rowNum} : réponse correcte manquante (ex. B ou A,C)`);
      for (const l of correct) {
        if (LETTERS.indexOf(l) >= options.length) throw new Error(`Ligne ${rowNum} : la réponse « ${l.toUpperCase()} » n'a pas d'option`);
      }
      out.push({ position: out.length + 1, type: "qcm", text, options, correct: correct.join(","), expected: null, points });
    } else {
      const expected = cExpected ? row.getCell(cExpected).text.trim() : "";
      if (!expected) throw new Error(`Ligne ${rowNum} : « reponse_attendue » manquante pour une question ouverte`);
      out.push({ position: out.length + 1, type: "open", text, options: null, correct: null, expected, points });
    }
  });

  if (!out.length) throw new Error("Aucune question trouvée");
  return out;
}
