"""AGENT 2: Dynamic Verification & Read-Back Agent (dynamic_verification_agent)

Responsibilities:
1. Targeted questionnaire generation strictly for missing/null or low-confidence (< 0.70) fields.
2. Channel-adaptive output formatting:
   - PWA / WhatsApp: UI chips, selection options, cards.
   - SMS / IVR: DTMF prompt strings ("Press 1 for Roads, 2 for Water...").
3. Read-Back Confirmation Card rendered in the citizen's native language.
4. Comprehensive audit logging: tracks and records field changes in field_source_log:
   "ai_inferred" -> "citizen_confirmed" | "citizen_corrected".
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from google.adk.agents import LlmAgent

from schemas.data_models import (
    ChannelType,
    DynamicVerificationOutput,
    FieldSource,
    GrievanceCategory,
    GrievanceSchema,
    GrievanceStatus,
    LocationModel,
    ReadBackCard,
    SemanticParsingOutput,
    VerificationQuestionItem,
)
from spin_agents.config import CONFIG
from spin_agents.tools.mcp_bindings import cloud_translate_text

GEMINI_MODEL = CONFIG.gemini_model


DYNAMIC_VERIFIER_INSTRUCTION = """
You are the Dynamic Verification & Read-Back Agent for the Citizen Grievance AI Pipeline.
Your role is to inspect extracted grievance parameters, detect missing/low-confidence fields,
and produce a minimal, targeted questionnaire alongside a native-language Read-Back Confirmation Card.

RULES:
1. TARGETED QUESTIONNAIRE:
   - Ask ONLY about fields that are null or have confidence score < 0.70.
   - Do NOT ask questions about fields already confidently extracted (> 0.70).
2. CHANNEL ADAPTABILITY:
   - PWA / WhatsApp: Provide structured options and interactive chips.
   - SMS / IVR: Provide concise DTMF mappings ("Press 1 for ..., Press 2 for ...").
3. NATIVE READ-BACK CARD:
   - Summarize the known fields in the citizen's native language.
   - Require explicit confirmation before the grievance is submitted.
4. AUDIT LOGGING:
   - Mark initial AI inferences as 'ai_inferred'.
   - When a citizen confirms or modifies a field, log 'citizen_confirmed' or 'citizen_corrected'.
"""


CATEGORY_LABELS_NATIVE: Dict[str, Dict[str, str]] = {
    "hi": {
        "roads": "सड़क और गड्ढे (Roads & Potholes)",
        "water": "जल आपूर्ति (Water Supply)",
        "garbage": "कचरा और सफाई (Garbage & Waste)",
        "electricity": "बिजली (Electricity)",
        "drainage": "जल निकासी और नाले (Drainage)",
        "other": "अन्य नागरिक समस्या (Other)",
    },
    "mr": {
        "roads": "रस्ते आणि खड्डे",
        "water": "पाणी पुरवठा",
        "garbage": "कचरा व्यवस्थापन",
        "electricity": "वीज पुरवठा",
        "drainage": "ड्रेनेज आणि सांडपाणी",
        "other": "इतर समस्या",
    },
    "en": {
        "roads": "Roads & Potholes",
        "water": "Water Supply",
        "garbage": "Garbage & Sanitation",
        "electricity": "Electricity & Lighting",
        "drainage": "Drainage & Sewerage",
        "other": "Other Civic Issue",
    },
}


def generate_targeted_questionnaire(
    parsed: SemanticParsingOutput,
) -> List[VerificationQuestionItem]:
    """Generates questions strictly for null or low-confidence fields (< 0.70)."""
    questions: List[VerificationQuestionItem] = []
    channel = parsed.channel
    lang = parsed.language if parsed.language in CATEGORY_LABELS_NATIVE else "en"

    # 1. Location Check
    loc = parsed.location
    has_location = (loc.latitude is not None and loc.longitude is not None) or bool(loc.landmark_text or loc.home_ward)
    if not has_location or parsed.confidence_scores.location < 0.70:
        if channel in (ChannelType.SMS_IVR,):
            prompt_en = "Location is missing. Please speak your landmark or enter 6-digit PIN code."
            prompt_nat = "स्थान की जानकारी नहीं मिली। कृपया अपने नजदीकी लैंडमार्क का नाम बोलें।" if lang == "hi" else prompt_en
            questions.append(
                VerificationQuestionItem(
                    field_name="location",
                    prompt_text=prompt_en,
                    prompt_native=prompt_nat,
                    field_type="location",
                    options=["Share Landmark via SMS/Voice", "Enter Pincode"],
                    dtmf_mapping={"1": "Speak Landmark", "2": "Enter Pincode"},
                    current_value=None,
                )
            )
        else:
            prompt_en = "Please provide the exact location or nearest landmark."
            prompt_nat = "कृपया समस्या का सही स्थान या निकटतम लैंडमार्क बताएं।" if lang == "hi" else prompt_en
            questions.append(
                VerificationQuestionItem(
                    field_name="location",
                    prompt_text=prompt_en,
                    prompt_native=prompt_nat,
                    field_type="location",
                    options=["Share GPS Pin", "Type Landmark", "Select Ward"],
                    current_value=None,
                )
            )

    # 2. Category Check
    if parsed.category == GrievanceCategory.OTHER or parsed.confidence_scores.category < 0.70:
        cat_options = ["Roads", "Water", "Garbage", "Electricity", "Drainage", "Other"]
        cat_dtmf = {"1": "Roads", "2": "Water", "3": "Garbage", "4": "Electricity", "5": "Drainage", "9": "Other"}
        prompt_en = "Please confirm the category of your grievance:"
        prompt_nat = "कृपया अपनी शिकायत की श्रेणी चुनें:" if lang == "hi" else prompt_en
        questions.append(
            VerificationQuestionItem(
                field_name="category",
                prompt_text=prompt_en,
                prompt_native=prompt_nat,
                field_type="select",
                options=cat_options,
                dtmf_mapping=cat_dtmf if channel == ChannelType.SMS_IVR else None,
                current_value=parsed.category.value,
            )
        )

    # 3. Severity Check
    if parsed.severity is None or parsed.confidence_scores.severity < 0.50:
        prompt_en = "How severe is this issue on a scale of 1 to 10?"
        prompt_nat = "यह समस्या कितनी गंभीर है (1 से 10 के पैमाने पर)?" if lang == "hi" else prompt_en
        questions.append(
            VerificationQuestionItem(
                field_name="severity",
                prompt_text=prompt_en,
                prompt_native=prompt_nat,
                field_type="rating",
                options=["1-3 (Minor)", "4-6 (Moderate)", "7-8 (Serious)", "9-10 (Emergency)"],
                dtmf_mapping={"1": "Low", "2": "Medium", "3": "High", "4": "Critical"} if channel == ChannelType.SMS_IVR else None,
                current_value=parsed.severity,
            )
        )

    # 4. Multimodal Vision Discrepancy Check
    if parsed.vision_alignment_status == "discrepancy_detected":
        v_cat = (parsed.vision_details or {}).get("detected_category", "Unknown")
        prompt_en = f"Visual check suggests '{v_cat}' but you reported '{parsed.category.value}'. Please confirm."
        prompt_nat = f"फोटो में '{v_cat}' दिख रहा है जबकि आपने '{parsed.category.value}' बताया है। कृपया पुष्टि करें।" if lang == "hi" else prompt_en
        questions.append(
            VerificationQuestionItem(
                field_name="category_clarification",
                prompt_text=prompt_en,
                prompt_native=prompt_nat,
                field_type="select",
                options=[f"Keep as {parsed.category.value.title()}", f"Switch to {v_cat.title()}"],
                dtmf_mapping={"1": parsed.category.value, "2": v_cat} if channel == ChannelType.SMS_IVR else None,
                current_value=parsed.category.value,
            )
        )

    return questions


def generate_read_back_card(
    parsed: SemanticParsingOutput,
    category_native_override: Optional[str] = None,
) -> ReadBackCard:
    """Renders a localized Read-Back summary card in the citizen's native language."""
    lang = parsed.language if parsed.language in ("hi", "mr", "en") else "en"
    cat_str = parsed.category.value
    cat_display = category_native_override or CATEGORY_LABELS_NATIVE.get(lang, {}).get(cat_str, cat_str)

    loc = parsed.location
    if loc.latitude and loc.longitude:
        loc_str = f"{loc.landmark_text or 'GPS Location'} ({loc.latitude:.4f}, {loc.longitude:.4f})"
    elif loc.landmark_text:
        loc_str = loc.landmark_text
    elif loc.home_ward:
        loc_str = f"Ward: {loc.home_ward}"
    else:
        loc_str = "स्थान निर्दिष्ट नहीं (Location not specified)" if lang == "hi" else "Location not specified"

    sev_str = f"{parsed.severity}/10" if parsed.severity is not None else "सामान्य (Normal)"

    if lang == "hi":
        return ReadBackCard(
            headline_native="आपकी शिकायत की समीक्षा (Review Your Grievance)",
            category_native=f"श्रेणी: {cat_display}",
            location_summary_native=f"स्थान: {loc_str}",
            severity_native=f"गंभीरता स्तर: {sev_str}",
            description_summary_native=f"विवरण: {parsed.description_original[:120]}...",
            confirmation_prompt="क्या यह जानकारी सही है? पुष्टि करने के लिए 'स्वीकार करें' दबाएं।",
        )
    elif lang == "mr":
        return ReadBackCard(
            headline_native="तक्रारीचे पुनरावलोकन",
            category_native=f"प्रवर्ग: {cat_display}",
            location_summary_native=f"ठिकाण: {loc_str}",
            severity_native=f"तीव्रता: {sev_str}",
            description_summary_native=f"तपशील: {parsed.description_original[:120]}...",
            confirmation_prompt="माहिती बरोबर आहे का? सबमिट करण्यासाठी पुष्टी करा.",
        )
    else:
        return ReadBackCard(
            headline_native="Grievance Read-Back Confirmation",
            category_native=f"Category: {cat_display}",
            location_summary_native=f"Location: {loc_str}",
            severity_native=f"Severity: {sev_str}",
            description_summary_native=f"Summary: {parsed.description_translated[:120]}...",
            confirmation_prompt="Is this information accurate? Please confirm to submit.",
        )


def execute_dynamic_verification(
    parsed: SemanticParsingOutput,
    citizen_corrections: Optional[Dict[str, Any]] = None,
    explicitly_confirmed: bool = False,
) -> DynamicVerificationOutput:
    """Agent 2 Execution function.
    
    1. Analyzes null or low-confidence fields.
    2. Builds targeted questionnaire if missing or not yet confirmed.
    3. Produces native Read-Back card.
    4. When citizen confirms/provides corrections, applies them and generates field_source_log.
    """
    corrections = citizen_corrections or {}
    questions = generate_targeted_questionnaire(parsed)

    # Initial field source log marks extracted fields as 'ai_inferred'
    field_source_log: Dict[str, str] = {
        "category": FieldSource.AI_INFERRED.value,
        "severity": FieldSource.AI_INFERRED.value,
        "location": FieldSource.AI_INFERRED.value,
        "description": FieldSource.AI_INFERRED.value,
    }

    # Apply citizen corrections/answers if supplied
    updated_cat = parsed.category
    if "category" in corrections:
        updated_cat = GrievanceCategory(corrections["category"].lower())
        field_source_log["category"] = (
            FieldSource.CITIZEN_CONFIRMED.value
            if updated_cat == parsed.category
            else FieldSource.CITIZEN_CORRECTED.value
        )

    updated_severity = parsed.severity
    if "severity" in corrections:
        updated_severity = int(corrections["severity"])
        field_source_log["severity"] = (
            FieldSource.CITIZEN_CONFIRMED.value
            if updated_severity == parsed.severity
            else FieldSource.CITIZEN_CORRECTED.value
        )

    updated_loc = parsed.location.model_copy()
    if "location" in corrections:
        c_loc = corrections["location"]
        if isinstance(c_loc, dict):
            if c_loc.get("latitude") is not None:
                updated_loc.latitude = float(c_loc["latitude"])
            if c_loc.get("longitude") is not None:
                updated_loc.longitude = float(c_loc["longitude"])
            if c_loc.get("landmark_text"):
                updated_loc.landmark_text = str(c_loc["landmark_text"])
            if c_loc.get("home_ward"):
                updated_loc.home_ward = str(c_loc["home_ward"])
            if c_loc.get("district"):
                updated_loc.district = str(c_loc["district"])
            if c_loc.get("state"):
                updated_loc.state = str(c_loc["state"])
        elif isinstance(c_loc, str):
            updated_loc.landmark_text = c_loc
        field_source_log["location"] = FieldSource.CITIZEN_CORRECTED.value

    read_back = generate_read_back_card(parsed)

    # Determine if questionnaire is cleared
    has_remaining_critical_questions = False
    for q in questions:
        if q.field_name not in corrections and q.field_name != "category_clarification":
            has_remaining_critical_questions = True
            break

    # If all questions answered or none required, and confirmed
    is_ready = explicitly_confirmed or ((not has_remaining_critical_questions) and bool(corrections))

    # Construct partial or full grievance object
    partial_grievance = GrievanceSchema(
        citizen_id=parsed.citizen_id,
        channel=parsed.channel,
        query_id="",  # Assigned by Agent 3
        type=parsed.type,
        category=updated_cat,
        description_original=parsed.description_original,
        description_translated=parsed.description_translated,
        severity=updated_severity,
        location=updated_loc,
        proxy_filed_for=parsed.proxy_filed_for,
        media_url=parsed.media_url,
        language=parsed.language,
        duplicate_of=parsed.duplicate_match_id,
        department="Pending Deterministic Routing",
        confidence_scores=parsed.confidence_scores,
        field_source_log=field_source_log,
        status=GrievanceStatus.SUBMITTED,
    )

    return DynamicVerificationOutput(
        is_fully_confirmed=is_ready,
        questionnaire=questions if not is_ready else [],
        read_back_card=read_back,
        partial_grievance=partial_grievance,
    )


# ADK Agent definition
dynamic_verification_agent = LlmAgent(
    name="Dynamic_Verification_Agent",
    model=GEMINI_MODEL,
    description="Interactive HITL agent generating dynamic questionnaires, native read-back cards, and audit logging.",
    instruction=DYNAMIC_VERIFIER_INSTRUCTION,
    output_key="dynamic_verification_output",
)
