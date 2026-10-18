import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import AdmZip from "adm-zip";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const templateDir = path.join(root, "public", "templates");
const configuredTemplates = [
  "Attestation de Réception des Clés.docx",
  "BON DE VISITE.docx",
  "Formulaire de Prise d'informations.docx",
  "Attestation de versement.docx",
  "Bon de Paiement Frais d'agence.docx",
  "Bon service pemium.docx",
  "Contrat d'engagement avec promoteur.docx",
  "Contrat d'engagement Immobilier location.docx",
];
const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "pyramide-docs-"));

for (const filename of configuredTemplates) {
  const source = path.join(templateDir, filename);
  const sourceZip = new AdmZip(source);
  const xml = sourceZip.readAsText("word/document.xml");
  const keys = [...xml.matchAll(/\{\{([^}]+)\}\}/g)].map((match) => match[1]);
  if (!keys.length) throw new Error(`${filename}: aucun champ de fusion`);
  const values = Object.fromEntries(keys.map((key) => [key, key.includes("DATE") ? "18/10/2026" : `Valeur ${key.toLowerCase()}`]));
  const doc = new Docxtemplater(new PizZip(fs.readFileSync(source)), {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: "{{", end: "}}" },
  });
  doc.render(values);
  if (/\{\{[^}]+\}\}/.test(doc.getFullText())) throw new Error(`${filename}: champ non résolu`);
  const output = path.join(outputDir, filename);
  fs.writeFileSync(output, doc.getZip().generate({ type: "nodebuffer", compression: "DEFLATE" }));
  console.log(output);
}
