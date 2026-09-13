"use server";

import { FilterQuery, Types } from "mongoose";
import { revalidatePath } from "next/cache";
import slugify from "slugify";

import { Residence, ReferenceCounter } from "@/models";
import { getUserBySessionEmail } from "../getUserBySessionEmail";
import handleError from "../handlers/error";
import dbConnect from "../mongoose";
import ROUTES from "@/constants/routes";
import { isElevatedRole } from "@/constants/values";
import {
  residenceSchema,
  unitStatusUpdateSchema,
  ResidenceInput,
  UnitInput,
} from "../validators/residence";

/* ─────────────────────── Helpers ─────────────────────── */

async function requireResidenceManager() {
  const user = await getUserBySessionEmail();

  if (!user?.data) {
    return { error: { message: "Non autorisé", status: 401 } as const };
  }

  if (!isElevatedRole(user.data.role)) {
    return {
      error: {
        message: "Accès réservé aux gérants, administrateurs et développeurs",
        status: 403,
      } as const,
    };
  }

  return { user: user.data };
}

async function generateResidenceReferenceCode() {
  const lastResidence = (await Residence.findOne({
    referenceCode: { $regex: "^RES-" },
  })
    .sort({ referenceCode: -1 })
    .select("referenceCode")
    .lean()) as { referenceCode?: string } | null;

  const lastNumber = lastResidence?.referenceCode
    ? parseInt(lastResidence.referenceCode.split("-")[1], 10)
    : 0;

  const counter = (await ReferenceCounter.findOneAndUpdate(
    { _id: "residence" },
    [
      {
        $set: {
          prefix: "RES",
          sequence: {
            $add: [{ $max: [{ $ifNull: ["$sequence", 0] }, lastNumber] }, 1],
          },
          updatedAt: "$$NOW",
          createdAt: { $ifNull: ["$createdAt", "$$NOW"] },
        },
      },
    ],
    { upsert: true, new: true }
  ).lean()) as unknown as { sequence: number };

  return `RES-${String(counter.sequence).padStart(7, "0")}`;
}

async function generateUniqueResidenceSlug(title: string, excludeId?: string) {
  const base = slugify(title, { lower: true, strict: true, locale: "fr" }) || "residence";
  let candidate = base;
  let n = 2;

  while (
    await Residence.exists({
      slug: candidate,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    })
  ) {
    candidate = `${base}-${n++}`;
  }

  return candidate;
}

function computeResidenceAggregates(units: UnitInput[]) {
  const totalUnits = units.length;

  const availablePrices = units
    .filter((u) => u.status === "AVAILABLE" && u.price)
    .map((u) => u.price as number);
  const anyPrices = units.filter((u) => u.price).map((u) => u.price as number);

  const priceFrom = availablePrices.length
    ? Math.min(...availablePrices)
    : anyPrices.length
      ? Math.min(...anyPrices)
      : undefined;

  return { totalUnits, priceFrom };
}

function normalizeAmenities(amenities: ResidenceInput["amenities"]) {
  return (amenities ?? [])
    .map((a) => a.value?.trim())
    .filter((v): v is string => Boolean(v));
}

function revalidateResidencePaths(slug?: string, previousSlug?: string) {
  revalidatePath(ROUTES.RESIDENCES_DASHBOARD);
  revalidatePath(ROUTES.RESIDENCES);
  revalidatePath(ROUTES.HOME);
  if (slug) revalidatePath(ROUTES.RESIDENCE_DETAIL(slug));
  if (previousSlug && previousSlug !== slug) {
    revalidatePath(ROUTES.RESIDENCE_DETAIL(previousSlug));
  }
}

/* ─────────────────────── Create / Update ─────────────────────── */

export async function createResidence(
  params: ResidenceInput
): Promise<ActionResponse<Residence>> {
  try {
    const parsedParams = residenceSchema.parse(params);

    const access = await requireResidenceManager();
    if (access.error) {
      return { success: false, error: { message: access.error.message }, status: access.error.status };
    }

    await dbConnect();

    const slug = await generateUniqueResidenceSlug(
      parsedParams.slug?.trim() || parsedParams.title
    );
    const referenceCode = await generateResidenceReferenceCode();
    const { totalUnits, priceFrom } = computeResidenceAggregates(parsedParams.units);
    const amenities = normalizeAmenities(parsedParams.amenities);

    const residence = await Residence.create({
      ...parsedParams,
      slug,
      referenceCode,
      referenceGeneratedAt: new Date(),
      amenities,
      totalUnits,
      priceFrom,
      agent: parsedParams.agent || undefined,
      createdBy: access.user!._id,
      publishedAt: parsedParams.isPublished ? new Date() : undefined,
    });

    revalidateResidencePaths(slug);

    return {
      success: true,
      data: JSON.parse(JSON.stringify(residence)),
      status: 201,
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

export async function updateResidence(
  residenceId: string,
  params: ResidenceInput
): Promise<ActionResponse<Residence>> {
  try {
    if (!Types.ObjectId.isValid(residenceId)) {
      return { success: false, error: { message: "ID résidence invalide" }, status: 400 };
    }

    const parsedParams = residenceSchema.parse(params);

    const access = await requireResidenceManager();
    if (access.error) {
      return { success: false, error: { message: access.error.message }, status: access.error.status };
    }

    await dbConnect();

    const existing = await Residence.findById(residenceId).select("slug isPublished").lean() as
      | { slug: string; isPublished: boolean }
      | null;

    if (!existing) {
      return { success: false, error: { message: "Résidence introuvable" }, status: 404 };
    }

    const slug = parsedParams.slug?.trim()
      ? await generateUniqueResidenceSlug(parsedParams.slug.trim(), residenceId)
      : existing.slug;

    const { totalUnits, priceFrom } = computeResidenceAggregates(parsedParams.units);
    const amenities = normalizeAmenities(parsedParams.amenities);
    const becamePublished = parsedParams.isPublished && !existing.isPublished;

    const residence = await Residence.findByIdAndUpdate(
      residenceId,
      {
        ...parsedParams,
        slug,
        amenities,
        totalUnits,
        priceFrom,
        agent: parsedParams.agent || undefined,
        isFeatured: parsedParams.isPublished ? parsedParams.isFeatured ?? false : false,
        ...(becamePublished && { publishedAt: new Date() }),
      },
      { new: true }
    );

    if (!residence) {
      return { success: false, error: { message: "Résidence introuvable" }, status: 404 };
    }

    revalidateResidencePaths(slug, existing.slug);

    return {
      success: true,
      data: JSON.parse(JSON.stringify(residence)),
      status: 200,
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

/* ─────────────────────── Fetch ─────────────────────── */

interface FetchResidencesParams {
  search?: string;
  city?: string;
  completionStatus?: ResidenceCompletionStatus;
  isPublished?: boolean;
  isFeatured?: boolean;
  archived?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export async function fetchResidences(
  params: FetchResidencesParams = {}
): Promise<ActionResponse<Residence[]>> {
  try {
    const {
      search,
      city,
      completionStatus,
      isPublished,
      isFeatured,
      archived,
      page = 1,
      limit,
      sortBy,
      sortOrder,
    } = params;

    await dbConnect();

    const query: FilterQuery<Residence> = {};

    if (archived === true) {
      query.archived = true;
    } else {
      query.archived = { $ne: true };
    }

    if (isPublished !== undefined) query.isPublished = isPublished;
    if (isFeatured !== undefined) query.isFeatured = isFeatured;
    if (city) query["location.city"] = city;
    if (completionStatus) query.completionStatus = completionStatus;

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");
      query.$or = [
        { referenceCode: regex },
        { title: regex },
        { "location.city": regex },
      ];
    }

    const skip = limit ? (page - 1) * limit : 0;
    const sortField = sortBy || "createdAt";
    const sortDirection = sortOrder === "asc" ? 1 : -1;

    const [residences, total] = await Promise.all([
      Residence.find(query)
        .select(
          "title slug referenceCode location images coverImage priceFrom totalUnits completionStatus deliveryDate isPublished isFeatured createdAt units.status"
        )
        .sort({ [sortField]: sortDirection })
        .skip(skip)
        .limit(limit ?? 0)
        .lean(),
      Residence.countDocuments(query),
    ]);

    return {
      success: true,
      data: JSON.parse(JSON.stringify(residences)),
      total,
      status: 200,
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

export async function fetchResidenceById(
  residenceId: string
): Promise<ActionResponse<Residence>> {
  try {
    if (!Types.ObjectId.isValid(residenceId)) {
      return { success: false, error: { message: "ID résidence invalide" }, status: 400 };
    }

    await dbConnect();

    const residence = await Residence.findById(residenceId)
      .populate("agent", "firstname lastname email phone")
      .lean();

    if (!residence) {
      return { success: false, error: { message: "Résidence introuvable" }, status: 404 };
    }

    return { success: true, data: JSON.parse(JSON.stringify(residence)), status: 200 };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

export async function fetchResidenceBySlug(
  slug: string
): Promise<ActionResponse<Residence>> {
  try {
    await dbConnect();

    const residence = await Residence.findOne({ slug })
      .populate("agent", "firstname lastname email phone")
      .lean();

    if (!residence) {
      return { success: false, error: { message: "Résidence introuvable" }, status: 404 };
    }

    return { success: true, data: JSON.parse(JSON.stringify(residence)), status: 200 };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

/* ─────────────────────── Delete / Publish / Feature ─────────────────────── */

export async function deleteResidence(
  residenceId: string
): Promise<ActionResponse<null>> {
  try {
    if (!Types.ObjectId.isValid(residenceId)) {
      return { success: false, error: { message: "ID résidence invalide" }, status: 400 };
    }

    const access = await requireResidenceManager();
    if (access.error) {
      return { success: false, error: { message: access.error.message }, status: access.error.status };
    }

    await dbConnect();

    const deleted = await Residence.findByIdAndDelete(residenceId);
    if (!deleted) {
      return { success: false, error: { message: "Résidence introuvable" }, status: 404 };
    }

    revalidateResidencePaths(deleted.slug);

    return { success: true, data: null, status: 200 };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

export async function toggleResidencePublished(
  residenceId: string,
  currentStatus: boolean
): Promise<ActionResponse<{ isPublished: boolean }>> {
  try {
    const access = await requireResidenceManager();
    if (access.error) {
      return { success: false, error: { message: access.error.message }, status: access.error.status };
    }

    await dbConnect();
    const newStatus = !currentStatus;

    const residence = await Residence.findByIdAndUpdate(
      residenceId,
      {
        isPublished: newStatus,
        publishedAt: newStatus ? new Date() : undefined,
        ...(!newStatus && { isFeatured: false }),
      },
      { new: true }
    ).select("slug isPublished");

    if (!residence) {
      return { success: false, error: { message: "Résidence introuvable" }, status: 404 };
    }

    revalidateResidencePaths(residence.slug);

    return { success: true, data: { isPublished: residence.isPublished }, status: 200 };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

export async function setResidenceFeatured(
  residenceId: string,
  isFeatured: boolean
): Promise<ActionResponse<{ isFeatured: boolean }>> {
  try {
    const access = await requireResidenceManager();
    if (access.error) {
      return { success: false, error: { message: access.error.message }, status: access.error.status };
    }

    if (!Types.ObjectId.isValid(residenceId)) {
      return { success: false, error: { message: "ID résidence invalide" }, status: 400 };
    }

    await dbConnect();

    const residence = await Residence.findOneAndUpdate(
      { _id: residenceId, isPublished: true, archived: { $ne: true } },
      { isFeatured },
      { new: true }
    ).select("slug isFeatured");

    if (!residence) {
      return {
        success: false,
        error: { message: "Seules les résidences publiées peuvent être mises à la une." },
        status: 400,
      };
    }

    revalidateResidencePaths(residence.slug);

    return { success: true, data: { isFeatured: residence.isFeatured }, status: 200 };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

/* ─────────────────────── Unit status quick toggle ─────────────────────── */

export async function updateUnitStatus(
  params: { residenceId: string; unitId: string; status: UnitStatus }
): Promise<ActionResponse<{ status: UnitStatus }>> {
  try {
    const parsedParams = unitStatusUpdateSchema.parse(params);

    const access = await requireResidenceManager();
    if (access.error) {
      return { success: false, error: { message: access.error.message }, status: access.error.status };
    }

    await dbConnect();

    const { residenceId, unitId, status } = parsedParams;

    const updated = await Residence.findOneAndUpdate(
      { _id: residenceId, "units._id": unitId },
      { $set: { "units.$.status": status } },
      { new: true }
    ).select("slug units");

    if (!updated) {
      return { success: false, error: { message: "Résidence ou unité introuvable" }, status: 404 };
    }

    const { priceFrom } = computeResidenceAggregates(
      updated.units as unknown as UnitInput[]
    );
    await Residence.findByIdAndUpdate(residenceId, { priceFrom });

    revalidateResidencePaths(updated.slug);

    return { success: true, data: { status }, status: 200 };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

/* ─────────────────────── Documents ─────────────────────── */

interface ResidenceDocumentInput {
  publicId: string;
  url: string;
  secureUrl?: string;
  originalFilename?: string;
  format?: string;
  resourceType?: string;
  bytes?: number;
}

export async function addResidenceDocuments(
  residenceId: string,
  documents: ResidenceDocumentInput[]
): Promise<ActionResponse<Residence>> {
  try {
    if (!Types.ObjectId.isValid(residenceId)) {
      return { success: false, error: { message: "ID résidence invalide" }, status: 400 };
    }
    if (!documents.length) {
      return { success: false, error: { message: "Aucun document à ajouter" }, status: 400 };
    }

    const access = await requireResidenceManager();
    if (access.error) {
      return { success: false, error: { message: access.error.message }, status: access.error.status };
    }

    await dbConnect();

    const documentsToAdd = documents.map((document) => ({
      ...document,
      uploadedBy: access.user!._id,
      uploadedAt: new Date(),
    }));

    const residence = await Residence.findByIdAndUpdate(
      residenceId,
      { $push: { documents: { $each: documentsToAdd } } },
      { new: true }
    ).lean();

    if (!residence) {
      return { success: false, error: { message: "Résidence introuvable" }, status: 404 };
    }

    revalidatePath(ROUTES.RESIDENCE_EDIT(residenceId));

    return { success: true, data: JSON.parse(JSON.stringify(residence)), status: 200 };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

export async function removeResidenceDocument(
  residenceId: string,
  documentId: string
): Promise<ActionResponse<Residence>> {
  try {
    if (!Types.ObjectId.isValid(residenceId)) {
      return { success: false, error: { message: "ID résidence invalide" }, status: 400 };
    }

    const access = await requireResidenceManager();
    if (access.error) {
      return { success: false, error: { message: access.error.message }, status: access.error.status };
    }

    await dbConnect();

    const residence = await Residence.findByIdAndUpdate(
      residenceId,
      { $pull: { documents: { _id: documentId } } },
      { new: true }
    ).lean();

    if (!residence) {
      return { success: false, error: { message: "Résidence introuvable" }, status: 404 };
    }

    revalidatePath(ROUTES.RESIDENCE_EDIT(residenceId));

    return { success: true, data: JSON.parse(JSON.stringify(residence)), status: 200 };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}
