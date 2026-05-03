import { GOOGLE_PLACES_API_KEY } from '../constants/api';

const PLACES_BASE = 'https://places.googleapis.com/v1';
const GEOCODE_BASE = 'https://maps.googleapis.com/maps/api/geocode/json';

export interface PlaceSuggestion {
  placeId: string;
  primaryText: string;
  secondaryText: string;
}

export interface AddressParts {
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
}

interface AutocompleteResponse {
  suggestions?: Array<{
    placePrediction?: {
      placeId: string;
      structuredFormat?: {
        mainText?: { text?: string };
        secondaryText?: { text?: string };
      };
      text?: { text?: string };
    };
  }>;
}

interface PlaceDetailsResponse {
  id?: string;
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  addressComponents?: Array<{
    longText: string;
    shortText: string;
    types: string[];
  }>;
}

interface GeocodeResponse {
  status: string;
  results: Array<{
    formatted_address: string;
    geometry: { location: { lat: number; lng: number } };
    address_components: Array<{
      long_name: string;
      short_name: string;
      types: string[];
    }>;
  }>;
}

function assertKey(): string {
  if (!GOOGLE_PLACES_API_KEY) {
    throw new Error(
      'Missing EXPO_PUBLIC_GOOGLE_PLACES_API_KEY. Add it to .env and restart Metro.',
    );
  }
  return GOOGLE_PLACES_API_KEY;
}

function partsFromComponents(
  components: Array<{ longText?: string; shortText?: string; long_name?: string; short_name?: string; types: string[] }>,
): Pick<AddressParts, 'streetAddress' | 'city' | 'state' | 'zipCode'> {
  const get = (type: string, useShort = false) => {
    const c = components.find((x) => x.types.includes(type));
    if (!c) return '';
    return useShort
      ? (c.shortText ?? c.short_name ?? '')
      : (c.longText ?? c.long_name ?? '');
  };

  const streetNumber = get('street_number');
  const route = get('route');
  const streetAddress = [streetNumber, route].filter(Boolean).join(' ').trim();

  const city =
    get('locality') ||
    get('postal_town') ||
    get('sublocality_level_1') ||
    get('sublocality') ||
    get('administrative_area_level_2');

  const state = get('administrative_area_level_1', true);
  const zipCode = get('postal_code');

  return { streetAddress, city, state, zipCode };
}

/**
 * Autocomplete for address input. `sessionToken` keeps a typing session under
 * one billing event — generate one per new search session and pass it through.
 */
export async function autocompleteAddress(
  input: string,
  sessionToken: string,
  signal?: AbortSignal,
): Promise<PlaceSuggestion[]> {
  const key = assertKey();
  if (!input.trim()) return [];

  const res = await fetch(`${PLACES_BASE}/places:autocomplete`, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
    },
    body: JSON.stringify({
      input,
      sessionToken,
      includedPrimaryTypes: ['street_address', 'premise', 'establishment'],
    }),
  });

  if (!res.ok) {
    throw new Error(`Places autocomplete failed (${res.status})`);
  }

  const data: AutocompleteResponse = await res.json();
  return (data.suggestions ?? [])
    .map((s) => s.placePrediction)
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .map((p) => ({
      placeId: p.placeId,
      primaryText: p.structuredFormat?.mainText?.text ?? p.text?.text ?? '',
      secondaryText: p.structuredFormat?.secondaryText?.text ?? '',
    }));
}

export async function getPlaceDetails(
  placeId: string,
  sessionToken: string,
  signal?: AbortSignal,
): Promise<AddressParts> {
  const key = assertKey();

  const res = await fetch(
    `${PLACES_BASE}/places/${encodeURIComponent(placeId)}?sessionToken=${encodeURIComponent(sessionToken)}`,
    {
      signal,
      headers: {
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask':
          'id,formattedAddress,location,addressComponents',
      },
    },
  );

  if (!res.ok) {
    throw new Error(`Places details failed (${res.status})`);
  }

  const data: PlaceDetailsResponse = await res.json();
  const components = data.addressComponents ?? [];
  const parts = partsFromComponents(components);

  return {
    ...parts,
    formattedAddress: data.formattedAddress ?? '',
    latitude: data.location?.latitude ?? 0,
    longitude: data.location?.longitude ?? 0,
  };
}

/**
 * Reverse geocode a coordinate (used after the user drags the map pin) to get
 * the corresponding address parts so the form fields stay in sync with the pin.
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<AddressParts | null> {
  const key = assertKey();
  const url = `${GEOCODE_BASE}?latlng=${latitude},${longitude}&key=${encodeURIComponent(key)}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Reverse geocode failed (${res.status})`);

  const data: GeocodeResponse = await res.json();
  if (data.status !== 'OK' || !data.results.length) return null;

  const top = data.results[0];
  const parts = partsFromComponents(top.address_components);
  return {
    ...parts,
    formattedAddress: top.formatted_address,
    latitude: top.geometry.location.lat,
    longitude: top.geometry.location.lng,
  };
}

/**
 * Cheap session-token generator (UUIDv4-ish). The Places API only requires
 * uniqueness within a typing session, not crypto-grade randomness.
 */
export function newSessionToken(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
