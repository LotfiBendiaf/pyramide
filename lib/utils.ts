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
