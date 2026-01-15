"use server";

import { Listing } from "@/models";
import { getUserBySessionEmail } from "../getUserBySessionEmail";
import action from "../handlers/action";
import handleError from "../handlers/error";
import { ListingInput, listingSchema } from "../validators/listing";
import dbConnect from "../mongoose";
import { FilterQuery } from "mongoose";
import { revalidatePath } from "next/cache";

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
    // 3. Create listing
    const listing = await Listing.create({
      ...validationResult.params,
      agent: user.data._id, // Best practice: store only ObjectId
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
  published?: boolean;
  status?: "À Vendre" | "À Louer";
  city?: string;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  limit?: number;
  page?: number;
  isPremium?: boolean;
}

export async function fetchListings(
  params: FetchListingsParams = {}
): Promise<ActionResponse<Listing[]>> {
  try {
    const {
      published = true,
      status,
      city,
      propertyType,
      minPrice,
      maxPrice,
      bedrooms,
      limit = 12,
      page = 1,
      isPremium,
    } = params;

    const skip = (page - 1) * limit;

    const query: FilterQuery<Listing> = {
      published,
    };

    if (status) query.status = status;
    if (propertyType) query.propertyType = propertyType;
    if (city) query["location.city"] = city;
    if (isPremium) query["isPremium"] = isPremium;

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
