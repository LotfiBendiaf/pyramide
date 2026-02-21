"use server";

import { Client, Listing } from "@/models";
import dbConnect from "@/lib/mongoose";
import handleError from "@/lib/handlers/error";

// ─── Helpers ────────────────────────────────────────────────────────────────

function scoreListing(listing: Listing, client: Client): number {
  let score = 0;

  if (
    client.city &&
    listing.location.city.toLowerCase() === client.city.toLowerCase()
  ) {
    score += 3;
  }

  if (
    client.wantedPropertyType &&
    listing.propertyType.toLowerCase() ===
      client.wantedPropertyType.toLowerCase()
  ) {
    score += 3;
  }

  const price = listing.price;
  if (client.budgetMin !== undefined || client.budgetMax !== undefined) {
    const aboveMin = client.budgetMin === undefined || price >= client.budgetMin;
    const belowMax = client.budgetMax === undefined || price <= client.budgetMax;
    if (aboveMin && belowMax) score += 3;
  }

  if (client.rooms !== undefined && listing.features.bedrooms === client.rooms) {
    score += 2;
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
    score += 3;
  }

  if (
    client.wantedPropertyType &&
    listing.propertyType.toLowerCase() ===
      client.wantedPropertyType.toLowerCase()
  ) {
    score += 3;
  }

  const price = listing.price;
  if (client.budgetMin !== undefined || client.budgetMax !== undefined) {
    const aboveMin = client.budgetMin === undefined || price >= client.budgetMin;
    const belowMax = client.budgetMax === undefined || price <= client.budgetMax;
    if (aboveMin && belowMax) score += 3;
  }

  if (client.rooms !== undefined && listing.features.bedrooms === client.rooms) {
    score += 2;
  }

  return score;
}

// ─── Actions ─────────────────────────────────────────────────────────────────

export type MatchedListing = Listing & { matchScore: number };
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

    const statusFilter =
      client.type === "BUYER" ? "En Vente" : "En Location";

    const listings = await Listing.find({ status: statusFilter })
      .select(
        "referenceCode title propertyType location price features.bedrooms evaluation.finalScore isPublished"
      )
      .lean<Listing[]>();

    const scored: MatchedListing[] = listings
      .map((l) => ({ ...l, matchScore: scoreListing(l, client) }))
      .filter((l) => l.matchScore >= 1)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 8);

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

    const scored: MatchedClient[] = clients
      .map((c) => ({ ...c, matchScore: scoreClient(c, listing) }))
      .filter((c) => c.matchScore >= 1)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 8);

    return { success: true, data: JSON.parse(JSON.stringify(scored)) };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}
