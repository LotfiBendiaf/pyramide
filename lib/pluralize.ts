export function pluralize(count: number, singular: string, plural = singular + "s", locale = "fr") {
  return new Intl.PluralRules(locale).select(count) === "one" ? singular : plural;
}

export function formatLegacyPlurals(text: string) {
  return text.replace(/(\d+)([^\d\n]*)/g, (_match, count: string, words: string) =>
    count + words.replace(/([\p{L}-]+)\(s\)/giu, (_word, singular: string) => pluralize(Number(count), singular)),
  );
}
