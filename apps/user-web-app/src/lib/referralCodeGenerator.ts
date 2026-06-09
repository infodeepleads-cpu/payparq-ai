// Referral Code Generation Utilities
// Generates deterministic codes for users and listings

/**
 * Generate a deterministic user referral code
 * Same user_id always produces the same code
 * Format: USER-ABC123
 */
export function generateUserReferralCode(userId: string): string {
  if (!userId) throw new Error('userId is required');

  // Create a deterministic hash from user_id
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Convert hash to 6-character alphanumeric
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  let n = Math.abs(hash);
  for (let i = 0; i < 6; i++) {
    code += chars[n % chars.length];
    n = Math.floor(n / chars.length);
  }

  return `USER-${code}`;
}

/**
 * Extract city code from a location name/address
 * Returns first 3 letters of first word, uppercase
 */
function getCityCode(locationName: string, address?: string): string {
  const fullText = `${locationName} ${address || ''}`.trim();
  const firstWord = fullText.split(/[\s,]+/)[0];
  return firstWord.substring(0, 3).toUpperCase().padEnd(3, 'X');
}

/**
 * Get listing type code
 * rent_a_car -> CAR
 * hotel -> HTL
 * parking -> PKG
 * instant_listing -> INS
 */
function getListingTypeCode(listingType?: string): string {
  const typeMap: Record<string, string> = {
    rent_a_car: 'CAR',
    car: 'CAR',
    hotel: 'HTL',
    parking_space: 'PKG',
    parking: 'PKG',
    instant_listing: 'INS',
    instant: 'INS',
  };

  const normalized = (listingType || 'INS').toLowerCase();
  return typeMap[normalized] || 'INS';
}

/**
 * Extract location ID suffix (last 3 characters, alphanumeric)
 * UUID: 550e8400-e29b-41d4-a716-446655440000 -> 000
 */
function getLocationIdSuffix(locationId: string): string {
  // Remove hyphens and take last 3 chars, pad if needed
  const clean = locationId.replace(/-/g, '');
  const suffix = clean.slice(-3).padStart(3, '0');
  return suffix.toUpperCase();
}

/**
 * Generate a deterministic listing referral code
 * Format: CITY-TYPE-ID
 * Example: DBK-CAR-482
 *
 * This format is:
 * - Human readable and memorable
 * - Always the same for a given listing
 * - Easy to type or say
 * - Never expires
 */
export function generateListingReferralCode(
  locationName: string,
  locationId: string,
  listingType?: string,
  address?: string
): string {
  if (!locationName || !locationId) {
    throw new Error('locationName and locationId are required');
  }

  const cityCode = getCityCode(locationName, address);
  const typeCode = getListingTypeCode(listingType);
  const idSuffix = getLocationIdSuffix(locationId);

  return `${cityCode}-${typeCode}-${idSuffix}`;
}

/**
 * Validate referral code format
 * Returns: { valid: boolean, type: 'user' | 'listing' | 'unknown' }
 */
export function validateReferralCodeFormat(code: string): {
  valid: boolean;
  type: 'user' | 'listing' | 'unknown';
} {
  if (!code) return { valid: false, type: 'unknown' };

  // User code format: USER-ABC123
  if (code.startsWith('USER-') && code.length === 10) {
    return { valid: true, type: 'user' };
  }

  // Listing code format: ABC-XYZ-123
  const listingPattern = /^[A-Z]{3}-[A-Z]{3}-[A-Z0-9]{3}$/;
  if (listingPattern.test(code)) {
    return { valid: true, type: 'listing' };
  }

  return { valid: false, type: 'unknown' };
}

/**
 * Parse a listing code to extract components
 * Returns: { city: string, type: string, id: string }
 */
export function parseListingCode(code: string): {
  city: string;
  type: string;
  id: string;
} {
  const parts = code.split('-');
  if (parts.length !== 3) {
    throw new Error(`Invalid listing code format: ${code}`);
  }

  return {
    city: parts[0],
    type: parts[1],
    id: parts[2],
  };
}
