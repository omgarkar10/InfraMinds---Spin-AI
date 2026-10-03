from typing import Optional


def canonical_district_id(district: Optional[str]) -> Optional[str]:
    """Format a district name using the ID convention used by admin provisioning."""
    if not isinstance(district, str):
        return None

    normalized = district.strip().lower().replace(" ", "_")
    return normalized or None
