// lib/documents/template-config.ts

export interface TemplateVariable {
  key: string; // Variable name in code
  placeholder: string; // Text to replace in template
  label: string; // Form label
  type:
    | "text"
    | "number"
    | "date"
    | "textarea"
    | "select"
    | "checkbox"
    | "client"
    | "listing"
    | "agent";
  required: boolean;
  options?: string[];
  defaultValue?: string | number | boolean;
  description?: string;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  filename: string;
  description: string;
  category: "attestation" | "contract" | "form" | "receipt" | "visit";
  variables: TemplateVariable[];
  icon: string;
}

export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    id: "attestation-reception-cles",
    name: "Attestation de Réception des Clés",
    filename: "Attestation de Réception des Clés.docx",
    description: "Document de remise des clés au locataire ou propriétaire",
    category: "attestation",
    icon: "Key",
    variables: [
      {
        key: "date",
        placeholder: "{{DATE}}",
        label: "Date",
        type: "date",
        required: true,
      },
      {
        key: "clientName",
        placeholder: "{{CLIENT_NAME}}",
        label: "Nom du client",
        type: "client",
        required: true,
        description: "Nom complet du client recevant les clés",
      },
      {
        key: "propertyType",
        placeholder: "{{PROPERTY_TYPE}}",
        label: "Type de bien",
        type: "select",
        required: true,
        options: [
          "Appartement",
          "Maison",
          "Villa",
          "Studio",
          "Terrain",
          "Local commercial",
        ],
      },
      {
        key: "propertyAddress",
        placeholder: "{{PROPERTY_ADDRESS}}",
        label: "Adresse du bien",
        type: "listing",
        required: true,
      },
      {
        key: "propertyDetails",
        placeholder: "{{PROPERTY_DETAILS}}",
        label: "Détails du bien",
        type: "text",
        required: false,
      },
      {
        key: "remitterName",
        placeholder: "{{REMITTER_NAME}}",
        label: "Nom de la personne qui remet les clés",
        type: "text",
        required: true,
      },
      {
        key: "agentName",
        placeholder: "{{AGENT_NAME}}",
        label: "Agent responsable",
        type: "agent",
        required: true,
      },
    ],
  },

  {
    id: "bon-visite",
    name: "Bon de Visite",
    filename: "BON DE VISITE.docx",
    description: "Document de suivi pour les visites de biens immobiliers",
    category: "visit",
    icon: "Home",
    variables: [
      {
        key: "clientLastName",
        placeholder: "{{CLIENT_LASTNAME}}",
        label: "Nom du client",
        type: "text",
        required: true,
      },
      {
        key: "clientFirstName",
        placeholder: "{{CLIENT_FIRSTNAME}}",
        label: "Prénom du client",
        type: "text",
        required: true,
      },
      {
        key: "clientAddress",
        placeholder: "{{CLIENT_ADDRESS}}",
        label: "Adresse du client",
        type: "text",
        required: true,
      },
      {
        key: "clientPhone",
        placeholder: "{{CLIENT_PHONE}}",
        label: "Téléphone du client",
        type: "text",
        required: true,
      },
      {
        key: "propertyType",
        placeholder: "{{PROPERTY_TYPE}}",
        label: "Type de bien",
        type: "select",
        required: true,
        options: [
          "Appartement",
          "Maison",
          "Villa",
          "Studio",
          "Terrain",
          "Local commercial",
        ],
      },
      {
        key: "propertyAddress",
        placeholder: "{{PROPERTY_ADDRESS}}",
        label: "Adresse du bien",
        type: "listing",
        required: true,
      },
      {
        key: "visitDate",
        placeholder: "{{VISIT_DATE}}",
        label: "Date de visite",
        type: "date",
        required: true,
      },
      {
        key: "visitTime",
        placeholder: "{{VISIT_TIME}}",
        label: "Heure de visite",
        type: "text",
        required: true,
        description: "Format: HH:MM",
      },
      {
        key: "agentName",
        placeholder: "{{AGENT_NAME}}",
        label: "Nom de l'agent",
        type: "agent",
        required: true,
      },
    ],
  },

  {
    id: "formulaire-prise-informations",
    name: "Formulaire de Prise d'Informations",
    filename: "Formulaire de Prise d'informations.docx",
    description: "Questionnaire de qualification client et besoins",
    category: "form",
    icon: "FileText",
    variables: [
      {
        key: "clientName",
        placeholder: "{{CLIENT_NAME}}",
        label: "Nom et prénom",
        type: "client",
        required: true,
      },
      {
        key: "clientPhone",
        placeholder: "{{CLIENT_PHONE}}",
        label: "Numéro de téléphone",
        type: "text",
        required: true,
      },
      {
        key: "serviceType",
        placeholder: "{{SERVICE_TYPE}}",
        label: "Type de service",
        type: "select",
        required: true,
        options: ["Achat", "Vente", "Location"],
      },
      {
        key: "propertyType",
        placeholder: "{{PROPERTY_TYPE}}",
        label: "Type de bien",
        type: "select",
        required: true,
        options: [
          "Appartement",
          "Maison",
          "Villa",
          "Studio",
          "Terrain",
          "Local commercial",
        ],
      },
      {
        key: "wilaya",
        placeholder: "{{WILAYA}}",
        label: "Wilaya",
        type: "text",
        required: true,
      },
      {
        key: "quartier",
        placeholder: "{{QUARTIER}}",
        label: "Quartier",
        type: "text",
        required: false,
      },
      {
        key: "superficie",
        placeholder: "{{SUPERFICIE}}",
        label: "Superficie (m²)",
        type: "number",
        required: false,
      },
      {
        key: "nombrePieces",
        placeholder: "{{NOMBRE_PIECES}}",
        label: "Nombre de pièces",
        type: "number",
        required: false,
      },
      {
        key: "budget",
        placeholder: "{{BUDGET}}",
        label: "Budget ou Prix (DA)",
        type: "number",
        required: true,
      },
      {
        key: "observations",
        placeholder: "{{OBSERVATIONS}}",
        label: "Observations",
        type: "textarea",
        required: false,
      },
    ],
  },

  {
    id: "attestation-versement",
    name: "Attestation de Versement",
    filename: "Attestation de versement.docx",
    description: "Attestation de paiement pour location ou vente",
    category: "attestation",
    icon: "Receipt",
    variables: [
      {
        key: "date",
        placeholder: "{{DATE}}",
        label: "Date",
        type: "date",
        required: true,
      },
      {
        key: "clientName",
        placeholder: "{{CLIENT_NAME}}",
        label: "Nom du client",
        type: "client",
        required: true,
      },
      {
        key: "amount",
        placeholder: "{{AMOUNT}}",
        label: "Montant versé (DA)",
        type: "number",
        required: true,
      },
      {
        key: "amountInWords",
        placeholder: "{{AMOUNT_WORDS}}",
        label: "Montant en lettres",
        type: "text",
        required: true,
        description: "Ex: Cinquante mille dinars algériens",
      },
      {
        key: "paymentReason",
        placeholder: "{{PAYMENT_REASON}}",
        label: "Objet du versement",
        type: "select",
        required: true,
        options: [
          "Caution",
          "Loyer",
          "Acompte d'achat",
          "Frais d'agence",
          "Autre",
        ],
      },
      {
        key: "propertyAddress",
        placeholder: "{{PROPERTY_ADDRESS}}",
        label: "Adresse du bien",
        type: "listing",
        required: true,
      },
      {
        key: "agentName",
        placeholder: "{{AGENT_NAME}}",
        label: "Agent responsable",
        type: "agent",
        required: true,
      },
    ],
  },

  {
    id: "bon-paiement-frais",
    name: "Bon de Paiement Frais d'Agence",
    filename: "Bon de Paiement Frais d'agence.docx",
    description: "Reçu de paiement des honoraires d'agence",
    category: "receipt",
    icon: "DollarSign",
    variables: [
      {
        key: "receiptNumber",
        placeholder: "{{RECEIPT_NUMBER}}",
        label: "Numéro de reçu",
        type: "text",
        required: true,
      },
      {
        key: "date",
        placeholder: "{{DATE}}",
        label: "Date",
        type: "date",
        required: true,
      },
      {
        key: "clientName",
        placeholder: "{{CLIENT_NAME}}",
        label: "Nom du client",
        type: "client",
        required: true,
      },
      {
        key: "clientAddress",
        placeholder: "{{CLIENT_ADDRESS}}",
        label: "Adresse du client",
        type: "text",
        required: true,
      },
      {
        key: "clientPhone",
        placeholder: "{{CLIENT_PHONE}}",
        label: "Téléphone du client",
        type: "text",
        required: true,
      },
      {
        key: "amount",
        placeholder: "{{AMOUNT}}",
        label: "Montant (DA)",
        type: "number",
        required: true,
      },
      {
        key: "amountInWords",
        placeholder: "{{AMOUNT_WORDS}}",
        label: "Montant en lettres",
        type: "text",
        required: true,
      },
      {
        key: "paymentMethod",
        placeholder: "{{PAYMENT_METHOD}}",
        label: "Mode de paiement",
        type: "select",
        required: true,
        options: ["Espèces", "Chèque", "Virement bancaire"],
      },
      {
        key: "propertyType",
        placeholder: "{{PROPERTY_TYPE}}",
        label: "Type de bien",
        type: "select",
        required: true,
        options: [
          "Appartement",
          "Maison",
          "Villa",
          "Studio",
          "Terrain",
          "Local commercial",
        ],
      },
      {
        key: "propertyAddress",
        placeholder: "{{PROPERTY_ADDRESS}}",
        label: "Adresse du bien",
        type: "listing",
        required: true,
      },
      {
        key: "agentName",
        placeholder: "{{AGENT_NAME}}",
        label: "Agent responsable",
        type: "agent",
        required: true,
      },
    ],
  },

  {
    id: "bon-service-premium",
    name: "Bon Service Premium",
    filename: "Bon service pemium.docx",
    description: "Bon pour services immobiliers premium",
    category: "form",
    icon: "Star",
    variables: [
      {
        key: "serviceNumber",
        placeholder: "{{SERVICE_NUMBER}}",
        label: "Numéro de service",
        type: "text",
        required: true,
      },
      {
        key: "date",
        placeholder: "{{DATE}}",
        label: "Date",
        type: "date",
        required: true,
      },
      {
        key: "clientName",
        placeholder: "{{CLIENT_NAME}}",
        label: "Nom du client",
        type: "client",
        required: true,
      },
      {
        key: "propertyAddress",
        placeholder: "{{PROPERTY_ADDRESS}}",
        label: "Adresse du bien",
        type: "listing",
        required: true,
      },
      {
        key: "servicesIncluded",
        placeholder: "{{SERVICES}}",
        label: "Services inclus",
        type: "textarea",
        required: true,
        description: "Photos professionnelles, visite virtuelle, etc.",
      },
      {
        key: "amount",
        placeholder: "{{AMOUNT}}",
        label: "Montant (DA)",
        type: "number",
        required: true,
      },
      {
        key: "validityPeriod",
        placeholder: "{{VALIDITY}}",
        label: "Période de validité",
        type: "text",
        required: true,
      },
      {
        key: "agentName",
        placeholder: "{{AGENT_NAME}}",
        label: "Agent responsable",
        type: "agent",
        required: true,
      },
    ],
  },

  {
    id: "contrat-engagement-promoteur",
    name: "Contrat d'Engagement avec Promoteur",
    filename: "Contrat d'engagement avec promoteur.docx",
    description: "Contrat entre l'agence et un promoteur immobilier",
    category: "contract",
    icon: "FileSignature",
    variables: [
      {
        key: "contractNumber",
        placeholder: "{{CONTRACT_NUMBER}}",
        label: "Numéro de contrat",
        type: "text",
        required: true,
      },
      {
        key: "date",
        placeholder: "{{DATE}}",
        label: "Date",
        type: "date",
        required: true,
      },
      {
        key: "promoterName",
        placeholder: "{{PROMOTER_NAME}}",
        label: "Nom du promoteur",
        type: "text",
        required: true,
      },
      {
        key: "promoterAddress",
        placeholder: "{{PROMOTER_ADDRESS}}",
        label: "Adresse du promoteur",
        type: "text",
        required: true,
      },
      {
        key: "promoterRC",
        placeholder: "{{PROMOTER_RC}}",
        label: "Registre de commerce",
        type: "text",
        required: true,
      },
      {
        key: "projectName",
        placeholder: "{{PROJECT_NAME}}",
        label: "Nom du projet",
        type: "text",
        required: true,
      },
      {
        key: "projectAddress",
        placeholder: "{{PROJECT_ADDRESS}}",
        label: "Adresse du projet",
        type: "text",
        required: true,
      },
      {
        key: "commission",
        placeholder: "{{COMMISSION}}",
        label: "Commission (%)",
        type: "number",
        required: true,
      },
      {
        key: "duration",
        placeholder: "{{DURATION}}",
        label: "Durée du contrat",
        type: "text",
        required: true,
      },
      {
        key: "startDate",
        placeholder: "{{START_DATE}}",
        label: "Date de début",
        type: "date",
        required: true,
      },
      {
        key: "endDate",
        placeholder: "{{END_DATE}}",
        label: "Date de fin",
        type: "date",
        required: true,
      },
      {
        key: "agentName",
        placeholder: "{{AGENT_NAME}}",
        label: "Agent responsable",
        type: "agent",
        required: true,
      },
    ],
  },

  {
    id: "contrat-engagement-location",
    name: "Contrat d'Engagement Location",
    filename: "Contrat d'engagement Immobilier location.docx",
    description: "Mandat de location entre propriétaire et agence",
    category: "contract",
    icon: "FileContract",
    variables: [
      {
        key: "contractNumber",
        placeholder: "{{CONTRACT_NUMBER}}",
        label: "Numéro de mandat",
        type: "text",
        required: true,
      },
      {
        key: "date",
        placeholder: "{{DATE}}",
        label: "Date",
        type: "date",
        required: true,
      },
      {
        key: "ownerName",
        placeholder: "{{OWNER_NAME}}",
        label: "Nom du propriétaire",
        type: "text",
        required: true,
      },
      {
        key: "ownerAddress",
        placeholder: "{{OWNER_ADDRESS}}",
        label: "Adresse du propriétaire",
        type: "text",
        required: true,
      },
      {
        key: "ownerCIN",
        placeholder: "{{OWNER_CIN}}",
        label: "N° CIN propriétaire",
        type: "text",
        required: true,
      },
      {
        key: "ownerPhone",
        placeholder: "{{OWNER_PHONE}}",
        label: "Téléphone propriétaire",
        type: "text",
        required: true,
      },
      {
        key: "propertyAddress",
        placeholder: "{{PROPERTY_ADDRESS}}",
        label: "Adresse du bien",
        type: "listing",
        required: true,
      },
      {
        key: "propertyType",
        placeholder: "{{PROPERTY_TYPE}}",
        label: "Type de bien",
        type: "select",
        required: true,
        options: [
          "Appartement",
          "Maison",
          "Villa",
          "Studio",
          "Terrain",
          "Local commercial",
        ],
      },
      {
        key: "rentAmount",
        placeholder: "{{RENT_AMOUNT}}",
        label: "Loyer mensuel (DA)",
        type: "number",
        required: true,
      },
      {
        key: "charges",
        placeholder: "{{CHARGES}}",
        label: "Charges (DA)",
        type: "number",
        required: false,
      },
      {
        key: "commission",
        placeholder: "{{COMMISSION}}",
        label: "Commission agence",
        type: "text",
        required: true,
      },
      {
        key: "duration",
        placeholder: "{{DURATION}}",
        label: "Durée du mandat",
        type: "select",
        required: true,
        options: ["3 mois", "6 mois", "12 mois"],
      },
      {
        key: "startDate",
        placeholder: "{{START_DATE}}",
        label: "Date de début",
        type: "date",
        required: true,
      },
      {
        key: "agentName",
        placeholder: "{{AGENT_NAME}}",
        label: "Agent responsable",
        type: "agent",
        required: true,
      },
    ],
  },
];

// Helper functions
export function getTemplateById(id: string): DocumentTemplate | undefined {
  return DOCUMENT_TEMPLATES.find((t) => t.id === id);
}

export function getTemplatesByCategory(category: string): DocumentTemplate[] {
  return DOCUMENT_TEMPLATES.filter((t) => t.category === category);
}

export function getAllCategories(): string[] {
  return Array.from(new Set(DOCUMENT_TEMPLATES.map((t) => t.category)));
}

// Category labels in French
export const CATEGORY_LABELS: Record<string, string> = {
  attestation: "Attestations",
  contract: "Contrats",
  form: "Formulaires",
  receipt: "Reçus",
  visit: "Visites",
};
