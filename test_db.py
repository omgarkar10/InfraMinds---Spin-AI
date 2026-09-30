import sys
sys.path.append('./backend')
from spin_agents.db import get_firestore_db
db = get_firestore_db()
docs = db.collection('demands').stream()
for d in docs:
    data = d.to_dict()
    print("ID:", d.id, "| Category:", data.get('category'), "| Status:", data.get('status'), "| Votes:", data.get('vote_count'), "| Threshold:", data.get('vote_threshold'))
