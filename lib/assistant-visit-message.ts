import { normalizePhoneKey } from "@/lib/phone";

export type VisitMessageDraft = {
  phone: string | null;
  message: string;
};

export function buildVisitMessage(
  status: "confirmed" | "cancelled" | "rescheduled",
  client: { firstName?: string; phone?: string; phone2?: string } | undefined,
  property: string,
  scheduledAt: Date,
): VisitMessageDraft {
  const phone = [client?.phone, client?.phone2].map(normalizePhoneKey)
    .find((number) => number && /^\d{8,15}$/.test(number));
  const day = new Intl.DateTimeFormat("fr-DZ", {
    timeZone: "Africa/Algiers", weekday: "long", day: "numeric", month: "long", year: "numeric",
  }).format(scheduledAt);
  const time = new Intl.DateTimeFormat("fr-DZ", {
    timeZone: "Africa/Algiers", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).format(scheduledAt);
  const hello = client?.firstName ? `Bonjour ${client.firstName},` : "Bonjour,";
  const update = status === "confirmed"
    ? `Nous vous confirmons votre visite du bien « ${property} » le ${day} à ${time} (heure d’Alger).`
    : status === "rescheduled"
      ? `Votre visite du bien « ${property} » est déplacée au ${day} à ${time} (heure d’Alger). Merci de nous indiquer si ce nouvel horaire vous convient.`
      : `Votre visite du bien « ${property} », prévue le ${day} à ${time} (heure d’Alger), est annulée. Si vous souhaitez convenir d’un autre créneau, vous pouvez répondre à ce message.`;
  return { phone: phone ?? null, message: `${hello}\n\n${update}\n\nPyramide Immobilier` };
}
