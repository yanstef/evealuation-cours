import ExcelJS from "exceljs";
const wb = new ExcelJS.Workbook();
const ws = wb.addWorksheet("Questions");
ws.columns = [
  { header: "type", key: "type", width: 10 },
  { header: "question", key: "question", width: 60 },
  { header: "option_a", key: "a", width: 25 },
  { header: "option_b", key: "b", width: 25 },
  { header: "option_c", key: "c", width: 25 },
  { header: "option_d", key: "d", width: 25 },
  { header: "reponse_correcte", key: "ok", width: 18 },
  { header: "reponse_attendue", key: "exp", width: 60 },
  { header: "points", key: "pts", width: 8 },
];
ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF282154" } };
ws.addRows([
  { type: "qcm", question: "Quelle fonction Excel cherche une valeur dans la première colonne d'un tableau ?", a: "RECHERCHEV", b: "SOMME.SI", c: "NB.SI", d: "CONCAT", ok: "A", pts: 1 },
  { type: "qcm", question: "Quelles fonctions sont des fonctions de recherche ? (plusieurs réponses)", a: "RECHERCHEX", b: "INDEX", c: "ARRONDI", d: "EQUIV", ok: "A,B,D", pts: 2 },
  { type: "ouverte", question: "Expliquez la différence entre une référence relative et absolue.", exp: "Relative : s'adapte à la recopie. Absolue ($A$1) : reste fixe. Mixte possible. Exemple attendu.", pts: 3 },
]);
await wb.xlsx.writeFile("templates/Modele-Questions.xlsx");
