import { normalizePhoneKey } from "@/lib/phone";

export const assistantNameCollation = { locale: "fr", strength: 1 } as const;

export function clientIdentityFilter(value: string) {
  const query = value.trim().replace(/\s+/g, " ");
  const number = /^[+\d][\d\s().-]*$/.test(query) ? normalizePhoneKey(query) : undefined;
  if (number && number.length <= 15) {
    const variants = [number, `00${number}`, ...(number.startsWith("213") ? [`0${number.slice(3)}`] : [])];
    const digitsPattern = variants.map((digits) => digits.split("").join("[\\s().-]*")).join("|");
    const formatted = new RegExp(`^\\s*\\+?[\\s(]*(?:${digitsPattern})[\\s).]*$`);
    return { $or: [{ phoneKeys: number }, { phone: formatted }, { phone2: formatted }] };
  }

  return { $or: [
    { referenceCode: query },
    { firstName: query },
    { lastName: query },
    { $expr: { $eq: [
      { $trim: { input: { $concat: [{ $ifNull: ["$firstName", ""] }, " ", { $ifNull: ["$lastName", ""] }] } } },
      { $literal: query },
    ] } },
  ] };
}

export function explicitPhoneIn(text: string) {
  const matches = [...text.matchAll(/(?<![\p{L}\d])(?:\+|0)\d(?:[\d\s().-]*\d)(?![\p{L}\d])/gu)]
    .map(([value]) => value)
    .filter((value) => /^\d{8,15}$/.test(normalizePhoneKey(value) ?? ""));
  return matches.length === 1 ? matches[0] : undefined;
}
