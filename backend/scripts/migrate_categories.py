import sys
import os

# Ensure backend can be imported
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from spin_agents.db import get_firestore_db

CATEGORY_MIGRATION_MAP = {
    "water": "Water Supply",
    "Water": "Water Supply",
    "water supply": "Water Supply",
    
    "roads": "Roads & Transport",
    "road": "Roads & Transport",
    "roads & potholes": "Roads & Transport",
    "Roads & Potholes": "Roads & Transport",
    
    "garbage": "Sanitation",
    "drainage": "Sanitation",
    "waste management": "Sanitation",
    "Waste Management": "Sanitation",
    "Drainage / Flooding": "Sanitation",
    
    "electricity": "Electricity",
    "power": "Electricity",
    "Street Lighting": "Electricity",
    
    "Public Transport": "Public Transport",
    "Healthcare & Hospitals": "Public Health",
    "Education": "Education",
    "Public Infrastructure": "Housing & Urban Development",
    "Public Safety & Law Enforcement": "Police / Law & Order",
}

def run_migration():
    db = get_firestore_db()
    if not db:
        print("Error: Could not connect to Firestore.")
        return
        
    docs = db.collection("demands").stream()
    count = 0
    updated_count = 0
    
    for doc in docs:
        count += 1
        data = doc.to_dict()
        old_category = data.get("category", "")
        
        if not old_category:
            continue
            
        # If it exactly matches one of the new 12 canonical ones, skip
        if old_category in [
            "Water Supply", "Electricity", "Roads & Transport", "Sanitation",
            "Public Health", "Police / Law & Order", "Public Transport",
            "Education", "Housing & Urban Development", "Environment & Forestry",
            "Social Welfare & Pensions", "General Administration", "Other"
        ]:
            continue
            
        # Attempt to map it
        new_category = CATEGORY_MIGRATION_MAP.get(old_category)
        
        # Fallback to case-insensitive match
        if not new_category:
            for k, v in CATEGORY_MIGRATION_MAP.items():
                if k.lower() == old_category.lower():
                    new_category = v
                    break
                    
        # Ultimate fallback
        if not new_category:
            new_category = "Other"
            
        print(f"Migrating demand {doc.id}: '{old_category}' -> '{new_category}'")
        db.collection("demands").document(doc.id).update({"category": new_category})
        updated_count += 1
        
    print(f"Migration complete. Evaluated {count} demands, updated {updated_count}.")

if __name__ == "__main__":
    run_migration()
