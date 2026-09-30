import sys
import os

# Ensure backend can be imported
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from spin_agents.db import get_firestore_db

db = get_firestore_db()
if not db:
    print("Error: Could not connect to Firestore.")
    sys.exit(1)
    
docs = db.collection("users").stream()
for d in docs:
    data = d.to_dict()
    print("Email:", data.get("email"), "| Role:", data.get("role"), "| Dept:", data.get("department"))
