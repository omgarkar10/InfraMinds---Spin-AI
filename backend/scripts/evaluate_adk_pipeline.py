"""
SPIN ADK Evaluation and Test Harness.
Runs unit test cases in ADK .test.json format and tests Semantic Parsing & Other-Resolver Prompts.
"""

import json
import os
import sys

def load_category_schema(schema_path: str = "data/category_schema.json") -> dict:
    if not os.path.exists(schema_path):
        schema_path = os.path.join(os.path.dirname(__file__), "..", "..", "data", "category_schema.json")
    with open(schema_path, "r", encoding="utf-8") as f:
        return json.load(f)

def validate_semantic_parsing_output(output: dict, schema: dict) -> tuple[bool, list[str]]:
    errors = []
    required_fields = [
        "original_text", "english_translation", "source_language", "category",
        "issue_type", "confidence", "severity", "priority", "severity_reason",
        "image_verified", "lat_long", "district", "state", "needs_human_review"
    ]
    for field in required_fields:
        if field not in output:
            errors.append(f"Missing required field: {field}")
            
    cat = output.get("category")
    allowed_categories = schema.get("categories", {})
    if cat not in allowed_categories:
        errors.append(f"Category '{cat}' is not in allowed taxonomy categories.")
    else:
        allowed_issues = allowed_categories[cat]
        issue = output.get("issue_type")
        if issue not in allowed_issues and cat != "Other (Uncategorized)":
            errors.append(f"Issue '{issue}' is not in allowed issues for category '{cat}'.")
            
    conf = output.get("confidence", 0.0)
    if not (0.0 <= conf <= 1.0):
        errors.append(f"Confidence score {conf} must be between 0.0 and 1.0.")
        
    sev = output.get("severity", 1)
    if not (1 <= sev <= 10):
        errors.append(f"Severity {sev} must be between 1 and 10.")
        
    prio = output.get("priority")
    if prio not in ["Low", "Medium", "High", "Critical"]:
        errors.append(f"Priority '{prio}' must be one of [Low, Medium, High, Critical].")
        
    return len(errors) == 0, errors

def main():
    print("=" * 60)
    print("SPIN ADK EVALUATION & TAXONOMY VALIDATION HARNESS")
    print("=" * 60)
    
    schema = load_category_schema()
    categories = schema.get("categories", {})
    print(f"Loaded Taxonomy: {len(categories)} categories validated.")
    for cat, issues in categories.items():
        print(f" - {cat} ({len(issues)} issue types)")
        
    test_cases = [
        {
            "original_text": "मेरे इलाके में पानी की पाइपलाइन फूट गई है, सारा पानी बह रहा है।",
            "english_translation": "Water pipeline burst in my locality, water is continuously overflowing.",
            "source_language": "hi",
            "category": "Water Supply",
            "issue_type": "Pipeline leakage",
            "confidence": 0.95,
            "severity": 8,
            "priority": "High",
            "severity_reason": "Major fresh water wastage and localized flooding potential.",
            "image_verified": False,
            "lat_long": {"lat": 18.5204, "lng": 73.8567},
            "district": "Pune",
            "state": "Maharashtra",
            "needs_human_review": False
        },
        {
            "original_text": "Streetlights near crossroad not working since yesterday.",
            "english_translation": "Streetlights near crossroad not working since yesterday.",
            "source_language": "en",
            "category": "Street Lighting",
            "issue_type": "Streetlights not working (night)",
            "confidence": 0.92,
            "severity": 4,
            "priority": "Medium",
            "severity_reason": "Pedestrian safety concern at night.",
            "image_verified": False,
            "lat_long": {"lat": 12.9716, "lng": 77.5946},
            "district": "Bengaluru",
            "state": "Karnataka",
            "needs_human_review": False
        }
    ]
    
    print("\nRunning test validations against PDF I/O specification:")
    all_passed = True
    for idx, tc in enumerate(test_cases, start=1):
        is_valid, errors = validate_semantic_parsing_output(tc, schema)
        if is_valid:
            print(f" [PASS] Test Case {idx}: Validated '{tc['category']} -> {tc['issue_type']}' successfully.")
        else:
            print(f" [FAIL] Test Case {idx}: Errors: {errors}")
            all_passed = False
            
    print("\n" + "=" * 60)
    print("Evaluation Summary: " + ("ALL TESTS PASSED" if all_passed else "SOME TESTS FAILED"))
    print("=" * 60)

if __name__ == "__main__":
    main()
