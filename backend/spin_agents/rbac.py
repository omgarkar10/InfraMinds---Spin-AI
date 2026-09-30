ROLE_HIERARCHY = {
    "platform_admin": 6,
    "state_admin": 5,
    "district_admin": 4,
    "policymaker": 3,
    "department_officer": 2,
    "field_officer": 1,
    "citizen": 0,
}

def has_min_role(user_role: str, min_role: str) -> bool:
    return ROLE_HIERARCHY.get(user_role, 0) >= ROLE_HIERARCHY.get(min_role, 99)
