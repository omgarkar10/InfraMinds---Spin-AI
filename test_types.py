import sys
import os

# Ensure backend can be imported
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from spin_agents.db import get_firestore_db

db = get_firestore_db()
if not db:
    print("Error: Could not connect to Firestore.")
    sys.exit(1)
    
docs = db.collection("demands").stream()
for d in docs:
    data = d.to_dict()
    print("ID:", d.id)
    print("Category:", data.get("category"))
    print("Votes:", data.get("vote_count"), type(data.get("vote_count")))
    print("Status:", data.get("status"))
    print("Threshold:", data.get("vote_threshold"), type(data.get("vote_threshold")))
    print("---")
