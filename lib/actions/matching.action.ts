"use server";

import { Client, Listing } from "@/models";
import dbConnect from "@/lib/mongoose";
import handleError from "@/lib/handlers/error";

// ─── Helpers ────────────────────────────────────────────────────────────────

type BudgetWindow = {
  targetBudget: number;
  min: number;
  max: number;
  exactMin: number;
  exactMax: number;
};

function getBudgetWindow(client: Client): BudgetWindow | null {
  const budgetReference =
    client.budgetMax !== undefined
      ? Number(client.budgetMax)
      : client.budgetMin !== undefined
        ? Number(client.budgetMin)
        : undefined;

  if (budgetReference === undefined || isNaN(budgetReference)) {
    return null;
  }

  return {
    targetBudget: budgetReference,
    min: Math.max(0, budgetReference * 0.85),
    max: budgetReference * 1.35,
    exactMin: client.budgetMin !== undefined ? Number(client.budgetMin) : 0,
    exactMax:
      client.budgetMax !== undefined
        ? Number(client.budgetMax)
        : Number.POSITIVE_INFINITY,
  };
}

function getPriceScore(price: number, window: BudgetWindow): number {
  if (window.exactMin == 0) window.exactMin = window.targetBudget * 0.8;
  if (price >= window.exactMin && price <= window.exactMax) {
    return 2;
  }

  if (price < window.min) {
    return 0;
  } else {
    return 1;
  }
}

function getAreaScore(listing: Listing, client: Client): number {
  if (client.wantedArea === undefined) {
    return 0;
  }

  const area = Number(listing.features.area);
  const targetArea = Number(client.wantedArea);

  if (isNaN(area) || isNaN(targetArea) || targetArea <= 0) {
    return 0;
  }

  const exactLower = targetArea * 0.85;
  const exactUpper = targetArea * 1.15;
  const toleranceLower = targetArea * 0.65;
  const toleranceUpper = targetArea * 1.35;

  if (area >= exactLower && area <= exactUpper) {
    return 2;
  }

  if (area >= toleranceLower && area <= toleranceUpper) {
    return 1;
  }

  return 0;
}

function scoreListing(listing: Listing, client: Client): number {
  let score = 0;

  if (
    client.city &&
    listing.location.city.toLowerCase() === client.city.toLowerCase()
  ) {
    score += 2;
  }

  if (
    client.wantedPropertyType &&
    listing.propertyType.toLowerCase() ===
      client.wantedPropertyType.toLowerCase()
  ) {
    score += 2;
  }

  const price = Number(listing.price);
  const budgetWindow = getBudgetWindow(client);
  if (!isNaN(price) && budgetWindow) {
    score += getPriceScore(price, budgetWindow);
  }

  score += getAreaScore(listing, client);

  if (
    client.rooms !== undefined &&
    listing.features.bedrooms === client.rooms
  ) {
    score += 3;
  }

  return score;
}

function scoreClient(
  client: Client & {
    wantedPropertyType?: string;
    rooms?: number;
    city?: string;
    budgetMin?: number;
    budgetMax?: number;
  },
  listing: Listing
): number {
  let score = 0;

  if (
    client.city &&
    listing.location.city.toLowerCase() === client.city.toLowerCase()
  ) {
    score += 2;
  }

  if (
    client.wantedPropertyType &&
    listing.propertyType.toLowerCase() ===
      client.wantedPropertyType.toLowerCase()
  ) {
    score += 2;
  }

  const price = Number(listing.price);
  const budgetWindow = getBudgetWindow(client);
  if (!isNaN(price) && budgetWindow) {
    score += getPriceScore(price, budgetWindow);
  }

  score += getAreaScore(listing, client);

  if (
    client.rooms !== undefined &&
    listing.features.bedrooms === client.rooms
  ) {
    score += 3;
  }

  return score;
}

// ─── Actions ─────────────────────────────────────────────────────────────────

export type MatchedListing = Listing & {
  matchScore: number;
  overBudget?: boolean;
};
export type MatchedClient = Client & { matchScore: number };

/**
 * Given a BUYER or RENTER client, return up to 8 listings ranked by match score.
 */
export async function matchClientToListings(
  clientId: string
): Promise<ActionResponse<MatchedListing[]>> {
  try {
    await dbConnect();

    const client = await Client.findById(clientId).lean<Client>();
    if (!client) {
      return { success: false, error: { message: "Client introuvable" } };
    }

    if (client.type !== "BUYER" && client.type !== "RENTER") {
      return { success: true, data: [] };
    }

    const statusFilter = client.type === "BUYER" ? "En Vente" : "En Location";

    const listings = await Listing.find({ status: statusFilter })
      .select(
        "referenceCode title propertyType location price features.bedrooms features.area evaluation.finalScore isPublished"
      )
      .lean<Listing[]>();

    const budgetWindow = getBudgetWindow(client);
    const scored: MatchedListing[] = listings
      .map((l) => {
        const price = Number(l.price);
        const budgetMax =
          client.budgetMax !== undefined ? Number(client.budgetMax) : undefined;
        const overBudget =
          budgetMax !== undefined &&
          !isNaN(price) &&
          price > budgetMax &&
          price <= budgetMax * 1.35;
        return { ...l, matchScore: scoreListing(l, client), overBudget };
      })
      .filter((l) => {
        const price = Number(l.price);
        const withinBudgetWindow =
          budgetWindow === null ||
          (!isNaN(price) &&
            price >= budgetWindow.min &&
            price <= budgetWindow.max);
        return l.matchScore >= 1 && withinBudgetWindow;
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 20);

    return { success: true, data: JSON.parse(JSON.stringify(scored)) };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

/**
 * Given a listing, return up to 8 BUYER/RENTER clients ranked by match score.
 */
export async function matchListingToClients(
  listingId: string
): Promise<ActionResponse<MatchedClient[]>> {
  try {
    await dbConnect();

    const listing = await Listing.findById(listingId).lean<Listing>();
    if (!listing) {
      return { success: false, error: { message: "Annonce introuvable" } };
    }

    const typeFilter =
      listing.status === "En Vente"
        ? ["BUYER"]
        : listing.status === "En Location"
          ? ["RENTER"]
          : ["BUYER", "RENTER"];

    const clients = await Client.find({
      archived: false,
      type: { $in: typeFilter },
    })
      .select(
        "referenceCode firstName lastName type city wantedPropertyType rooms budgetMin budgetMax phone"
      )
      .lean<Client[]>();

    const budgetWindowCache = clients.reduce<
      Record<string, ReturnType<typeof getBudgetWindow>>
    >(
      (acc, client) => {
        acc[client._id] = getBudgetWindow(client);
        return acc;
      },
      {} as Record<string, ReturnType<typeof getBudgetWindow>>
    );

    const scored: MatchedClient[] = clients
      .map((c) => ({ ...c, matchScore: scoreClient(c, listing) }))
      .filter((c) => {
        const budgetWindow = budgetWindowCache[c._id];
        const price = Number(listing.price);
        const withinBudgetWindow =
          budgetWindow === null ||
          (!isNaN(price) &&
            price >= budgetWindow.min &&
            price <= budgetWindow.max);
        return c.matchScore >= 1 && withinBudgetWindow;
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 8);

    return { success: true, data: JSON.parse(JSON.stringify(scored)) };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}
