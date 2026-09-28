## Goal Description
The objective is to pivot the platform from a "grievance tracking" system to a "public demand measurement" system. This involves shifting from resolving individual tickets to aggregating community support over time. 
To achieve this, we will migrate the existing SQLite/SQLAlchemy database to **Firebase Firestore** (since Firebase Auth is already in place), clean up all old database relations from the codebase, and implement a new schema optimized for high-performance statistical querying (vote velocity, geographic heatmaps, etc.).

## User Review Required
> [!IMPORTANT]
> **Data Loss Warning:** We are deleting all SQL/SQLite related schemas (`spin.db`, `users`, `grievances` tables) and completely replacing them with a Firestore NoSQL database. Please ensure no critical data is lost, or approve a complete reset.

> [!WARNING]
> **Firestore Structure:** The proposed relational schema (Users, Locations, Categories, Demands, Demand Votes) translates cleanly to NoSQL collections. However, enforcing the unique constraint for `demand_id` + `user_id` in `demand_votes` will require creating the vote document with an ID combining both (e.g., `doc_id = f"{demand_id}_{user_id}"`) or using a Firebase Security Rule. Please confirm if document ID combination is the preferred approach for preventing double-voting.

## Open Questions
> [!NOTE]
> 1. Should we manage Firestore interactions exclusively through the Python backend using `firebase-admin`, or allow direct reads from the React frontend using the Firebase JS SDK (which requires writing Firestore Security Rules)? The plan below assumes backend management for sensitive operations and aggregations.
> 2. Do we need to retain the `Bhashini` translation and AI agent processing logic currently present in the grievance service, but apply it to the new "demands" structure?

## Proposed Changes

---

### Dependency & Database Initialization
We need to replace the SQLAlchemy stack with Firebase Admin.

#### [MODIFY] `backend/requirements.txt`
```diff
- sqlalchemy[asyncio]>=2.0.0
- aiosqlite>=0.19.0
- asyncpg>=0.29.0
+ firebase-admin>=6.0.0
```

#### [DELETE] `backend/spin_db.py` (or existing SQLite DB)
We will delete any `spin.db` SQLite files.

#### [MODIFY] `backend/spin_agents/db.py`
Replace SQLAlchemy async engine setup with Firebase Admin initialization.
```python
import firebase_admin
from firebase_admin import credentials, firestore

# Initialize Firebase app if not already initialized
if not firebase_admin._apps:
    cred = credentials.Certificate(CONFIG.firebase_credentials_path)
    firebase_admin.initialize_app(cred)

db = firestore.client()

def get_firestore_db():
    return db
```

---

### Backend Data Models & Services
We need to remove SQL models and update our data access layer for the new schema.

#### [MODIFY] `backend/spin_agents/models.py`
Remove SQLAlchemy `Base`, `User`, and `Grievance` classes. Replace them with standard Pydantic models mapping to the new schema:
```python
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class UserSchema(BaseModel):
    id: str
    location_id: str
    age_bracket: Optional[str]
    is_verified_resident: bool = False
    created_at: datetime

class LocationSchema(BaseModel):
    id: str
    name: str
    parent_location_id: Optional[str]

class CategorySchema(BaseModel):
    id: str
    name: str

class DemandSchema(BaseModel):
    id: Optional[str] = None
    author_user_id: str
    category_id: str
    target_location_id: str
    title: str
    description: str
    status: str = 'gathering_support'
    vote_threshold: int = 100
    created_at: datetime = Field(default_factory=datetime.utcnow)
    status_updated_at: datetime = Field(default_factory=datetime.utcnow)

class DemandVoteSchema(BaseModel):
    id: Optional[str] = None
    demand_id: str
    user_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
```

#### [DELETE] `backend/spin_agents/services/grievance_service.py`
Delete the old SQLite-dependent grievance handling service.

#### [NEW] `backend/spin_agents/services/demand_service.py`
Implement Firestore CRUD logic for the new Demand and Vote structures.
```python
from spin_agents.db import get_firestore_db

db = get_firestore_db()

def create_demand(demand_data: dict) -> str:
    # Adds a new document to the "demands" collection
    doc_ref = db.collection('demands').document()
    demand_data['id'] = doc_ref.id
    doc_ref.set(demand_data)
    return doc_ref.id

def cast_vote(demand_id: str, user_id: str) -> bool:
    # Prevent double voting using composite document ID
    vote_id = f"{demand_id}_{user_id}"
    vote_ref = db.collection('demand_votes').document(vote_id)
    
    if vote_ref.get().exists:
        return False # Already voted
        
    vote_ref.set({
        'demand_id': demand_id,
        'user_id': user_id,
        'created_at': firestore.SERVER_TIMESTAMP
    })
    return True
```

#### [MODIFY] `backend/spin_agents/api.py`
Remove `Base.metadata.create_all()` and update routes to point to `demand_service.py` instead of the old grievance logic.

---

### Frontend Components
The frontend requires purging of "Grievance" language and mock data, updating local storage patterns, and integrating the new "Demands" API structure.

#### [DELETE] `frontend/dashboard/src/services/grievanceService.ts`
Completely remove this file and its hardcoded grievance local storage seed logic.

#### [NEW] `frontend/dashboard/src/services/demandService.ts`
Implement client functions to interact with the new backend (or directly with Firestore, depending on open question #1).
```typescript
import { auth } from "../config/firebase";

export async function fetchDemands() {
   // Logic to fetch from /api/demands or Firestore directly
}

export async function voteForDemand(demandId: string) {
   // Logic to post vote to /api/demands/{demandId}/vote
}
```

#### [MODIFY] Multiple Files in `frontend/dashboard/src/`
Search and replace "Grievance" -> "Demand" across components, routes, and UI elements.
1. `App.tsx`: Update routing and import paths.
2. `/components/citizen/TrackGrievances.tsx` -> `TrackDemands.tsx`.
3. `/components/citizen/RaiseGrievanceForm.tsx` -> `CreateDemandForm.tsx`.
4. `/components/citizen/GrievanceDetail.tsx` -> `DemandDetail.tsx`.

## Verification Plan

### Automated Tests
1. **Backend Tests:** Run `pytest backend/tests/` to verify that no legacy SQLAlchemy errors are thrown and that the Firestore client initializes correctly with mocking.
2. **Type Checking:** Run `npx tsc --noEmit` in `frontend/dashboard` to verify that renaming `Grievance` types and interfaces to `Demand` has not broken client-side builds.

### Manual Verification
1. Open the updated Citizen Portal and attempt to create a new "Public Demand".
2. Verify the new demand document successfully propagates to the Firebase Firestore `demands` collection.
3. Vote on the demand using a registered citizen account.
4. Verify that the vote appears in the `demand_votes` collection with the correct composite document ID (`demand_id_user_id`).
5. Attempt to vote again and ensure the unique constraint effectively prevents double-voting.
