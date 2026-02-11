"use server";

import fs from "fs/promises";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import dbConnect from "@/lib/mongoose";
import { getUserBySessionEmail } from "@/lib/getUserBySessionEmail";
import handleError from "@/lib/handlers/error";
import { getTemplateById } from "../documents/template-config";
import { Client, Listing, User } from "@/models";

type DocumentDataValue = string | number | boolean | Date | undefined;

interface GenerateDocumentParams {
  templateId: string;
  data: Record<string, DocumentDataValue>;
  clientId?: string;
  listingId?: string;
}

export interface GenerateDocumentResult {
  docxPath: string;
  filename: string;
  documentId?: string;
}

export interface GeneratedDocumentRecord {
  _id: string;
  templateId: string;
  templateName: string;
  filename: string;
  docxPath: string;
  agentId: string;
  agentName: string;
  clientId?: string;
  clientName?: string;
  listingId?: string;
  listingTitle?: string;
  createdAt: Date;
}

// Types for select options
export interface SelectOption {
  value: string;
  label: string;
}

export interface ClientOption extends SelectOption {
  phone?: string;
  address?: string;
  referenceCode?: string;
}

export interface ListingOption extends SelectOption {
  address?: string;
  type?: string;
  referenceCode?: string;
}

export interface AgentOption extends SelectOption {
  email?: string;
}

/**
 * Fetch clients for select dropdown
 */
export async function fetchClientsForSelect(): Promise<
  ActionResponse<ClientOption[]>
> {
  try {
    const user = await getUserBySessionEmail();
    if (!user?.data) {
      return {
        success: false,
        error: { message: "Non autorisé" },
        status: 401,
      };
    }

    await dbConnect();

    const clients = await Client.find()
      .select("firstName lastName phone address referenceCode")
      .sort({ referenceCode: 1 })
      .lean();

    const options: ClientOption[] = clients.map((client) => ({
      value: (client._id as string).toString(),
      label: `${client.firstName} ${client.lastName}`,
      phone: client.phone,
      address: client.address,
      referenceCode: client.referenceCode,
    }));

    return { success: true, data: options };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

/**
 * Fetch listings for select dropdown
 */
export async function fetchListingsForSelect(): Promise<
  ActionResponse<ListingOption[]>
> {
  try {
    const user = await getUserBySessionEmail();
    if (!user?.data) {
      return {
        success: false,
        error: { message: "Non autorisé" },
        status: 401,
      };
    }

    await dbConnect();

    const listings = await Listing.find({ status: { $ne: "ARCHIVED" } })
      .select("title location.address propertyType referenceCode")
      .sort({ referenceCode: 1 })
      .lean();

    const options: ListingOption[] = listings.map((listing) => ({
      value: (listing._id as string).toString(),
      label: listing.title,
      address: listing.location?.address || "",
      type: listing.propertyType,
      referenceCode: listing.referenceCode,
    }));

    return { success: true, data: options };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

/**
 * Fetch agents for select dropdown
 */
export async function fetchAgentsForSelect(): Promise<
  ActionResponse<AgentOption[]>
> {
  try {
    const user = await getUserBySessionEmail();
    if (!user?.data) {
      return {
        success: false,
        error: { message: "Non autorisé" },
        status: 401,
      };
    }

    await dbConnect();

    const agents = await User.find({
      role: { $in: ["ADMIN", "MANAGER", "AGENT"] },
    })
      .select("firstname lastname email")
      .sort({ firstname: 1 })
      .lean();

    const options: AgentOption[] = agents.map((agent) => ({
      value: (agent._id as string).toString(),
      label: `${agent.firstname} ${agent.lastname}`,
      email: agent.email,
    }));

    return { success: true, data: options };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

/**
 * Fetch client details by reference code for autofill
 */
export async function fetchClientByReferenceCode(
  referenceCode: string
): Promise<ActionResponse<Client>> {
  try {
    const user = await getUserBySessionEmail();
    if (!user?.data) {
      return {
        success: false,
        error: { message: "Non autorisé" },
        status: 401,
      };
    }

    await dbConnect();

    const client = await Client.findOne({ referenceCode })
      .select("firstName lastName phone email address city referenceCode")
      .lean();

    if (!client) {
      return {
        success: false,
        error: { message: "Client non trouvé" },
        status: 404,
      };
    }

    return { success: true, data: JSON.parse(JSON.stringify(client)) };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

/**
 * Fetch listing details by reference code for autofill
 */
export async function fetchListingByReferenceCode(
  referenceCode: string
): Promise<ActionResponse<Listing>> {
  try {
    const user = await getUserBySessionEmail();
    if (!user?.data) {
      return {
        success: false,
        error: { message: "Non autorisé" },
        status: 401,
      };
    }

    await dbConnect();

    const listing = await Listing.findOne({ referenceCode })
      .select(
        "title referenceCode location.address location.city propertyType price features description"
      )
      .lean();

    if (!listing) {
      return {
        success: false,
        error: { message: "Bien non trouvé" },
        status: 404,
      };
    }

    return { success: true, data: JSON.parse(JSON.stringify(listing)) };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

/**
 * Generate a document from a Word template by replacing placeholders
 * Uses docxtemplater for proper placeholder handling
 */
export async function generateDocument(
  params: GenerateDocumentParams
): Promise<ActionResponse<GenerateDocumentResult>> {
  try {
    // 1. Auth check
    const user = await getUserBySessionEmail();
    if (!user?.data) {
      return {
        success: false,
        error: { message: "Non autorisé" },
        status: 401,
      };
    }

    await dbConnect();

    const { templateId, data } = params;

    // 2. Get template configuration
    const template = getTemplateById(templateId);
    if (!template) {
      return {
        success: false,
        error: { message: "Template introuvable" },
        status: 404,
      };
    }

    // 3. Prepare directories
    const templatesDir = path.join(process.cwd(), "public", "templates");
    const outputDir = path.join(
      process.cwd(),
      "public",
      "documents",
      "generated"
    );
    await fs.mkdir(outputDir, { recursive: true });

    // 4. Generate unique filename
    const timestamp = Date.now();
    const filename = `${templateId}_${timestamp}`;
    const templatePath = path.join(templatesDir, template.filename);
    const docxPath = path.join(outputDir, `${filename}.docx`);

    // 5. Read template file
    const templateContent = await fs.readFile(templatePath);

    // 6. Prepare data for docxtemplater (convert placeholders to simple keys)
    const templateData: Record<string, string> = {};
    for (const variable of template.variables) {
      const rawValue = data[variable.key];
      let formattedValue: string;

      if (!rawValue && rawValue !== 0) {
        formattedValue = "";
      } else if (
        variable.type === "date" &&
        (rawValue instanceof Date || typeof rawValue === "string")
      ) {
        formattedValue = formatDate(rawValue);
      } else if (variable.type === "number" && typeof rawValue === "number") {
        formattedValue = formatNumber(rawValue);
      } else {
        formattedValue = String(rawValue);
      }

      // Extract the key from placeholder (e.g., {{CLIENT_NAME}} -> CLIENT_NAME)
      const key = variable.placeholder.replace(/\{\{|\}\}/g, "");
      templateData[key] = formattedValue;
    }

    // 7. Process template with docxtemplater
    const zip = new PizZip(templateContent);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: "{{", end: "}}" },
    });

    doc.render(templateData);

    // 8. Generate output file
    const buffer = doc.getZip().generate({
      type: "nodebuffer",
      compression: "DEFLATE",
    });

    await fs.writeFile(docxPath, buffer);

    // 9. Return result
    const result: GenerateDocumentResult = {
      filename,
      docxPath: `/documents/generated/${filename}.docx`,
    };

    return {
      success: true,
      data: result,
      status: 200,
    };
  } catch (error) {
    console.error("Document generation error:", error);
    return handleError(error) as ErrorResponse;
  }
}

/**
 * Format date for French locale
 */
function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Format number with thousands separator
 */
function formatNumber(num: number): string {
  return num.toLocaleString("fr-FR");
}

/**
 * Get list of generated documents
 */
// export async function fetchGeneratedDocuments(filters?: {
//   templateId?: string;
//   clientId?: string;
//   listingId?: string;
//   startDate?: Date;
//   endDate?: Date;
// }): Promise<ActionResponse<GeneratedDocumentRecord[]>> {
//   try {
//     const user = await getUserBySessionEmail();
//     if (!user?.data) {
//       return {
//         success: false,
//         error: { message: "Non autorisé" },
//         status: 401,
//       };
//     }

//     // TODO: Query GeneratedDocument model from database
//     return {
//       success: true,
//       data: [],
//       status: 200,
//     };
//   } catch (error) {
//     return handleError(error) as ErrorResponse;
//   }
// }

/**
 * Delete a generated document
 */
// export async function deleteGeneratedDocument(
//   documentId: string
// ): Promise<ActionResponse<void>> {
//   try {
//     const user = await getUserBySessionEmail();
//     if (!user?.data) {
//       return {
//         success: false,
//         error: { message: "Non autorisé" },
//         status: 401,
//       };
//     }

//     // TODO: Delete from database and filesystem
//     return {
//       success: true,
//       status: 200,
//     };
//   } catch (error) {
//     return handleError(error) as ErrorResponse;
//   }
// }
