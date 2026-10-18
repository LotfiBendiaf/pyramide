import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import AdmZip from "adm-zip";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = path.join(root, "public", "templates");
const baseTemplate = path.join(outputDir, "Attestation de versement.docx");

const templates = [
  ["Attestation de Réception des Clés.docx", "Attestation de réception des clés", [["Date", "{{DATE}}"], ["Client", "{{CLIENT_NAME}}"], ["Bien", "{{PROPERTY_TYPE}}"], ["Adresse", "{{PROPERTY_ADDRESS}}"], ["Détails", "{{PROPERTY_DETAILS}}"], ["Remise par", "{{REMITTER_NAME}}"], ["Agent responsable", "{{AGENT_NAME}}"]], "Le client reconnaît avoir reçu les clés du bien désigné ci-dessous et s’engage à les restituer selon les conditions convenues."],
  ["BON DE VISITE.docx", "Bon de visite", [["Nom", "{{CLIENT_LASTNAME}}"], ["Prénom", "{{CLIENT_FIRSTNAME}}"], ["Adresse du client", "{{CLIENT_ADDRESS}}"], ["Téléphone", "{{CLIENT_PHONE}}"], ["Type de bien", "{{PROPERTY_TYPE}}"], ["Adresse du bien", "{{PROPERTY_ADDRESS}}"], ["Date de visite", "{{VISIT_DATE}}"], ["Heure", "{{VISIT_TIME}}"], ["Agent responsable", "{{AGENT_NAME}}"]], "Le présent bon confirme la visite du bien indiqué. Le visiteur reconnaît que ce bien lui a été présenté par l’agence."],
  ["Formulaire de Prise d'informations.docx", "Formulaire de prise d’informations", [["Client", "{{CLIENT_NAME}}"], ["Téléphone", "{{CLIENT_PHONE}}"], ["Service", "{{SERVICE_TYPE}}"], ["Type de bien", "{{PROPERTY_TYPE}}"], ["Wilaya", "{{WILAYA}}"], ["Quartier", "{{QUARTIER}}"], ["Superficie", "{{SUPERFICIE}} m²"], ["Nombre de pièces", "{{NOMBRE_PIECES}}"], ["Budget ou prix", "{{BUDGET}} DA"], ["Observations", "{{OBSERVATIONS}}"]], "Ce formulaire synthétise les informations nécessaires à la qualification de la demande immobilière."],
  ["Attestation de versement.docx", "Attestation de versement", [["Date", "{{DATE}}"], ["Client", "{{CLIENT_NAME}}"], ["Montant", "{{AMOUNT}} DA"], ["Montant en lettres", "{{AMOUNT_WORDS}}"], ["Objet", "{{PAYMENT_REASON}}"], ["Adresse du bien", "{{PROPERTY_ADDRESS}}"], ["Agent responsable", "{{AGENT_NAME}}"]], "L’agence atteste avoir reçu le versement détaillé ci-dessous. Le présent document sert de justificatif au client."],
  ["Bon de Paiement Frais d'agence.docx", "Bon de paiement des frais d’agence", [["Numéro de reçu", "{{RECEIPT_NUMBER}}"], ["Date", "{{DATE}}"], ["Client", "{{CLIENT_NAME}}"], ["Adresse du client", "{{CLIENT_ADDRESS}}"], ["Téléphone", "{{CLIENT_PHONE}}"], ["Montant", "{{AMOUNT}} DA"], ["Montant en lettres", "{{AMOUNT_WORDS}}"], ["Mode de paiement", "{{PAYMENT_METHOD}}"], ["Type de bien", "{{PROPERTY_TYPE}}"], ["Adresse du bien", "{{PROPERTY_ADDRESS}}"], ["Agent responsable", "{{AGENT_NAME}}"]], "Ce reçu confirme le règlement des frais d’agence relatifs à l’opération immobilière désignée."],
  ["Bon service pemium.docx", "Bon de service premium", [["Numéro de service", "{{SERVICE_NUMBER}}"], ["Date", "{{DATE}}"], ["Client", "{{CLIENT_NAME}}"], ["Adresse du bien", "{{PROPERTY_ADDRESS}}"], ["Services inclus", "{{SERVICES}}"], ["Montant", "{{AMOUNT}} DA"], ["Période de validité", "{{VALIDITY}}"], ["Agent responsable", "{{AGENT_NAME}}"]], "Ce bon récapitule les prestations premium commandées par le client et leur période de validité."],
  ["Contrat d'engagement avec promoteur.docx", "Contrat d’engagement avec promoteur", [["Numéro de contrat", "{{CONTRACT_NUMBER}}"], ["Date", "{{DATE}}"], ["Promoteur", "{{PROMOTER_NAME}}"], ["Adresse du promoteur", "{{PROMOTER_ADDRESS}}"], ["Registre de commerce", "{{PROMOTER_RC}}"], ["Projet", "{{PROJECT_NAME}}"], ["Adresse du projet", "{{PROJECT_ADDRESS}}"], ["Commission", "{{COMMISSION}} %"], ["Durée", "{{DURATION}}"], ["Date de début", "{{START_DATE}}"], ["Date de fin", "{{END_DATE}}"], ["Agent responsable", "{{AGENT_NAME}}"]], "Le promoteur confie à l’agence la commercialisation du projet désigné. L’agence assure la présentation des biens et le suivi commercial pendant la durée convenue."],
  ["Contrat d'engagement Immobilier location.docx", "Mandat de location", [["Numéro de mandat", "{{CONTRACT_NUMBER}}"], ["Date", "{{DATE}}"], ["Propriétaire", "{{OWNER_NAME}}"], ["Adresse du propriétaire", "{{OWNER_ADDRESS}}"], ["Numéro CIN", "{{OWNER_CIN}}"], ["Téléphone", "{{OWNER_PHONE}}"], ["Adresse du bien", "{{PROPERTY_ADDRESS}}"], ["Type de bien", "{{PROPERTY_TYPE}}"], ["Loyer mensuel", "{{RENT_AMOUNT}} DA"], ["Charges", "{{CHARGES}} DA"], ["Commission agence", "{{COMMISSION}}"], ["Durée du mandat", "{{DURATION}}"], ["Date de début", "{{START_DATE}}"], ["Agent responsable", "{{AGENT_NAME}}"]], "Le propriétaire mandate l’agence pour rechercher un locataire et assurer le suivi de la mise en location du bien décrit ci-dessous."],
];

const xmlEscape = (value) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("’", "’");
const run = (text, options = "") => `<w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="21"/>${options}</w:rPr><w:t xml:space="preserve">${xmlEscape(text)}</w:t></w:r>`;
const paragraph = (text, props = "", runProps = "") => `<w:p><w:pPr>${props}<w:spacing w:after="120"/></w:pPr>${run(text, runProps)}</w:p>`;
const cell = (text, width, bold = false) => `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/><w:tcMar><w:top w:w="100" w:type="dxa"/><w:left w:w="120" w:type="dxa"/><w:bottom w:w="100" w:type="dxa"/><w:right w:w="120" w:type="dxa"/></w:tcMar><w:vAlign w:val="center"/></w:tcPr>${paragraph(text, "", bold ? "<w:b/>" : "")}</w:tc>`;
const row = (label, value) => `<w:tr>${cell(label, 3200, true)}${cell(value, 6500)}</w:tr>`;

const baseBuffer = fs.readFileSync(baseTemplate);
for (const [filename, title, fields, intro] of templates) {
  const zip = new AdmZip(baseBuffer);
  const rows = fields.map(([label, value]) => row(label, value)).join("");
  const isContract = title.includes("Contrat") || title.includes("Mandat");
  const clauses = isContract
    ? [
        ["Objet et obligations", "Les parties s’engagent à communiquer des informations exactes, à collaborer de bonne foi et à respecter les conditions commerciales indiquées dans le présent document."],
        ["Rémunération", "La rémunération de l’agence devient exigible selon les modalités convenues dès la réalisation de l’opération ou du service prévu."],
        ["Durée et résiliation", "L’engagement prend effet à la date indiquée pour la durée convenue. Toute résiliation doit être notifiée par écrit, sous réserve des obligations déjà engagées."],
        ["Acceptation", "Établi en deux exemplaires. Chaque partie reconnaît avoir lu et accepté l’ensemble des conditions avant signature."],
      ].map(([heading, text]) => paragraph(`${heading}  ${text}`, '<w:jc w:val="both"/>', '<w:sz w:val="19"/>')).join("")
    : "";
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>
${paragraph("PYRAMIDE IMMOBILIER", '<w:jc w:val="center"/>', '<w:b/><w:color w:val="234F7C"/><w:sz w:val="22"/>')}
${paragraph(title, '<w:jc w:val="center"/><w:spacing w:before="120" w:after="240"/>', '<w:b/><w:sz w:val="32"/>')}
${paragraph(intro, '<w:jc w:val="both"/>')}
<w:tbl><w:tblPr><w:tblW w:w="9700" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblBorders><w:top w:val="single" w:sz="4" w:color="D9D9D9"/><w:left w:val="single" w:sz="4" w:color="D9D9D9"/><w:bottom w:val="single" w:sz="4" w:color="D9D9D9"/><w:right w:val="single" w:sz="4" w:color="D9D9D9"/><w:insideH w:val="single" w:sz="4" w:color="D9D9D9"/><w:insideV w:val="single" w:sz="4" w:color="D9D9D9"/></w:tblBorders></w:tblPr><w:tblGrid><w:gridCol w:w="3200"/><w:gridCol w:w="6500"/></w:tblGrid>${rows}</w:tbl>
${clauses}
${paragraph("")}
<w:tbl><w:tblPr><w:tblW w:w="9700" w:type="dxa"/></w:tblPr><w:tblGrid><w:gridCol w:w="4850"/><w:gridCol w:w="4850"/></w:tblGrid><w:tr>${cell("Signature du client ou cocontractant\n\n\n", 4850, true)}${cell("Cachet et signature de l’agence\n\n\n", 4850, true)}</w:tr></w:tbl>
<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1020" w:right="1134" w:bottom="1020" w:left="1134" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr>
</w:body></w:document>`;
  zip.updateFile("word/document.xml", Buffer.from(documentXml));
  zip.writeZip(path.join(outputDir, filename));
}

console.log(`Rebuilt ${templates.length} templates in ${outputDir}`);
