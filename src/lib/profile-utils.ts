export const normalize = (text: string) =>
  text.toLowerCase().normalize("NFD").replaceAll(/[\u0300-\u036f]/g, "");

export function findCountryCode(countries: { name: string; code: string; phoneCode: string }[], countryCandidate?: string | undefined, fallback = 'PE') {
  if (!countryCandidate) return fallback;
  const exactMatch = countries.find(c => c.code === countryCandidate);
  if (exactMatch) return exactMatch.code;
  const nameMatch = countries.find(c => normalize(c.name) === normalize(countryCandidate));
  return nameMatch ? nameMatch.code : fallback;
}

// Use named exports only
