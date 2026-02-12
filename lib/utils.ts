import { ClientType } from "@/models/client.model";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(
  value: number,
  locale: string = "fr-DZ",
  currency: string = "DZD"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(value);
}

// PDF ONLY
export function formatPricePdf(
  value: number,
  currency: string = "DZD"
): string {
  const formatted = value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  return `${formatted} ${currency}`;
}

export function formatTimestamp(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getTimeAgo(date: Date | string): string {
  const now = new Date();
  const target = typeof date === "string" ? new Date(date) : date;
  const diff = Math.floor((now.getTime() - target.getTime()) / 1000); // in seconds

  if (diff < 60) return "Il y a un instant";
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} minute(s)`;
  if (diff < 86400) return `Il y a  ${Math.floor(diff / 3600)} heure(s)`;
  if (diff < 604800) return `Il y a  ${Math.floor(diff / 86400)} jour(s)`;
  if (diff < 2592000) return `Il y a  ${Math.floor(diff / 604800)} semaine(s)`;
  if (diff < 31536000) return `Il y a  ${Math.floor(diff / 2592000)} mois`;

  return `${Math.floor(diff / 31536000)} year(s) ago`;
}

// lib/utils/date.ts
export function formatDate(
  date: string | Date,
  locale: string = "fr-FR"
): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function clientPrefix(type: ClientType) {
  return {
    BUYER: "BUY",
    RENTER: "RENT",
    SELLER: "SELL",
    INVESTOR: "INV",
  }[type];
}

export type ListingStatus =
  | "En Vente"
  | "En Location"
  | "Vendu"
  | "Loué"
  | "Retiré";
export type PropertyType =
  | "Appartement"
  | "Maison"
  | "Villa"
  | "Studio"
  | "Terrain"
  | "Commercial";

export function listingPrefix(
  status: ListingStatus,
  propertyType: PropertyType
) {
  const statusPrefix = status === "En Vente" ? "V" : "L";
  const propertyPrefix: Record<PropertyType, string> = {
    Appartement: "A",
    Maison: "M",
    Villa: "V",
    Studio: "S",
    Terrain: "T",
    Commercial: "C",
  };
  return `${statusPrefix}${propertyPrefix[propertyType]}`;
}

/**
 * Converts a price in DZD to a human-readable format using Algerian naming conventions
 * 1 DZD = 100 centimes
 * Examples:
 * - 1,000,000 DZD → "100 millions centimes"
 * - 10,000,000 DZD → "1 milliard centimes"
 * - 500,000 DZD → "50 millions centimes"
 * - 50,000,000 DZD → "5 milliards centimes"
 */
export function formatPriceAlgeria(value: number): string {
  if (value === 0) return "0 centimes";

  // Convert DZD to centimes (1 DZD = 100 centimes)
  const centimes = value * 100;

  // 1 billion centimes = 1,000,000,000 centimes
  const billion = 1_000_000_000;
  // 1 million centimes = 1,000,000 centimes
  const million = 1_000_000;

  if (centimes >= billion) {
    const billions = centimes / billion;
    return billions % 1 === 0
      ? `${Math.round(billions)} Milliards centimes`
      : `${billions.toFixed(2)} Milliards centimes`;
  }

  if (centimes >= million) {
    const millions = centimes / million;
    return millions % 1 === 0
      ? `${Math.round(millions)} Millions centimes`
      : `${millions.toFixed(2)} Millions centimes`;
  }

  // For values less than 1 million centimes, use comma-separated format
  return `${centimes.toLocaleString("fr-DZ")} centimes`;
}
