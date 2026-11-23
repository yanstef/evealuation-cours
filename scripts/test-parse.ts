import { readFileSync } from "node:fs";
import { parseQuestions } from "../lib/parse.ts";
const qs = await parseQuestions(readFileSync("templates/Modele-Questions.xlsx"), "Modele-Questions.xlsx");
console.log(JSON.stringify(qs, null, 1));
const csv = Buffer.from('type;question\n');
const csv2 = Buffer.from('type,question,option_a,option_b,reponse_correcte,points\nqcm,"Q1, avec virgule",Oui,Non,b,2\nouverte,Q2,,,,1\n');
try { await parseQuestions(csv2, "x.csv"); } catch (e) { console.log("OK erreur attendue:", (e as Error).message); }
