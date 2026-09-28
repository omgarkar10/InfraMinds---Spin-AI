import os
import re

FRONTEND_DIR = r"c:\Users\niket\Documents\Hackathon-106\Google-Code-For-Communities-\frontend\dashboard\src"

REPLACEMENTS = {
    # File / Action level
    r"Raise Grievance": "Propose Initiative",
    r"Track Grievances": "Track Proposals",
    r"File a Complaint": "Voice a Need",
    r"Report Issue": "Propose an Improvement",
    r"Report an Issue": "Propose an Improvement",
    r"Submit Grievance": "Submit Proposal",
    r"Submit Request": "Submit Proposal",
    r"Submit Your First Request": "Submit Your First Proposal",
    r"MY SUBMITTED REQUESTS": "MY SUBMITTED PROPOSALS",
    
    # Base Terminology
    r"\bGrievance\b": "Proposal",
    r"\bgrievance\b": "proposal",
    r"\bGrievances\b": "Proposals",
    r"\bgrievances\b": "proposals",
    r"\bComplaint\b": "Community Demand",
    r"\bcomplaint\b": "community demand",
    r"\bComplaints\b": "Community Demands",
    r"\bcomplaints\b": "community demands",
    r"\bComplainant\b": "Citizen Contributor",
    r"\bcomplainant\b": "citizen contributor",
    r"\bVictim\b": "Advocate",
    r"\bvictim\b": "advocate",

    # Status & Scale
    r"Ticket Status": "Demand Status",
    r"\bResolution\b": "Adoption Stage",
    r"\bEscalate\b": "Community Support",
    r"\bSeverity\b": "Priority",
    r"\bseverity\b": "priority",

    # Form specific tweaks
    r"Describe your issue/incident": "What improvement does your community need?",
    r"Describe your grievance": "Describe your proposal",
    r"Location of defect": "Impacted Area / Neighborhood",
    r"Evidence \/ Proof of issue": "Supporting Photos / Context",
    r"Evidence \/ Proof": "Supporting Photos / Context",
    r"Specific Issue": "Proposed Improvement",
    r"specific issue": "proposed improvement",
    r"specific_issue": "specific_issue", # Protect variable
    r"grievance_id": "grievance_id", # Protect variable
    r"infrastructure grievance": "infrastructure proposal",
}

def replace_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # Apply all regex replacements
    for pattern, replacement in REPLACEMENTS.items():
        if "grievance_id" in pattern or "specific_issue" in pattern: continue # skip manual overrides
        content = re.sub(pattern, replacement, content)

    # Revert specific programmatic variables that might have been hit
    content = content.replace("Proposal_id", "grievance_id")
    content = content.replace("proposal_id", "grievance_id")
    content = content.replace("total_community demands", "total_complaints")
    content = content.replace("specific_proposed improvement", "specific_issue")
    content = content.replace("Specific_Issue", "Specific_Issue") # if any
    
    # Form specific replacements that were exact strings
    content = content.replace("Describe your issue/incident", "What improvement does your community need?")
    content = content.replace("Location of defect", "Impacted Area / Neighborhood")
    content = content.replace("Evidence / Proof of issue", "Supporting Photos / Context")
    content = content.replace("Supporting Evidence", "Supporting Photos / Context")
    
    if original != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

for root, _, files in os.walk(FRONTEND_DIR):
    for file in files:
        if file.endswith(('.tsx', '.ts', '.html')):
            replace_in_file(os.path.join(root, file))

print("Done replacing.")
