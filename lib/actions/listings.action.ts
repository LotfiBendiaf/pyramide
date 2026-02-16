"use server";

import { Listing, Client } from "@/models";
import { getUserBySessionEmail } from "../getUserBySessionEmail";
import action from "../handlers/action";
import handleError from "../handlers/error";
import { ListingInput, listingSchema } from "../validators/listing";
import dbConnect from "../mongoose";
import { FilterQuery, Types } from "mongoose";
import { revalidatePath } from "next/cache";
import { PropertyStatus } from "@/constants/values";
import ROUTES from "@/constants/routes";
import {
  listingPrefix,
  ListingStatus,
  PropertyType,
  clientPrefix,
  formatPriceAlgeria,
} from "../utils";

function buildListingDescription(
  params: ListingInput,
  referenceCode: string
): string {
  const statusLine =
    params.status === "En Location"
      ? "𝗣𝗬𝗥𝗔𝗠𝗜𝗗𝗘 𝗜𝗠𝗠𝗢𝗕𝗜𝗟𝗜𝗘𝗥 met en location"
      : "𝗣𝗬𝗥𝗔𝗠𝗜𝗗𝗘 𝗜𝗠𝗠𝗢𝗕𝗜𝗟𝗜𝗘𝗥 met en vente";

  const typeLabel = params.propertyTypeCustom?.trim() || params.propertyType;
  const lowerType = typeLabel.toLowerCase();
  const article =
    lowerType.startsWith("maison") || lowerType.startsWith("villa")
      ? "Une"
      : "Un";
  const situe = article === "Une" ? "située" : "situé";
  const locationLabel =
    params.location?.district?.trim() ||
    params.location?.city?.trim() ||
    params.location?.address?.trim() ||
    "";
  const areaLabel = params.features.area ? `${params.features.area} m²` : "";
  const etage = params.features.etage;
  const etageSuffix = etage === 1 ? "er" : "e";
  const elevatorText = params.features.elevator ? " avec ascenseur" : "";
  const etageLine =
    etage !== undefined
      ? `Étage : ${etage}${etageSuffix}${elevatorText}`
      : undefined;

  const priceLabel = `${formatPriceAlgeria(params.price).replace(".", ",")} DA`;

  const intro =
    locationLabel && areaLabel
      ? `${article} ${lowerType} de ${areaLabel}, ${situe}${
          etage !== undefined ? ` au ${etage}${etageSuffix} étage` : ""
        } à ${locationLabel}.`
      : `${article} ${lowerType} spacieux et lumineux.`;

  const details = [
    `Réf : ${referenceCode}`,
    `Type : ${typeLabel}`,
    areaLabel ? `Surface : ${areaLabel}` : undefined,
    etageLine,
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
    "Pour plus d’informations ou pour organiser une visite :\n0779 07 97 06 / 0792 11 65 96 / 0770 82 33 00";

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
    schema: listingSchema,
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

    // 3. Generate reference code (VA-0001, LV-0001, etc.)
    const { status, propertyType } = parsedParams;
    const isVente = status === "En Vente";
    // Count listings with same transaction type (Vente or Location)
    const count = await Listing.countDocuments({
      status: {
        $in: isVente ? ["En Vente", "Vendu"] : ["En Location", "Loué"],
      },
    });
    const prefix = listingPrefix(
      status as ListingStatus,
      propertyType as PropertyType
    );
    const referenceCode = `${prefix}-${String(count + 1).padStart(4, "0")}`;

    // 4. Create seller client if seller information is provided
    let sellerClientId: Types.ObjectId | undefined = undefined;
    const { sellerFirstName, sellerLastName, sellerPhone, sellerEmail } =
      parsedParams;

    if (sellerFirstName && sellerLastName && sellerPhone) {
      // Generate seller client reference code
      const sellerCount = await Client.countDocuments({ type: "SELLER" });
      const sellerReferenceCode = `${clientPrefix("SELLER")}-${String(
        sellerCount + 1
      ).padStart(3, "0")}`;

      // Create seller client
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

      if (sellerClient) {
        sellerClientId = sellerClient._id as Types.ObjectId;
      }
    }

    // 5. Create listing with seller client reference
    const description =
      parsedParams.description?.trim() ||
      buildListingDescription(parsedParams, referenceCode);

    const normalizedPropertyTypeCustom =
      parsedParams.propertyType === "Autre"
        ? parsedParams.propertyTypeCustom?.trim()
        : undefined;

    const listing = await Listing.create({
      ...parsedParams,
      description,
      propertyTypeCustom: normalizedPropertyTypeCustom,
      referenceCode,
      evaluation,
      agent: user.data._id,
      sellerClient: sellerClientId,
    });

    if (!listing) {
      throw new Error("Échec de la création de l'annonce");
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
  isPublished?: boolean;
  status?: "En Vente" | "En Location";
  city?: string;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  limit?: number;
  page?: number;
  isPremium?: boolean;
  minScore?: number;
}

export async function fetchListings(
  params: FetchListingsParams = {}
): Promise<ActionResponse<Listing[]>> {
  try {
    const {
      isPublished,
      status,
      city,
      propertyType,
      minPrice,
      maxPrice,
      bedrooms,
      limit = 12,
      page = 1,
      isPremium,
      minScore,
    } = params;

    const skip = (page - 1) * limit;

    const query: FilterQuery<Listing> = {};

    if (isPublished !== undefined) {
      query.isPublished = isPublished;
    }

    if (status) query.status = status;
    if (propertyType) query.propertyType = propertyType;
    if (city) query["location.city"] = city;
    if (isPremium) query["isPremium"] = isPremium;
    if (minScore !== undefined) {
      query["evaluation.finalScore"] = { $gte: minScore };
    }

    if (bedrooms !== undefined) {
      query["features.bedrooms"] = { $gte: bedrooms };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = minPrice;
      if (maxPrice !== undefined) query.price.$lte = maxPrice;
    }

    await dbConnect();

    // 2. Fetch listings
    const listings = await Listing.find(query)
      .sort({ createdAt: -1 })
      .populate("agent", "name firstname lastname email phone")
      .skip(skip)
      .limit(limit)
      .lean();
    // .populate("agent", "name email");

    return {
      success: true,
      data: JSON.parse(JSON.stringify(listings)),
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
    await Listing.findByIdAndUpdate(listingId, { status });
    revalidatePath(ROUTES.LISTINGS_DASHBOARD);
    return { success: true };
  } catch (error) {
    handleError(error);
    return { success: false };
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
