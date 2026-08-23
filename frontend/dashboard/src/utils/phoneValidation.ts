export interface CountryPhoneConfig {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
  minLength: number;
  maxLength: number;
  pattern: string;
  placeholder: string;
  customErrorMessages?: {
    invalidLength?: string;
    invalidPrefix?: string;
    general?: string;
  };
}

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
 * Retrieves country phone rule by country ISO code from dynamically loaded configs.
 */
export function getCountryByCode(countryCode: string, configs: CountryPhoneConfig[]): CountryPhoneConfig | undefined {
  return configs.find((c) => c.code === countryCode) || configs[0];
}

/**
 * Performs country-specific phone number validation and normalization.
 */
export function validatePhoneNumber(
  countryCode: string,
  rawPhoneNumber: string,
  configs: CountryPhoneConfig[]
): ValidationResult {
  if (!configs || configs.length === 0) {
    return { isValid: false, errorMessage: "Configuration not loaded.", normalizedNumber: null };
  }

  const country = getCountryByCode(countryCode, configs);
  if (!country) {
    return { isValid: false, errorMessage: "Invalid country selected.", normalizedNumber: null };
  }

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
  if (pattern) {
    const regex = new RegExp(pattern);
    if (!regex.test(sanitized)) {
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
  }

  // 3. Construct Normalized International Format (+<dialCode><sanitized>)
  const normalizedNumber = `${dialCode}${sanitized}`;

  return {
    isValid: true,
    errorMessage: null,
    normalizedNumber,
  };
}
