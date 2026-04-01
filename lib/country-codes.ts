import { allCountries } from "country-telephone-data";

function getFlagEmoji(iso2: string) {
  return iso2
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(c.codePointAt(0)! - 65 + 0x1f1e6))
    .join("");
}

function cleanName(name: string) {
  // Remove parenthetical native-script annotations e.g. "Algeria (\u202Bالجزائر\u202C\u200E)"
  return name.replace(/\s*\(.*?\)\s*/g, "").trim();
}

export type CountryEntry = {
  id: string;
  code: string;
  flag: string;
  label: string;
};

export const COUNTRY_CODES: CountryEntry[] = (
  allCountries as { name: string; iso2: string; dialCode: string }[]
).map((c) => ({
  id: c.iso2.toUpperCase(),
  code: `+${c.dialCode}`,
  flag: getFlagEmoji(c.iso2),
  label: cleanName(c.name),
}));

export type CountryId = string;
