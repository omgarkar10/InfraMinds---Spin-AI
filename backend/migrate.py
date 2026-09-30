import sys
import os

# Ensure backend directory is in sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from spin_agents.db import get_firestore_db

def migrate_demands():
    db = get_firestore_db()
    if not db:
        print("Failed to initialize Firestore DB.")
        return

    print("Fetching all demands...")
    docs = db.collection("demands").stream()
    
    updated_count = 0
    for doc in docs:
        data = doc.to_dict()
        needs_update = False
        updates = {}
        
        # 1. Backfill district_id
        if "district_id" not in data:
            district_name = None
            if "location" in data and isinstance(data["location"], dict):
                district_name = data["location"].get("district")
            if not district_name:
                district_name = data.get("district")
                
            if district_name:
                updates["district_id"] = district_name.strip().lower()
                needs_update = True
            else:
                # Fallback to "pune" if absolutely unknown, so the demo works
                updates["district_id"] = "pune"
                needs_update = True
                
        # 2. Backfill status if missing
        if "status" not in data:
            updates["status"] = "gathering_support"
            needs_update = True

        if needs_update:
            print(f"Updating {doc.id} with {updates}")
            db.collection("demands").document(doc.id).update(updates)
            updated_count += 1

    print(f"Migration complete. Updated {updated_count} documents.")

if __name__ == "__main__":
    migrate_demands()
