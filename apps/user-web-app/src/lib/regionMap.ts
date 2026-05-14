export const REGION_CONFIG = {
  HR: { name: 'Croatia', slug: 'croatia', label: 'Parking u Hrvatskoj', nativeLabel: 'Hrvatska' },
  SI: { name: 'Slovenia', slug: 'slovenia', label: 'Parkiranje v Sloveniji', nativeLabel: 'Slovenija' },
  BA: { name: 'Bosnia', slug: 'bosnia', label: 'Parking u Bosni', nativeLabel: 'Bosna' },
  ME: { name: 'Montenegro', slug: 'montenegro', label: 'Parkiranje u Crnoj Gori', nativeLabel: 'Crna Gora' },
  RS: { name: 'Serbia', slug: 'serbia', label: 'Parking u Srbiji', nativeLabel: 'Srbija' },
  AT: { name: 'Austria', slug: 'austria', label: 'Parken in Österreich', nativeLabel: 'Österreich' },
  DE: { name: 'Germany', slug: 'germany', label: 'Parken in Deutschland', nativeLabel: 'Deutschland' },
  IT: { name: 'Italy', slug: 'italy', label: 'Parcheggio in Italia', nativeLabel: 'Italia' },
  CH: { name: 'Switzerland', slug: 'switzerland', label: 'Parking in der Schweiz', nativeLabel: 'Schweiz' },
} as const;

export type RegionCode = keyof typeof REGION_CONFIG;

export function getRegionBySlug(slug: string): [RegionCode, typeof REGION_CONFIG[RegionCode]] | null {
  const entry = Object.entries(REGION_CONFIG).find(([_, config]) => config.slug === slug);
  return entry as [RegionCode, typeof REGION_CONFIG[RegionCode]] | null;
}

export function getAllRegions() {
  return Object.entries(REGION_CONFIG).map(([code, config]) => ({
    code: code as RegionCode,
    ...config,
  }));
}
