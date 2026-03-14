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
import { clientPrefix, formatPriceAlgeria } from "../utils";

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

  const priceLabel = `${formatPriceAlgeria(params.price ?? 0).replace(".", ",")} DA`;

  const intro =
    locationLabel && areaLabel
      ? `${article} ${lowerType} de ${areaLabel}, ${situe}${
          etage !== undefined ? ` au ${etage}${etageSuffix} étage` : ""
        } à ${locationLabel}.`
      : `${article} ${lowerType} spacieux et lumineux.`;

  const details = [
    referenceCode ? `Réf : ${referenceCode}` : undefined,
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

    // 3. Create seller client if seller information is provided
    let sellerClientId: Types.ObjectId | undefined = undefined;
    const { sellerFirstName, sellerLastName, sellerPhone, sellerEmail } =
      parsedParams;

    if (sellerPhone) {
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

    // 4. Create listing (no reference code yet — assigned on validation)
    const description =
      parsedParams.description?.trim() || buildListingDescription(parsedParams);

    const normalizedPropertyTypeCustom =
      parsedParams.propertyType === "Autre"
        ? parsedParams.propertyTypeCustom?.trim()
        : undefined;

    const listing = await Listing.create({
      ...parsedParams,
      description,
      propertyTypeCustom: normalizedPropertyTypeCustom,
      evaluation,
      agent: user.data._id,
      sellerClient: sellerClientId,
      isValidated: false,
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
  isValidated?: boolean;
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
  search?: string;
}

export async function fetchListings(
  params: FetchListingsParams = {}
): Promise<ActionResponse<Listing[]>> {
  try {
    const {
      isPublished,
      isValidated,
      status,
      city,
      propertyType,
      minPrice,
      maxPrice,
      bedrooms,
      limit,
      page = 1,
      isPremium,
      minScore,
      search,
    } = params;

    const skip = limit ? (page - 1) * limit : 0;

    const query: FilterQuery<Listing> = {};

    if (isPublished !== undefined) {
      query.isPublished = isPublished;
    }

    if (isValidated !== undefined) {
      query.isValidated = isValidated;
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

    if (search) {
      const regex = new RegExp(search, "i");
      query.$or = [
        { referenceCode: regex },
        { title: regex },
        { "location.city": regex },
        { "location.district": regex },
        { "location.address": regex },
        { "sellerClient.firstName": regex },
        { "sellerClient.lastName": regex },
        { "sellerClient.email": regex },
        { "sellerClient.phone": regex },
      ];
    }

    await dbConnect();

    // 2. Fetch listings and total count in parallel
    const [listings, total] = await Promise.all([
      Listing.find(query)
        .sort({ createdAt: -1 })
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

    const updated = await Listing.findByIdAndUpdate(
      listingId,
      {
        ...parsedParams,
        propertyTypeCustom: normalizedPropertyTypeCustom,
        evaluation,
        // Do not overwrite agent or referenceCode
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

      if (!referenceCode) {
        const { status } = listing;
        const isVente = status === "En Vente";
        const prefix = isVente ? "V" : "L";
        // Find the highest existing reference number for this prefix
        const lastListing = (await Listing.findOne({
          referenceCode: { $regex: `^${prefix}-` },
        })
          .sort({ referenceCode: -1 })
          .select("referenceCode")
          .lean()) as { referenceCode?: string } | null;
        const lastNumber = lastListing?.referenceCode
          ? parseInt(lastListing.referenceCode.split("-")[1], 10)
          : 0;
        referenceCode = `${prefix}-${String(lastNumber + 1).padStart(7, "0")}`;

        const descriptionHasRef = listing.description?.includes("Réf :");
        if (!descriptionHasRef) {
          updatedDescription = listing.description?.replace(
            /^([\s\S]*?)(Type :)/m,
            `$1Réf : ${referenceCode}\n$2`
          );
        }
      }

      await Listing.findByIdAndUpdate(listingId, {
        referenceCode,
        isValidated: true,
        validatedAt: new Date(),
        validatedBy: user.data._id,
        description: updatedDescription || listing.description,
      });

      revalidatePath(ROUTES.LISTINGS_DASHBOARD);
      revalidatePath(ROUTES.LISTING_DETAIL_DASHBOARD(listingId));

      return {
        success: true,
        data: { isValidated: true, referenceCode },
        status: 200,
      };
    } else {
      // — Unvalidate: keep reference code, just flip the flag —
      await Listing.findByIdAndUpdate(listingId, {
        isValidated: false,
        $unset: { validatedAt: 1, validatedBy: 1 },
      });

      revalidatePath(ROUTES.LISTINGS_DASHBOARD);
      revalidatePath(ROUTES.LISTING_DETAIL_DASHBOARD(listingId));

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
