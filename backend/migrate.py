import sys
import os

# Ensure backend directory is in sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from spin_agents.db import get_firestore_db
from spin_agents.location import canonical_district_id

def migrate_demands():
    db = get_firestore_db()
    if not db:
        print("Failed to initialize Firestore DB.")
        return

    print("Fetching all demands...")
    docs = db.collection("demands").stream()
    
    updated_count = 0
    skipped_district_ids = []
    for doc in docs:
        data = doc.to_dict()
        needs_update = False
        updates = {}
        
        # 1. Backfill district_id
        if not data.get("district_id"):
            district_candidates = []
            if "location" in data and isinstance(data["location"], dict):
                district_candidates.append(data["location"].get("district"))
            district_candidates.append(data.get("district"))

            district_id = next(
                (candidate_id for candidate in district_candidates
                 if (candidate_id := canonical_district_id(candidate))),
                None,
            )
            if district_id:
                updates["district_id"] = district_id
                needs_update = True
            else:
                skipped_district_ids.append(doc.id)
                
        # 2. Backfill status if missing
        if "status" not in data:
            updates["status"] = "gathering_support"
            needs_update = True

        if needs_update:
            print(f"Updating {doc.id} with {updates}")
            db.collection("demands").document(doc.id).update(updates)
            updated_count += 1

    print(
        f"Migration complete. Updated {updated_count} documents; "
        f"skipped district_id for {len(skipped_district_ids)} records with no usable district."
    )
    if skipped_district_ids:
        print(f"Records needing district review: {', '.join(skipped_district_ids)}")

if __name__ == "__main__":
    migrate_demands()
