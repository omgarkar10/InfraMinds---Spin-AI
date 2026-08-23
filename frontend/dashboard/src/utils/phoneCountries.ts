export interface CountryPhoneRule {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
  minLength: number;
  maxLength: number;
  pattern: RegExp;
  placeholder: string;
  exampleValid: string;
  customErrorMessages?: {
    invalidLength?: string;
    invalidPrefix?: string;
    general?: string;
  };
}

export const SUPPORTED_COUNTRIES: CountryPhoneRule[] = [
  {
    code: "IN",
    name: "India",
    flag: "🇮🇳",
    dialCode: "+91",
    minLength: 10,
    maxLength: 10,
    pattern: /^[6-9]\d{9}$/,
    placeholder: "9876543210",
    exampleValid: "9876543210",
    customErrorMessages: {
      invalidLength: "Indian mobile numbers must contain exactly 10 digits.",
      invalidPrefix: "Enter a valid Indian mobile number starting with 6, 7, 8, or 9.",
      general: "Enter a valid 10-digit Indian mobile number.",
    },
  },
  {
    code: "BR",
    name: "Brazil",
    flag: "🇧🇷",
    dialCode: "+55",
    minLength: 10,
    maxLength: 11,
    pattern: /^[1-9]\d{9,10}$/,
    placeholder: "11987654321",
    exampleValid: "11987654321",
    customErrorMessages: {
      invalidLength: "Brazilian phone numbers must contain 10 or 11 digits.",
      invalidPrefix: "Enter a valid Brazilian area code and phone number.",
      general: "Enter a valid Brazilian phone number (10 or 11 digits).",
    },
  },
  {
    code: "RU",
    name: "Russia",
    flag: "🇷🇺",
    dialCode: "+7",
    minLength: 10,
    maxLength: 10,
    pattern: /^9\d{9}$/,
    placeholder: "9123456789",
    exampleValid: "9123456789",
    customErrorMessages: {
      invalidLength: "Russian mobile numbers must contain exactly 10 digits.",
      invalidPrefix: "Russian mobile numbers must start with 9.",
      general: "Enter a valid 10-digit Russian mobile number starting with 9.",
    },
  },
  {
    code: "CN",
    name: "China",
    flag: "🇨🇳",
    dialCode: "+86",
    minLength: 11,
    maxLength: 11,
    pattern: /^1[3-9]\d{9}$/,
    placeholder: "13812345678",
    exampleValid: "13812345678",
    customErrorMessages: {
      invalidLength: "Chinese mobile numbers must contain exactly 11 digits.",
      invalidPrefix: "Chinese mobile numbers must start with 1 (followed by 3-9).",
      general: "Enter a valid 11-digit Chinese mobile number.",
    },
  },
  {
    code: "ZA",
    name: "South Africa",
    flag: "🇿🇦",
    dialCode: "+27",
    minLength: 9,
    maxLength: 9,
    pattern: /^[6-8]\d{8}$/,
    placeholder: "821234567",
    exampleValid: "821234567",
    customErrorMessages: {
      invalidLength: "South African mobile numbers must contain exactly 9 digits.",
      invalidPrefix: "South African mobile numbers must start with 6, 7, or 8.",
      general: "Enter a valid 9-digit South African mobile number.",
    },
  },
  {
    code: "EG",
    name: "Egypt",
    flag: "🇪🇬",
    dialCode: "+20",
    minLength: 10,
    maxLength: 10,
    pattern: /^1[0-25]\d{8}$/,
    placeholder: "1012345678",
    exampleValid: "1012345678",
    customErrorMessages: {
      invalidLength: "Egyptian mobile numbers must contain exactly 10 digits.",
      invalidPrefix: "Egyptian mobile numbers must start with 10, 11, 12, or 15.",
      general: "Enter a valid 10-digit Egyptian mobile number.",
    },
  },
  {
    code: "ET",
    name: "Ethiopia",
    flag: "🇪🇹",
    dialCode: "+251",
    minLength: 9,
    maxLength: 9,
    pattern: /^[79]\d{8}$/,
    placeholder: "911234567",
    exampleValid: "911234567",
    customErrorMessages: {
      invalidLength: "Ethiopian mobile numbers must contain exactly 9 digits.",
      invalidPrefix: "Ethiopian mobile numbers must start with 7 or 9.",
      general: "Enter a valid 9-digit Ethiopian mobile number.",
    },
  },
  {
    code: "IR",
    name: "Iran",
    flag: "🇮🇷",
    dialCode: "+98",
    minLength: 10,
    maxLength: 10,
    pattern: /^9\d{9}$/,
    placeholder: "9123456789",
    exampleValid: "9123456789",
    customErrorMessages: {
      invalidLength: "Iranian mobile numbers must contain exactly 10 digits.",
      invalidPrefix: "Iranian mobile numbers must start with 9.",
      general: "Enter a valid 10-digit Iranian mobile number.",
    },
  },
  {
    code: "AE",
    name: "UAE",
    flag: "🇦🇪",
    dialCode: "+971",
    minLength: 9,
    maxLength: 9,
    pattern: /^5[024568]\d{7}$/,
    placeholder: "501234567",
    exampleValid: "501234567",
    customErrorMessages: {
      invalidLength: "UAE mobile numbers must contain exactly 9 digits.",
      invalidPrefix: "UAE mobile numbers must start with 5 (e.g. 50, 52, 54, 55, 56, 58).",
      general: "Enter a valid 9-digit UAE mobile number.",
    },
  },
  {
    code: "ID",
    name: "Indonesia",
    flag: "🇮🇩",
    dialCode: "+62",
    minLength: 9,
    maxLength: 12,
    pattern: /^8[1-9]\d{7,10}$/,
    placeholder: "81234567890",
    exampleValid: "81234567890",
    customErrorMessages: {
      invalidLength: "Indonesian mobile numbers must contain between 9 and 12 digits.",
      invalidPrefix: "Indonesian mobile numbers must start with 8.",
      general: "Enter a valid Indonesian mobile number (9 to 12 digits).",
    },
  },
];
