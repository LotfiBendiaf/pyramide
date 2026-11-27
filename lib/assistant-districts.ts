// This is an exact, city-scoped business alias already used by agency intake.
// There is no authoritative geographic catalogue in this project: keep all
// other names literal rather than guessing from spelling or inventory prefixes.
const districtAliases = [
  { city: "Oran", canonical: "Akid Lotfi", aliases: ["Akid"] },
] as const;

const clean = (value: string) =>
  value.normalize("NFKC").trim().replace(/\s+/gu, " ");
const key = (value: string) =>
  clean(value).normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("fr");

export function expandPreferredDistricts(
  value?: string | null,
  city?: string | null,
): string[] {
  if (!value) return [];
  const result = new Map<string, string>();
  const alternatives = value
    .split(/\s*(?:\/|;|\bou\b|\bor\b|،)\s*/iu)
    .map(clean)
    .filter(Boolean);
  for (const district of alternatives) {
    const group = districtAliases.find(
      (entry) =>
        city &&
        key(entry.city) === key(city) &&
        [entry.canonical, ...entry.aliases].some(
          (alias) => key(alias) === key(district),
        ),
    );
    const equivalents: readonly string[] = group
      ? [group.canonical, ...group.aliases]
      : [district];
    for (const equivalent of equivalents)
      result.set(key(equivalent), equivalent);
  }
  return [...result.values()];
}
