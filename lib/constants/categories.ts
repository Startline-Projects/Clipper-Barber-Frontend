import type { BarberCategoryTag } from '@/lib/constants/enums';

/**
 * Human-readable labels for the barber category/specialty tags.
 * The API enum (BarberCategoryTag) is the source of truth — this only
 * maps the raw values to display copy.
 */
export const CATEGORY_LABELS: Record<BarberCategoryTag, string> = {
  ALL_GENDER_CUTS: 'All-Gender Cuts',
  KIDS_CUTS: "Kids' Cuts",
  CURLY_HAIR_SPECIALIST: 'Curly Hair Specialist',
  AFRO_HAIR_SPECIALIST: 'Afro Hair Specialist',
  BRAIDS: 'Braids',
  BEARD_SPECIALIST: 'Beard Specialist',
  SKIN_FADES: 'Skin Fades',
  WOMENS_HAIRCUTS: "Women's Haircuts",
  LOCS_DREADLOCKS: 'Locs & Dreadlocks',
  HAIR_DESIGN: 'Hair Design',
  SHAVES: 'Shaves',
  MOBILE_BARBER: 'Mobile Barber',
  IN_HOUSE_SERVICES: 'In-House Services',
};

/** Display order for the multi-select grid. */
export const CATEGORY_OPTIONS = Object.keys(
  CATEGORY_LABELS,
) as BarberCategoryTag[];
