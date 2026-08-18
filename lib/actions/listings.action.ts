"use server";

import {
  Listing,
  Client,
  Negotiation,
  Visit,
  User,
  ReferenceCounter,
} from "@/models";
import { getUserBySessionEmail } from "../getUserBySessionEmail";
import action from "../handlers/action";
import handleError from "../handlers/error";
import {
  ListingInput,
  listingCreateSchema,
  listingSchema,
  photoVisitScheduleSchema,
  photoVisitCompleteSchema,
  keyAvailabilitySchema,
  PhotoVisitScheduleInput,
  PhotoVisitCompleteInput,
  KeyAvailabilityInput,
} from "../validators/listing";
import dbConnect from "../mongoose";
import { FilterQuery, Types } from "mongoose";
import { revalidatePath } from "next/cache";
import { PropertyStatus, isElevatedRole } from "@/constants/values";
import ROUTES from "@/constants/routes";
import { clientPrefix, formatPriceAlgeria } from "../utils";

function getListingReferencePrefix(status: string): "V" | "L" {
  return status === "En Location" || status === "Loué" ? "L" : "V";
}

function hasListingReferencePrefix(referenceCode: string | undefined, prefix: "V" | "L") {
  return referenceCode?.startsWith(`${prefix}-`) ?? false;
}

async function generateListingReferenceCode(prefix: "V" | "L") {
  const lastListing = (await Listing.findOne({
    referenceCode: { $regex: `^${prefix}-` },
  })
    .sort({ referenceCode: -1 })
    .select("referenceCode")
    .lean()) as { referenceCode?: string } | null;

  const lastNumber = lastListing?.referenceCode
    ? parseInt(lastListing.referenceCode.split("-")[1], 10)
    : 0;

  // The aggregation-pipeline update is atomic. It also self-heals a missing or
  // stale counter by never allocating below the highest code already stored.
  const counter = (await ReferenceCounter.findOneAndUpdate(
    { _id: `listing:${prefix}` },
    [
      {
        $set: {
          prefix,
          sequence: {
            $add: [
              { $max: [{ $ifNull: ["$sequence", 0] }, lastNumber] },
              1,
            ],
          },
          updatedAt: "$$NOW",
          createdAt: { $ifNull: ["$createdAt", "$$NOW"] },
        },
      },
    ],
    { upsert: true, new: true }
  ).lean()) as unknown as { sequence: number };

  return `${prefix}-${String(counter.sequence).padStart(7, "0")}`;
}

function upsertReferenceInDescription(
  description: string | undefined,
  referenceCode: string
) {
  if (!description) return description;

  if (description.includes("Réf :")) {
    return description.replace(/^Réf : .+$/m, `Réf : ${referenceCode}`);
  }

  return description.replace(/^([\s\S]*?)(Type :)/m, `$1Réf : ${referenceCode}\n$2`);
}

function buildListingDescription(
  params: ListingInput,
  referenceCode?: string
): string {
  const statusLine =
    params.status === "En Location"
      ? "𝗣𝗬𝗥𝗔𝗠𝗜𝗗𝗘 𝗜𝗠𝗠𝗢𝗕𝗜𝗟𝗜𝗘𝗥 met en location"
      : "𝗣𝗬𝗥𝗔𝗠𝗜𝗗𝗘 𝗜𝗠𝗠𝗢𝗕𝗜𝗟𝗜𝗘𝗥 met en vente";

  const typeLabel = params.propertyTypeCustom?.trim() || params.propertyType;
  const lowerType = typeLabel.toLowerCase();
  const isVilla = lowerType.startsWith("villa");
  const article =
    lowerType.startsWith("maison") || isVilla ? "Une" : "Un";
  const situe = article === "Une" ? "située" : "situé";
  const _city = params.location?.city?.trim();
  const _address = params.location?.address?.trim();
  const locationLabel =
    params.location?.district?.trim() ||
    (_city && _address ? `${_city} - ${_address}` : _city || _address || "");
  const areaLabel = params.features.area ? `${params.features.area} m²` : "";
  const nombreEtages = params.features.nombreEtages;
  const nombreEtagesLine =
    nombreEtages !== undefined ? `Hauteur : R+${nombreEtages}` : undefined;
  const etage = params.features.etage;
  const etageSuffix = etage === 1 ? "er" : "e";
  const elevatorText = params.features.elevator ? " avec ascenseur" : "";
  const etageLine =
    etage !== undefined
      ? isVilla
        ? `R+${etage}${elevatorText}`
        : `Étage : ${etage}${etageSuffix}${elevatorText}`
      : undefined;

  const priceLabel = `${formatPriceAlgeria(params.price ?? 0).replace(".", ",")} DA`;

  const villaTypeLabel =
    isVilla && etage !== undefined ? `${lowerType} R+${etage}` : lowerType;

  const intro =
    locationLabel && areaLabel
      ? `${article} ${villaTypeLabel} de ${areaLabel}, ${situe}${
          !isVilla && etage !== undefined ? ` au ${etage}${etageSuffix} étage` : ""
        } à ${locationLabel}.`
      : `${article} ${villaTypeLabel} spacieux et lumineux.`;

  const details = [
    referenceCode ? `Réf : ${referenceCode}` : undefined,
    `Type : ${typeLabel}`,
    areaLabel ? `Surface : ${areaLabel}` : undefined,
    etageLine,
    nombreEtagesLine,
    locationLabel ? `Emplacement : ${locationLabel}` : undefined,
    `Prix demandé : ${priceLabel}`,
  ]
    .filter(Boolean)
    .join("\n");

  const cityLabel = params.location?.city?.trim() || locationLabel;
  const closing = cityLabel
    ? `Un bien rare à ${cityLabel}, alliant confort, accessibilité et standing dans l’un des quartiers les plus recherchés.`
    : "Un bien rare, alliant confort, accessibilité et standing.";

  const contact =
    "Pour plus d’informations ou pour organiser une visite :\n0556510000 / 0779079706";

  return [
    statusLine,
    "",
    intro,
    "",
    "Ce bien spacieux et lumineux offre de beaux volumes, un cadre agréable et un confort idéal pour une famille recherchant un lieu de vie moderne et bien situé.",
    "",
    details,
    "",
    closing,
    "",
    contact,
  ].join("\n");
}

export async function createListing(
  params: ListingInput
): Promise<ActionResponse<Listing>> {
  // 1. Validation + Authorization
  const validationResult = await action({
    params,
    schema: listingCreateSchema,
    authorize: true,
  });

  if (validationResult instanceof Error) {
    return handleError(validationResult) as ErrorResponse;
  }

  // 2. Get current user (agent / admin)
  const user = await getUserBySessionEmail();

  if (!user?.data) {
    return {
      success: false,
      error: { message: "Utilisateur non autorisé" },
      status: 401,
    };
  }

  try {
    const parsedParams = listingCreateSchema.parse(validationResult.params);

    const evaluation = parsedParams.evaluation
      ? {
          ...parsedParams.evaluation,
          positives:
            parsedParams.evaluation.positives?.map((p) => p.value) ?? [],
          negatives:
            parsedParams.evaluation.negatives?.map((n) => n.value) ?? [],
          evaluatedBy: user.data._id,
          evaluatedAt: parsedParams.evaluation.evaluatedAt ?? new Date(),
        }
      : undefined;

    await dbConnect();

    // 3. Create the required seller client
    const { sellerFirstName, sellerLastName, sellerPhone, sellerEmail } =
      parsedParams;

    const sellerCount = await Client.countDocuments({ type: "SELLER" });
    const sellerReferenceCode = `${clientPrefix("SELLER")}-${String(
      sellerCount + 1
    ).padStart(3, "0")}`;

    const sellerClient = await Client.create({
      referenceCode: sellerReferenceCode,
      type: "SELLER",
      firstName: sellerFirstName,
      lastName: sellerLastName,
      phone: sellerPhone,
      email: sellerEmail || undefined,
      city: parsedParams.location.city,
      qualificationStatus: "NEW",
      archived: false,
      createdBy: user.data._id,
      assignedAgent: user.data._id,
    });

    // 4. Create listing (no reference code yet — assigned on validation)
    const description =
      parsedParams.description?.trim() || buildListingDescription(parsedParams);

    const normalizedPropertyTypeCustom =
      parsedParams.propertyType === "Autre"
        ? parsedParams.propertyTypeCustom?.trim()
        : undefined;

    // Listings created by an agent skip the waiting-for-approval step and go
    // straight to APPROVED. A referenceCode is not assigned here — it is only
    // required once a listing reaches VALIDATED (see toggleListingValidation).
    const isAgentCreated = user.data.role === "AGENT";

    const listing = await Listing.create({
      ...parsedParams,
      description,
      propertyTypeCustom: normalizedPropertyTypeCustom,
      evaluation,
      agent: user.data._id,
      sellerClient: sellerClient._id,
      isValidated: isAgentCreated,
      ...(isAgentCreated && {
        validationStatus: "APPROVED",
        validatedAt: new Date(),
        validatedBy: user.data._id,
        pipelineStatus: "PHOTO_VISIT_PENDING",
      }),
    });

    if (!listing) {
      throw new Error("Échec de la création de l'annonce");
    }

    revalidatePath(ROUTES.LISTINGS_DASHBOARD);
    if (parsedParams.isPublished) {
      revalidatePath(ROUTES.LISTINGS);
    }

    return {
      success: true,
      data: JSON.parse(JSON.stringify(listing)),
      status: 201,
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

interface FetchListingsParams {
  assignedToCurrentUser?: boolean;
  isPublished?: boolean;
  isValidated?: boolean;
  validationStatus?: "NEUTRAL" | "APPROVED" | "VALIDATED";
  hasReferenceCode?: boolean;
  archived?: boolean;
  status?: ListingInput["status"];
  city?: string;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  rentMinPrice?: number;
  rentMaxPrice?: number;
  saleMinPrice?: number;
  saleMaxPrice?: number;
  bedrooms?: number;
  limit?: number;
  page?: number;
  isPremium?: boolean;
  isFeatured?: boolean;
  minScore?: number;
  search?: string;
  referenceCodeSearch?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

type PriceFilter = {
  $gte?: number;
  $lte?: number;
};

export type ListingDocumentInput = {
  publicId: string;
  url: string;
  secureUrl?: string;
  originalFilename?: string;
  format?: string;
  resourceType?: string;
  bytes?: number;
};

function buildPriceFilter(minPrice?: number, maxPrice?: number): PriceFilter {
  const price: PriceFilter = {};

  if (minPrice !== undefined) price.$gte = minPrice;
  if (maxPrice !== undefined) price.$lte = maxPrice;

  return price;
}

export async function fetchListings(
  params: FetchListingsParams = {}
): Promise<ActionResponse<Listing[]>> {
  try {
    const {
      assignedToCurrentUser,
      isPublished,
      isValidated,
      validationStatus,
      hasReferenceCode,
      archived,
      status,
      city,
      propertyType,
      minPrice,
      maxPrice,
      rentMinPrice,
      rentMaxPrice,
      saleMinPrice,
      saleMaxPrice,
      bedrooms,
      limit,
      page = 1,
      isPremium,
      isFeatured,
      minScore,
      search,
      referenceCodeSearch,
      sortBy,
      sortOrder,
    } = params;

    const skip = limit ? (page - 1) * limit : 0;

    const query: FilterQuery<Listing> = {};

    await dbConnect();

    if (assignedToCurrentUser) {
      const user = await getUserBySessionEmail();

      if (!user?.data) {
        return {
          success: false,
          error: { message: "Utilisateur non autorisé" },
          status: 401,
        };
      }

      query.agent = user.data._id;
    }

    if (isPublished !== undefined) {
      query.isPublished = isPublished;
    }

    if (isValidated === true) {
      query.isValidated = true;
    } else if (isValidated === false) {
      // Catch both explicit false and documents where the field is not set
      query.isValidated = { $ne: true };
    }

    if (validationStatus) {
      query.validationStatus = validationStatus;
    }

    if (hasReferenceCode === true) {
      query.referenceCode = { $exists: true, $nin: [null, ""] };
    } else if (hasReferenceCode === false) {
      query.$and = [
        ...(query.$and ?? []),
        {
          $or: [
            { referenceCode: { $exists: false } },
            { referenceCode: null },
            { referenceCode: "" },
          ],
        },
      ];
    }

    // By default exclude archived listings; pass archived: true to fetch only archived
    if (archived === true) {
      query.archived = true;
    } else {
      query.archived = { $ne: true };
    }

    if (status) query.status = status;
    if (propertyType) query.propertyType = propertyType;
    if (city) query["location.city"] = city;
    if (isPremium !== undefined) query.isPremium = isPremium;
    if (isFeatured !== undefined) query.isFeatured = isFeatured;
    if (minScore !== undefined) {
      query["evaluation.finalScore"] = { $gte: minScore };
    }

    if (bedrooms !== undefined) {
      query["features.bedrooms"] = bedrooms;
    }

    const hasLegacyPriceFilter =
      minPrice !== undefined || maxPrice !== undefined;
    const hasRentPriceFilter =
      rentMinPrice !== undefined || rentMaxPrice !== undefined;
    const hasSalePriceFilter =
      saleMinPrice !== undefined || saleMaxPrice !== undefined;

    if (
      status === "En Location" &&
      (hasRentPriceFilter || hasLegacyPriceFilter)
    ) {
      const effectiveMinPrice = rentMinPrice ?? minPrice;
      const effectiveMaxPrice = rentMaxPrice ?? maxPrice;

      query.price = buildPriceFilter(effectiveMinPrice, effectiveMaxPrice);
    } else if (
      status === "En Vente" &&
      (hasSalePriceFilter || hasLegacyPriceFilter)
    ) {
      const effectiveMinPrice = saleMinPrice ?? minPrice;
      const effectiveMaxPrice = saleMaxPrice ?? maxPrice;

      query.price = buildPriceFilter(effectiveMinPrice, effectiveMaxPrice);
    } else if (!status && (hasRentPriceFilter || hasSalePriceFilter)) {
      const priceStatusClauses: FilterQuery<Listing>[] = [];

      if (hasRentPriceFilter) {
        const price = buildPriceFilter(rentMinPrice, rentMaxPrice);

        priceStatusClauses.push({ status: "En Location", price });
      }

      if (hasSalePriceFilter) {
        const price = buildPriceFilter(saleMinPrice, saleMaxPrice);

        priceStatusClauses.push({ status: "En Vente", price });
      }

      if (priceStatusClauses.length > 0) {
        query.$and = [...(query.$and ?? []), { $or: priceStatusClauses }];
      }
    } else if (hasLegacyPriceFilter) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = minPrice;
      if (maxPrice !== undefined) query.price.$lte = maxPrice;
    }

    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escapedSearch, "i");

      // Phone numbers are stored in international format (for example
      // +213555123456), while users commonly search using the local format
      // (0555123456) or add spaces. Match the significant digits as well.
      const phoneDigits = search.replace(/\D/g, "");
      const localPhoneDigits = phoneDigits.replace(/^0/, "");
      const phoneRegex =
        localPhoneDigits.length >= 5
          ? new RegExp(localPhoneDigits.split("").join("\\D*"), "i")
          : null;

      // Find seller clients matching the search term (phone, name, email)
      const matchingClientIds = await Client.find({
        $or: [
          { phone: regex },
          { phone2: regex },
          ...(phoneRegex
            ? [{ phone: phoneRegex }, { phone2: phoneRegex }]
            : []),
          { firstName: regex },
          { lastName: regex },
          { email: regex },
        ],
      }).distinct("_id");

      query.$or = [
        { referenceCode: regex },
        { title: regex },
        { "location.city": regex },
        { "location.district": regex },
        { "location.address": regex },
        ...(matchingClientIds.length > 0
          ? [{ sellerClient: { $in: matchingClientIds } }]
          : []),
      ];
    }

    if (referenceCodeSearch) {
      const escaped = referenceCodeSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.referenceCode = { $regex: escaped, $options: "i" };
    }

    // 2. Fetch listings and total count in parallel
    const sortField = sortBy || "createdAt";
    const sortDirection = sortBy
      ? sortOrder === "asc"
        ? 1
        : -1
      : -1;

    const [listings, total] = await Promise.all([
      Listing.find(query)
        .sort({ [sortField]: sortDirection })
        .populate("agent", "name firstname lastname email phone")
        .skip(skip)
        .limit(limit ?? 0)
        .lean(),
      Listing.countDocuments(query),
    ]);

    return {
      success: true,
      data: JSON.parse(JSON.stringify(listings)),
      total,
      status: 200,
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

export async function updateListingAgent(
  listingId: string,
  agentId: string
): Promise<ActionResponse<Listing>> {
  const user = await getUserBySessionEmail();

  if (!user?.data) {
    return {
      success: false,
      error: { message: "Utilisateur non autorisé" },
      status: 401,
    };
  }

  if (user.data.role !== "ADMIN") {
    return {
      success: false,
      error: { message: "Seul un administrateur peut affecter un bien" },
      status: 403,
    };
  }

  if (!Types.ObjectId.isValid(listingId) || !Types.ObjectId.isValid(agentId)) {
    return {
      success: false,
      error: { message: "Annonce ou responsable invalide" },
      status: 400,
    };
  }

  try {
    await dbConnect();

    const agent = await User.findOne({
      _id: agentId,
      role: { $in: ["AGENT", "ADMIN"] },
    }).select("_id");

    if (!agent) {
      return {
        success: false,
        error: { message: "Veuillez sélectionner un agent ou un admin valide" },
        status: 400,
      };
    }

    const listing = await Listing.findByIdAndUpdate(
      listingId,
      { agent: agent._id },
      { new: true }
    ).populate("agent", "firstname lastname email phone");

    if (!listing) {
      return {
        success: false,
        error: { message: "Annonce introuvable" },
        status: 404,
      };
    }

    revalidatePath(ROUTES.LISTINGS_DASHBOARD);
    revalidatePath(ROUTES.LISTING_DETAIL_DASHBOARD(listingId));
    revalidatePath(ROUTES.MES_BIENS);

    return {
      success: true,
      data: JSON.parse(JSON.stringify(listing)),
      status: 200,
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

export async function fetchListingById(
  listingId: string
): Promise<ActionResponse<Listing>> {
  try {
    // 1️⃣ Validate ObjectId
    if (!Types.ObjectId.isValid(listingId)) {
      return {
        success: false,
        error: { message: "ID d’annonce invalide" },
        status: 400,
      };
    }

    // 2️⃣ DB connection
    await dbConnect();

    // 3️⃣ Fetch listing
    const listing = await Listing.findById(listingId)
      .populate("agent", "firstname lastname email phone")
      .populate("sellerClient", "firstName lastName phone email")
      .lean();

    if (!listing) {
      return {
        success: false,
        error: { message: "Annonce introuvable" },
        status: 404,
      };
    }

    // 4️⃣ Return serialized data
    return {
      success: true,
      data: JSON.parse(JSON.stringify(listing)),
      status: 200,
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

export async function addListingDocuments(
  listingId: string,
  documents: ListingDocumentInput[]
): Promise<ActionResponse<Listing>> {
  try {
    if (!Types.ObjectId.isValid(listingId)) {
      return {
        success: false,
        error: { message: "ID d'annonce invalide" },
        status: 400,
      };
    }

    if (!documents.length) {
      return {
        success: false,
        error: { message: "Aucun document à ajouter" },
        status: 400,
      };
    }

    const user = await getUserBySessionEmail();
    if (!user?.data) {
      return {
        success: false,
        error: { message: "Utilisateur non autorisé" },
        status: 401,
      };
    }

    const uploadedBy = user.data._id;

    await dbConnect();

    const documentsToAdd = documents.map((document) => ({
      publicId: document.publicId,
      url: document.url,
      secureUrl: document.secureUrl,
      originalFilename: document.originalFilename,
      format: document.format,
      resourceType: document.resourceType,
      bytes: document.bytes,
      uploadedBy,
      uploadedAt: new Date(),
    }));

    const listing = await Listing.findByIdAndUpdate(
      listingId,
      { $push: { documents: { $each: documentsToAdd } } },
      { new: true }
    )
      .populate("agent", "firstname lastname email phone")
      .populate("sellerClient", "firstName lastName phone email")
      .lean();

    if (!listing) {
      return {
        success: false,
        error: { message: "Annonce introuvable" },
        status: 404,
      };
    }

    revalidatePath(ROUTES.LISTING_DETAIL_DASHBOARD(listingId));

    return {
      success: true,
      data: JSON.parse(JSON.stringify(listing)),
      status: 200,
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

export async function removeListingDocument(
  listingId: string,
  documentId: string
): Promise<ActionResponse<Listing>> {
  try {
    if (!Types.ObjectId.isValid(listingId) || !Types.ObjectId.isValid(documentId)) {
      return {
        success: false,
        error: { message: "ID invalide" },
        status: 400,
      };
    }

    const user = await getUserBySessionEmail();
    if (!user?.data) {
      return {
        success: false,
        error: { message: "Utilisateur non autorisé" },
        status: 401,
      };
    }

    await dbConnect();

    const listing = await Listing.findByIdAndUpdate(
      listingId,
      { $pull: { documents: { _id: new Types.ObjectId(documentId) } } },
      { new: true }
    )
      .populate("agent", "firstname lastname email phone")
      .populate("sellerClient", "firstName lastName phone email")
      .lean();

    if (!listing) {
      return {
        success: false,
        error: { message: "Annonce introuvable" },
        status: 404,
      };
    }

    revalidatePath(ROUTES.LISTING_DETAIL_DASHBOARD(listingId));

    return {
      success: true,
      data: JSON.parse(JSON.stringify(listing)),
      status: 200,
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}
/* -------------------------------- Views -------------------------------- */

export async function incrementListingViews(listingId: string) {
  try {
    await dbConnect();

    await Listing.findByIdAndUpdate(listingId, {
      $inc: { views: 1 },
    });

    revalidatePath(`/listings/${listingId}`);

    return { success: true };
  } catch (error) {
    console.error("Failed to increment listing views", error);
    return { success: false };
  }
}

/* -------------------------------- Likes -------------------------------- */

export async function incrementListingLikes(listingId: string) {
  try {
    await dbConnect();

    await Listing.findByIdAndUpdate(listingId, {
      $inc: { likes: 1 },
    });

    revalidatePath(`/listings/${listingId}`);

    return { success: true };
  } catch (error) {
    console.error("Failed to increment listing likes", error);
    return { success: false };
  }
}

export async function decrementListingLikes(listingId: string) {
  try {
    await dbConnect();

    await Listing.findByIdAndUpdate(listingId, {
      $inc: { likes: -1 },
    });

    revalidatePath(`/listings/${listingId}`);

    return { success: true };
  } catch (error) {
    console.error("Failed to decrement listing likes", error);
    return { success: false };
  }
}

export async function updateListingStatus(
  listingId: string,
  status: PropertyStatus
) {
  try {
    await dbConnect();

    const listing = await Listing.findById(listingId).select(
      "referenceCode description validationStatus"
    );

    if (!listing) {
      return { success: false };
    }

    const update: {
      status: PropertyStatus;
      referenceCode?: string;
      referenceGeneratedAt?: Date;
      description?: string;
    } = { status };

    // Only VALIDATED listings carry a referenceCode — APPROVED ones don't
    // need one, so skip regeneration for them.
    const expectedPrefix = getListingReferencePrefix(status);
    if (
      listing.validationStatus === "VALIDATED" &&
      !hasListingReferencePrefix(listing.referenceCode, expectedPrefix)
    ) {
      const referenceCode = await generateListingReferenceCode(expectedPrefix);
      update.referenceCode = referenceCode;
      update.referenceGeneratedAt = new Date();
      update.description =
        upsertReferenceInDescription(listing.description, referenceCode) ||
        listing.description;
    }

    await Listing.findByIdAndUpdate(listingId, update);
    revalidatePath(ROUTES.LISTINGS_DASHBOARD);
    revalidatePath(ROUTES.LISTING_DETAIL_DASHBOARD(listingId));
    return { success: true };
  } catch (error) {
    handleError(error);
    return { success: false };
  }
}

export async function updateListing(
  listingId: string,
  params: ListingInput
): Promise<ActionResponse<Listing>> {
  // 1. Validation + Authorization
  const validationResult = await action({
    params,
    schema: listingSchema,
    authorize: true,
  });

  if (validationResult instanceof Error) {
    return handleError(validationResult) as ErrorResponse;
  }

  // 2. Validate ObjectId
  if (!Types.ObjectId.isValid(listingId)) {
    return {
      success: false,
      error: { message: "ID d'annonce invalide" },
      status: 400,
    };
  }

  // 3. Get current user
  const user = await getUserBySessionEmail();
  if (!user?.data) {
    return {
      success: false,
      error: { message: "Utilisateur non autorisé" },
      status: 401,
    };
  }

  try {
    const parsedParams = listingSchema.parse(validationResult.params);

    const evaluation = parsedParams.evaluation
      ? {
          ...parsedParams.evaluation,
          positives:
            parsedParams.evaluation.positives?.map((p) => p.value) ?? [],
          negatives:
            parsedParams.evaluation.negatives?.map((n) => n.value) ?? [],
          evaluatedBy: user.data._id,
          evaluatedAt: parsedParams.evaluation.evaluatedAt ?? new Date(),
        }
      : undefined;

    await dbConnect();

    const normalizedPropertyTypeCustom =
      parsedParams.propertyType === "Autre"
        ? parsedParams.propertyTypeCustom?.trim()
        : undefined;

    const existingListing = (await Listing.findById(listingId)
      .select("referenceCode validationStatus")
      .lean()) as { referenceCode?: string; validationStatus?: string } | null;

    // Only VALIDATED listings carry a referenceCode — APPROVED ones don't
    // need one, so skip regeneration for them.
    const expectedPrefix = getListingReferencePrefix(parsedParams.status);
    let referenceCode = existingListing?.referenceCode;
    if (
      existingListing?.validationStatus === "VALIDATED" &&
      !hasListingReferencePrefix(referenceCode, expectedPrefix)
    ) {
      referenceCode = await generateListingReferenceCode(expectedPrefix);
    }

    const description = buildListingDescription(parsedParams, referenceCode);
    const referenceGeneratedAt =
      referenceCode !== existingListing?.referenceCode ? new Date() : undefined;

    const updated = await Listing.findByIdAndUpdate(
      listingId,
      {
        ...parsedParams,
        description,
        referenceCode,
        ...(referenceGeneratedAt && { referenceGeneratedAt }),
        propertyTypeCustom: normalizedPropertyTypeCustom,
        evaluation,
        // An omitted optional price must also clear a previously stored value.
        ...(parsedParams.offeredPrice === undefined && {
          $unset: { offeredPrice: 1 },
        }),
        // Do not overwrite agent or seller form-only fields
        sellerFirstName: undefined,
        sellerLastName: undefined,
        sellerPhone: undefined,
        sellerEmail: undefined,
      },
      { new: true }
    );

    if (!updated) {
      return {
        success: false,
        error: { message: "Annonce introuvable" },
        status: 404,
      };
    }

    revalidatePath(ROUTES.LISTINGS_DASHBOARD);
    revalidatePath(ROUTES.LISTING_DETAIL_DASHBOARD(listingId));

    return {
      success: true,
      data: JSON.parse(JSON.stringify(updated)),
      status: 200,
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

export async function toggleListingValidation(
  listingId: string,
  currentValidated: boolean
): Promise<ActionResponse<{ isValidated: boolean; referenceCode?: string }>> {
  try {
    if (!Types.ObjectId.isValid(listingId)) {
      return {
        success: false,
        error: { message: "ID d'annonce invalide" },
        status: 400,
      };
    }

    const user = await getUserBySessionEmail();
    if (!user?.data) {
      return {
        success: false,
        error: { message: "Utilisateur non autorisé" },
        status: 401,
      };
    }

    await dbConnect();

    const listing = await Listing.findById(listingId);
    if (!listing) {
      return {
        success: false,
        error: { message: "Annonce introuvable" },
        status: 404,
      };
    }

    if (!currentValidated) {
      // — Validate: assign reference code if not already set —
      let referenceCode = listing.referenceCode as string | undefined;
      let updatedDescription = listing.description;
      const prefix = getListingReferencePrefix(listing.status);

      if (!hasListingReferencePrefix(referenceCode, prefix)) {
        referenceCode = await generateListingReferenceCode(prefix);
        updatedDescription = upsertReferenceInDescription(
          listing.description,
          referenceCode
        );
      }

      await Listing.findByIdAndUpdate(listingId, {
        referenceCode,
        referenceGeneratedAt:
          referenceCode !== listing.referenceCode
            ? new Date()
            : listing.referenceGeneratedAt,
        isValidated: true,
        validationStatus: "VALIDATED",
        validatedAt: new Date(),
        validatedBy: user.data._id,
        description: updatedDescription || listing.description,
        pipelineStatus: "PHOTO_VISIT_PENDING",
      });

      revalidatePath(ROUTES.LISTINGS_DASHBOARD);
      revalidatePath(ROUTES.LISTING_DETAIL_DASHBOARD(listingId));
      revalidatePath(ROUTES.MES_BIENS);

      return {
        success: true,
        data: { isValidated: true, referenceCode },
        status: 200,
      };
    } else {
      // — Unvalidate: archive the listing (remove from main list) —
      await Listing.findByIdAndUpdate(listingId, {
        isValidated: false,
        archived: true,
        archivedAt: new Date(),
        pipelineStatus: "ARCHIVED",
        $unset: { validatedAt: 1, validatedBy: 1 },
      });

      revalidatePath(ROUTES.LISTINGS_DASHBOARD);
      revalidatePath(ROUTES.LISTING_DETAIL_DASHBOARD(listingId));
      revalidatePath(ROUTES.MES_BIENS);

      return {
        success: true,
        data: { isValidated: false },
        status: 200,
      };
    }
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

export async function approveListingWithoutReference(
  listingId: string
): Promise<ActionResponse<{ isValidated: boolean }>> {
  try {
    if (!Types.ObjectId.isValid(listingId)) {
      return {
        success: false,
        error: { message: "ID d'annonce invalide" },
        status: 400,
      };
    }

    const user = await getUserBySessionEmail();
    if (!user?.data) {
      return {
        success: false,
        error: { message: "Utilisateur non autorisé" },
        status: 401,
      };
    }

    await dbConnect();

    const listing = await Listing.findById(listingId);
    if (!listing) {
      return {
        success: false,
        error: { message: "Annonce introuvable" },
        status: 404,
      };
    }

    // APPROVED does not require a referenceCode — only VALIDATED does
    // (see toggleListingValidation), so no code is generated here.
    await Listing.findByIdAndUpdate(listingId, {
      isValidated: true,
      validationStatus: "APPROVED",
      validatedAt: new Date(),
      validatedBy: user.data._id,
      archived: false,
      pipelineStatus: "PHOTO_VISIT_PENDING",
      $unset: {
        archivedAt: 1,
      },
    });

    revalidatePath(ROUTES.LISTINGS_DASHBOARD);
    revalidatePath(ROUTES.LISTING_DETAIL_DASHBOARD(listingId));
    revalidatePath(ROUTES.MES_BIENS);

    return {
      success: true,
      data: { isValidated: true },
      status: 200,
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

export async function setListingNeutre(
  listingId: string
): Promise<ActionResponse<null>> {
  try {
    if (!Types.ObjectId.isValid(listingId)) {
      return {
        success: false,
        error: { message: "ID d'annonce invalide" },
        status: 400,
      };
    }

    const user = await getUserBySessionEmail();
    if (!user?.data) {
      return {
        success: false,
        error: { message: "Utilisateur non autorisé" },
        status: 401,
      };
    }

    await dbConnect();

    await Listing.findByIdAndUpdate(listingId, {
      isValidated: false,
      validationStatus: "NEUTRAL",
      archived: false,
      $unset: {
        validatedAt: 1,
        validatedBy: 1,
        archivedAt: 1,
        blockedUntil: 1,
        blockedForClient: 1,
      },
    });

    revalidatePath(ROUTES.LISTINGS_DASHBOARD);
    revalidatePath(ROUTES.MES_BIENS);

    return { success: true, data: null, status: 200 };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

export async function unarchiveListing(
  listingId: string
): Promise<ActionResponse<null>> {
  try {
    if (!Types.ObjectId.isValid(listingId)) {
      return {
        success: false,
        error: { message: "ID d'annonce invalide" },
        status: 400,
      };
    }

    const user = await getUserBySessionEmail();
    if (!user?.data) {
      return {
        success: false,
        error: { message: "Utilisateur non autorisé" },
        status: 401,
      };
    }

    await dbConnect();

    await Listing.findByIdAndUpdate(listingId, {
      archived: false,
      $unset: { archivedAt: 1 },
    });

    revalidatePath(ROUTES.LISTINGS_DASHBOARD);

    return { success: true, data: null, status: 200 };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

export async function deleteListing(
  listingId: string
): Promise<ActionResponse<null>> {
  try {
    if (!Types.ObjectId.isValid(listingId)) {
      return {
        success: false,
        error: { message: "ID d'annonce invalide" },
        status: 400,
      };
    }

    const user = await getUserBySessionEmail();
    if (!user?.data) {
      return {
        success: false,
        error: { message: "Utilisateur non autorisé" },
        status: 401,
      };
    }

    await dbConnect();

    const deleted = await Listing.findByIdAndDelete(listingId);
    if (!deleted) {
      return {
        success: false,
        error: { message: "Annonce introuvable" },
        status: 404,
      };
    }

    revalidatePath(ROUTES.LISTINGS_DASHBOARD);

    return { success: true, data: null, status: 200 };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

export async function fetchListingsBySellerClient(
  sellerClientId: string
): Promise<ActionResponse<Listing[]>> {
  try {
    if (!Types.ObjectId.isValid(sellerClientId)) {
      return {
        success: false,
        error: { message: "ID client invalide" },
        status: 400,
      };
    }

    await dbConnect();

    const listings = await Listing.find({ sellerClient: sellerClientId })
      .sort({ createdAt: -1 })
      .populate("agent", "name firstname lastname email phone")
      .lean();

    return {
      success: true,
      data: JSON.parse(JSON.stringify(listings)),
      status: 200,
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

export async function rebuildAllListingDescriptions(): Promise<
  ActionResponse<{ updated: number }>
> {
  try {
    const user = await getUserBySessionEmail();
    if (!user?.data) {
      return {
        success: false,
        error: { message: "Utilisateur non autorisé" },
        status: 401,
      };
    }

    await dbConnect();

    const listings = await Listing.find({}).lean();

    let updated = 0;
    for (const listing of listings) {
      const description = buildListingDescription(
        listing as unknown as ListingInput,
        listing.referenceCode
      );
      await Listing.findByIdAndUpdate(listing._id, { description });
      updated++;
    }

    revalidatePath(ROUTES.LISTINGS_DASHBOARD);

    return { success: true, data: { updated }, status: 200 };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

export async function toggleListingPublished(
  listingId: string,
  currentStatus: boolean
): Promise<ActionResponse<{ isPublished: boolean }>> {
  try {
    await dbConnect();
    const newStatus = !currentStatus;
    await Listing.findByIdAndUpdate(listingId, {
      isPublished: newStatus,
      publishedAt: newStatus ? new Date() : undefined,
    });
    revalidatePath(ROUTES.LISTINGS_DASHBOARD);
    return {
      success: true,
      data: { isPublished: newStatus },
      status: 200,
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

export async function setListingFeatured(
  listingId: string,
  isFeatured: boolean
): Promise<ActionResponse<{ isFeatured: boolean }>> {
  try {
    const user = await getUserBySessionEmail();

    if (!user.data || !isElevatedRole(user.data.role)) {
      return {
        success: false,
        error: { message: "Vous n’êtes pas autorisé à gérer les biens à la une." },
        status: 403,
      };
    }

    if (!Types.ObjectId.isValid(listingId)) {
      return {
        success: false,
        error: { message: "ID annonce invalide" },
        status: 400,
      };
    }

    await dbConnect();
    const listing = await Listing.findOneAndUpdate(
      {
        _id: listingId,
        isPublished: true,
        isValidated: true,
        archived: { $ne: true },
      },
      { isFeatured },
      { new: true }
    ).select("isFeatured");

    if (!listing) {
      return {
        success: false,
        error: { message: "Seules les annonces publiées et validées peuvent être mises à la une." },
        status: 400,
      };
    }

    revalidatePath(ROUTES.FEATURED_LISTINGS_DASHBOARD);
    revalidatePath(ROUTES.HOME);

    return { success: true, data: { isFeatured: listing.isFeatured }, status: 200 };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

/* ─────────────────────── Photo Visit ─────────────────────── */

export async function schedulePhotoVisit(
  params: PhotoVisitScheduleInput
): Promise<ActionResponse> {
  const validationResult = await action({
    params,
    schema: photoVisitScheduleSchema,
    authorize: true,
  });

  if (validationResult instanceof Error || !validationResult.params) {
    return handleError(validationResult) as ErrorResponse;
  }

  const user = await getUserBySessionEmail();
  if (!user?.data) {
    return { success: false, error: { message: "Non autorisé" }, status: 401 };
  }

  const { listingId, scheduledAt } = validationResult.params;

  if (!Types.ObjectId.isValid(listingId)) {
    return { success: false, error: { message: "ID annonce invalide" }, status: 400 };
  }

  try {
    const listing = await Listing.findByIdAndUpdate(
      listingId,
      { photoVisitScheduledAt: scheduledAt },
      { new: true }
    );

    if (!listing) {
      return { success: false, error: { message: "Annonce introuvable" }, status: 404 };
    }

    revalidatePath(ROUTES.LISTINGS_DASHBOARD);
    revalidatePath(ROUTES.LISTING_DETAIL_DASHBOARD(listingId));
    revalidatePath(ROUTES.MES_BIENS);

    return { success: true, status: 200 };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

export async function completePhotoVisit(
  params: PhotoVisitCompleteInput
): Promise<ActionResponse> {
  const validationResult = await action({
    params,
    schema: photoVisitCompleteSchema,
    authorize: true,
  });

  if (validationResult instanceof Error || !validationResult.params) {
    return handleError(validationResult) as ErrorResponse;
  }

  const user = await getUserBySessionEmail();
  if (!user?.data) {
    return { success: false, error: { message: "Non autorisé" }, status: 401 };
  }

  const { listingId, sellerMotivation, listingAgentEvalPrice, photoVisitNotes } =
    validationResult.params;

  if (!Types.ObjectId.isValid(listingId)) {
    return { success: false, error: { message: "ID annonce invalide" }, status: 400 };
  }

  try {
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return { success: false, error: { message: "Annonce introuvable" }, status: 404 };
    }

    // Only the listing agent or a manager can complete the photo visit
    const isManager = isElevatedRole(user.data.role);
    const isListingAgent = listing.agent?.toString() === user.data._id?.toString();

    if (!isManager && !isListingAgent) {
      return {
        success: false,
        error: { message: "Seul l'agent listing peut compléter la visite photo" },
        status: 403,
      };
    }

    await Listing.findByIdAndUpdate(listingId, {
      pipelineStatus: "ACTIVE",
      photoVisitCompletedAt: new Date(),
      sellerMotivation,
      listingAgentEvalPrice,
      photoVisitNotes,
    });

    revalidatePath(ROUTES.LISTINGS_DASHBOARD);
    revalidatePath(ROUTES.LISTING_DETAIL_DASHBOARD(listingId));
    revalidatePath(ROUTES.MES_BIENS);

    return { success: true, status: 200 };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

/* ─────────────────────── Key Availability ─────────────────────── */

export async function updateKeyAvailability(
  params: KeyAvailabilityInput
): Promise<ActionResponse> {
  const validationResult = await action({
    params,
    schema: keyAvailabilitySchema,
    authorize: true,
  });

  if (validationResult instanceof Error || !validationResult.params) {
    return handleError(validationResult) as ErrorResponse;
  }

  const user = await getUserBySessionEmail();
  if (!user?.data) {
    return { success: false, error: { message: "Non autorisé" }, status: 401 };
  }

  const { listingId, keyAvailable } = validationResult.params;

  if (!Types.ObjectId.isValid(listingId)) {
    return { success: false, error: { message: "ID annonce invalide" }, status: 400 };
  }

  try {
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return { success: false, error: { message: "Annonce introuvable" }, status: 404 };
    }

    const isManager = isElevatedRole(user.data.role);
    const isListingAgent = listing.agent?.toString() === user.data._id?.toString();

    if (!isManager && !isListingAgent) {
      return {
        success: false,
        error: { message: "Seul l'agent listing peut modifier la disponibilité des clés" },
        status: 403,
      };
    }

    await Listing.findByIdAndUpdate(listingId, { keyAvailable });

    revalidatePath(ROUTES.LISTINGS_DASHBOARD);
    revalidatePath(ROUTES.LISTING_DETAIL_DASHBOARD(listingId));

    return { success: true, status: 200 };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

/* ─────────────────────── Submit for Validation ─────────────────────── */

export async function submitListingForValidation(
  listingId: string
): Promise<ActionResponse> {
  const user = await getUserBySessionEmail();
  if (!user?.data) {
    return { success: false, error: { message: "Non autorisé" }, status: 401 };
  }

  if (!Types.ObjectId.isValid(listingId)) {
    return { success: false, error: { message: "ID annonce invalide" }, status: 400 };
  }

  try {
    await dbConnect();

    const listing = await Listing.findById(listingId);
    if (!listing) {
      return { success: false, error: { message: "Annonce introuvable" }, status: 404 };
    }

    if (listing.pipelineStatus !== "DRAFT") {
      return {
        success: false,
        error: { message: "Seules les annonces en brouillon peuvent être soumises à validation" },
        status: 409,
      };
    }

    await Listing.findByIdAndUpdate(listingId, {
      pipelineStatus: "PENDING_VALIDATION",
    });

    revalidatePath(ROUTES.LISTINGS_DASHBOARD);
    revalidatePath(ROUTES.LISTING_DETAIL_DASHBOARD(listingId));

    return { success: true, status: 200 };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

export interface ActiveListingWithVisits {
  _id: string;
  referenceCode?: string;
  title?: string;
  pipelineStatus?: string;
  blockedUntil?: string | Date;
  location?: { city?: string; address?: string };
  propertyType?: string;
  price?: number;
  visits: Array<{
    _id: string;
    scheduledAt: string | Date;
    status: string;
    client?: {
      _id: string;
      referenceCode: string;
      firstName?: string;
      lastName?: string;
      phone: string;
    };
  }>;
}

export interface MyApprovedListing {
  _id: string;
  title?: string;
  pipelineStatus: string;
  photoVisitScheduledAt?: string | Date;
  location?: { city?: string };
  propertyType?: string;
}

export async function fetchMyApprovedListings(): Promise<
  ActionResponse<MyApprovedListing[]>
> {
  const user = await getUserBySessionEmail();
  if (!user?.data) {
    return { success: false, error: { message: "Non autorisé" }, status: 401 };
  }

  try {
    await dbConnect();

    const listings = await Listing.find({
      agent: user.data._id,
      isValidated: true,
      archived: { $ne: true },
      pipelineStatus: "PHOTO_VISIT_PENDING",
      $or: [
        { referenceCode: { $exists: false } },
        { referenceCode: null },
        { referenceCode: "" },
      ],
    })
      .select(
        "title pipelineStatus photoVisitScheduledAt location propertyType"
      )
      .sort({ validatedAt: -1, createdAt: -1 })
      .lean();

    return {
      success: true,
      data: JSON.parse(JSON.stringify(listings)),
      status: 200,
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

export async function fetchMyActiveListings(): Promise<
  ActionResponse<ActiveListingWithVisits[]>
> {
  const user = await getUserBySessionEmail();
  if (!user?.data) {
    return { success: false, error: { message: "Non autorisé" }, status: 401 };
  }

  try {
    await dbConnect();

    const activeNegotiations = await Negotiation.find({
      agent: user.data._id,
      status: { $in: ["ACTIVE", "CLOSING"] },
    })
      .select("listing")
      .lean();

    const negotiatedListingIds = activeNegotiations.map((n) => n.listing);

    const ownershipFilter: FilterQuery<Listing> =
      negotiatedListingIds.length > 0
        ? {
            $or: [
              { agent: user.data._id },
              { _id: { $in: negotiatedListingIds } },
            ],
          }
        : { agent: user.data._id };

    const listings = await Listing.find({
      ...ownershipFilter,
      pipelineStatus: { $in: ["ACTIVE", "UNDER_NEGOTIATION", "CLOSING"] },
      archived: { $ne: true },
    })
      .select(
        "referenceCode title pipelineStatus blockedUntil location propertyType price"
      )
      .lean();

    if (!listings.length) {
      return { success: true, data: [], status: 200 };
    }

    const listingIds = listings.map((l) => l._id);

    const visits = await Visit.find({
      listing: { $in: listingIds },
      status: "SCHEDULED",
    })
      .populate("client", "referenceCode firstName lastName phone")
      .select("listing scheduledAt status client")
      .sort({ scheduledAt: 1 })
      .lean();

    const visitsByListing: Record<string, typeof visits> = {};
    for (const v of visits) {
      const lid = v.listing.toString();
      if (!visitsByListing[lid]) visitsByListing[lid] = [];
      visitsByListing[lid].push(v);
    }

    const data = listings.map((l) => ({
      ...l,
      _id: String(l._id),
      visits: (visitsByListing[String(l._id)] ?? []).map((v) => ({
        _id: String(v._id),
        scheduledAt: v.scheduledAt,
        status: v.status,
        client: v.client as ActiveListingWithVisits["visits"][number]["client"],
      })),
    }));

    return {
      success: true,
      data: JSON.parse(JSON.stringify(data)),
      status: 200,
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}
