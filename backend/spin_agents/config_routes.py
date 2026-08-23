from fastapi import APIRouter

router = APIRouter(prefix="/api/config", tags=["config"])

# ── Dynamic Configuration API ────────────────────────────────────────────────

@router.get("/countries")
async def get_countries_config():
    """
    Returns data-driven configuration for supported countries and phone validation rules.
    This eliminates hardcoded phone validation in the frontend.
    """
    return {
        "status": "success",
        "countries": [
            {
                "code": "IN",
                "name": "India",
                "flag": "🇮🇳",
                "dialCode": "+91",
                "minLength": 10,
                "maxLength": 10,
                "pattern": "^[6-9]\\d{9}$",
                "placeholder": "9876543210",
                "customErrorMessages": {
                    "invalidLength": "Indian mobile numbers must contain exactly 10 digits.",
                    "invalidPrefix": "Enter a valid Indian mobile number starting with 6, 7, 8, or 9.",
                    "general": "Enter a valid 10-digit Indian mobile number."
                }
            },
            {
                "code": "BR",
                "name": "Brazil",
                "flag": "🇧🇷",
                "dialCode": "+55",
                "minLength": 10,
                "maxLength": 11,
                "pattern": "^[1-9]\\d{9,10}$",
                "placeholder": "11987654321",
                "customErrorMessages": {
                    "invalidLength": "Brazilian phone numbers must contain 10 or 11 digits.",
                    "invalidPrefix": "Enter a valid Brazilian area code and phone number.",
                    "general": "Enter a valid Brazilian phone number (10 or 11 digits)."
                }
            },
            {
                "code": "RU",
                "name": "Russia",
                "flag": "🇷🇺",
                "dialCode": "+7",
                "minLength": 10,
                "maxLength": 10,
                "pattern": "^9\\d{9}$",
                "placeholder": "9123456789",
                "customErrorMessages": {
                    "invalidLength": "Russian mobile numbers must contain exactly 10 digits.",
                    "invalidPrefix": "Russian mobile numbers must start with 9.",
                    "general": "Enter a valid 10-digit Russian mobile number starting with 9."
                }
            },
            {
                "code": "CN",
                "name": "China",
                "flag": "🇨🇳",
                "dialCode": "+86",
                "minLength": 11,
                "maxLength": 11,
                "pattern": "^1[3-9]\\d{9}$",
                "placeholder": "13812345678",
                "customErrorMessages": {
                    "invalidLength": "Chinese mobile numbers must contain exactly 11 digits.",
                    "invalidPrefix": "Chinese mobile numbers must start with 1 (followed by 3-9).",
                    "general": "Enter a valid 11-digit Chinese mobile number."
                }
            },
            {
                "code": "ZA",
                "name": "South Africa",
                "flag": "🇿🇦",
                "dialCode": "+27",
                "minLength": 9,
                "maxLength": 9,
                "pattern": "^[6-8]\\d{8}$",
                "placeholder": "821234567",
                "customErrorMessages": {
                    "invalidLength": "South African mobile numbers must contain exactly 9 digits.",
                    "invalidPrefix": "South African mobile numbers must start with 6, 7, or 8.",
                    "general": "Enter a valid 9-digit South African mobile number."
                }
            },
            {
                "code": "EG",
                "name": "Egypt",
                "flag": "🇪🇬",
                "dialCode": "+20",
                "minLength": 10,
                "maxLength": 10,
                "pattern": "^1[0-25]\\d{8}$",
                "placeholder": "1012345678"
            },
            {
                "code": "ET",
                "name": "Ethiopia",
                "flag": "🇪🇹",
                "dialCode": "+251",
                "minLength": 9,
                "maxLength": 9,
                "pattern": "^[79]\\d{8}$",
                "placeholder": "911234567"
            },
            {
                "code": "IR",
                "name": "Iran",
                "flag": "🇮🇷",
                "dialCode": "+98",
                "minLength": 10,
                "maxLength": 10,
                "pattern": "^9\\d{9}$",
                "placeholder": "9123456789"
            },
            {
                "code": "AE",
                "name": "UAE",
                "flag": "🇦🇪",
                "dialCode": "+971",
                "minLength": 9,
                "maxLength": 9,
                "pattern": "^5[024568]\\d{7}$",
                "placeholder": "501234567"
            },
            {
                "code": "ID",
                "name": "Indonesia",
                "flag": "🇮🇩",
                "dialCode": "+62",
                "minLength": 9,
                "maxLength": 12,
                "pattern": "^8[1-9]\\d{7,10}$",
                "placeholder": "81234567890"
            }
        ]
    }

@router.get("/auth")
async def get_auth_config():
    """
    Returns backend password requirements so the frontend can dynamically enforce rules.
    """
    return {
        "status": "success",
        "passwordPolicy": {
            "minLength": 8,
            "maxLength": 128,
            "requireUppercase": False,
            "requireLowercase": False,
            "requireNumber": False,
            "requireSpecialCharacter": False,
            "error_message": "Password must be at least 8 characters long."
        }
    }
