import { SUPPORTED_COUNTRIES, CountryPhoneRule } from "./phoneCountries";

export interface ValidationResult {
  isValid: boolean;
  errorMessage: string | null;
  normalizedNumber: string | null;
}

/**
 * Sanitizes input string by stripping all non-numeric characters.
 */
export function sanitizePhoneNumber(input: string): string {
  return input.replace(/\D/g, "");
}

/**
 * Retrieves country phone rule by country ISO code (defaulting to IN).
 */
export function getCountryByCode(countryCode: string): CountryPhoneRule {
  const country = SUPPORTED_COUNTRIES.find((c) => c.code === countryCode);
  return country || SUPPORTED_COUNTRIES[0];
}

/**
 * Performs country-specific phone number validation and normalization.
 */
export function validatePhoneNumber(
  countryCode: string,
  rawPhoneNumber: string
): ValidationResult {
  const country = getCountryByCode(countryCode);
  const sanitized = sanitizePhoneNumber(rawPhoneNumber);

  if (!sanitized) {
    return {
      isValid: false,
      errorMessage: null,
      normalizedNumber: null,
    };
  }

  const length = sanitized.length;
  const { minLength, maxLength, pattern, customErrorMessages, dialCode, name } = country;

  // 1. Length Validation
  if (minLength === maxLength && length !== minLength) {
    const error =
      customErrorMessages?.invalidLength ||
      `${name} mobile numbers must contain exactly ${minLength} digits.`;
    return {
      isValid: false,
      errorMessage: error,
      normalizedNumber: null,
    };
  }

  if (length < minLength || length > maxLength) {
    const error =
      customErrorMessages?.invalidLength ||
      `${name} mobile numbers must contain between ${minLength} and ${maxLength} digits.`;
    return {
      isValid: false,
      errorMessage: error,
      normalizedNumber: null,
    };
  }

  // 2. Pattern / Prefix Validation
  if (!pattern.test(sanitized)) {
    const error =
      customErrorMessages?.invalidPrefix ||
      customErrorMessages?.general ||
      `Enter a valid ${name} mobile number.`;
    return {
      isValid: false,
      errorMessage: error,
      normalizedNumber: null,
    };
  }

  // 3. Construct Normalized International Format (+<dialCode><sanitized>)
  const normalizedNumber = `${dialCode}${sanitized}`;

  return {
    isValid: true,
    errorMessage: null,
    normalizedNumber,
  };
}
