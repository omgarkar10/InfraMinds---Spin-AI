from fastapi import APIRouter, Depends, HTTPException
from google.cloud import firestore
from google.cloud.firestore_v1.base_query import FieldFilter
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from spin_agents.auth import require_staff
from spin_agents.models import UserSchema
from spin_agents.db import get_firestore_db
from spin_agents.routers.staff_router import get_category_from_dept_id

router = APIRouter(prefix="/api/policy", tags=["Policy Execution Dashboard"])

async def require_policymaker(user: UserSchema = Depends(require_staff)) -> UserSchema:
    if user.role != "policymaker":
        raise HTTPException(status_code=403, detail="Unauthorized. Policymaker role required.")
    return user

class EnactPolicyPayload(BaseModel):
    allocated_amount: int
    execution_notes: str

@router.get("/metrics")
async def get_policy_metrics(user: UserSchema = Depends(require_policymaker)):
    db = get_firestore_db()
    if not db:
        return {"total_demands": 0, "top_domain": "N/A", "avg_severity": 0.0}
    
    query = db.collection("demands")
    if user.district_id and user.district_id != 'all':
        query = query.where(filter=FieldFilter("district_id", "==", user.district_id))
        
    if user.department_id and user.department_id != 'all':
        expected_cat = get_category_from_dept_id(user.department_id)
        query = query.where(filter=FieldFilter("category", "==", expected_cat))
        
    docs = query.stream()
    
    total = 0
    categories = {}
    severity_sum = 0
    severity_mapping = {"Critical": 10.0, "High": 8.0, "Medium": 5.0, "Low": 2.5}
    
    for d in docs:
        data = d.to_dict()
        total += 1
        cat = data.get("category", "Other")
        categories[cat] = categories.get(cat, 0) + 1
        
        pri = data.get("priority", "Medium")
        severity_sum += severity_mapping.get(pri, 5.0)
        
    top_domain = max(categories.items(), key=lambda x: x[1])[0] if categories else "None"
    avg_severity = severity_sum / total if total > 0 else 0.0
    
    return {
        "total_demands": total,
        "top_domain": top_domain,
        "avg_severity": avg_severity
    }

@router.get("/map-signals")
async def get_map_signals(user: UserSchema = Depends(require_policymaker)):
    db = get_firestore_db()
    if not db:
        return {"signals": []}
    
    query = db.collection("demands")
    if user.district_id and user.district_id != 'all':
        query = query.where(filter=FieldFilter("district_id", "==", user.district_id))
    
    if user.department_id and user.department_id != 'all':
        expected_cat = get_category_from_dept_id(user.department_id)
        query = query.where(filter=FieldFilter("category", "==", expected_cat))
        
    docs = query.stream()
    signals = []
    
    for d in docs:
        data = d.to_dict()
        loc = data.get("location", {})
        lat = loc.get("lat") or data.get("lat")
        lng = loc.get("lng") or data.get("lng")
        
        if lat and lng:
            votes = data.get("vote_count", 1)
            # Basic weight algorithm: 1 + log of votes, plus priority bonus
            weight = 1 + (votes * 0.5)
            if data.get("priority") in ["High", "Critical"]:
                weight += 5
                
            signals.append({
                "id": d.id,
                "lat": float(lat),
                "lng": float(lng),
                "weight": weight
            })
            
    return {"signals": signals}

@router.get("/execution/queue")
async def get_execution_queue(user: UserSchema = Depends(require_policymaker)):
    db = get_firestore_db()
    if not db:
        return {"queue": []}
        
    query = db.collection("demands")
    
    # Status can be escalated_to_policy or approved_for_budget
    query = query.where(filter=FieldFilter("status", "in", ["escalated_to_policy", "approved_for_budget"]))
    
    if user.district_id and user.district_id != 'all':
        query = query.where(filter=FieldFilter("district_id", "==", user.district_id))
        
    if user.department_id and user.department_id != 'all':
        expected_cat = get_category_from_dept_id(user.department_id)
        query = query.where(filter=FieldFilter("category", "==", expected_cat))
        
    docs = query.stream()
    queue = []
    
    for d in docs:
        data = d.to_dict()
        data["id"] = d.id
        queue.append(data)
        
    return {"queue": queue}

@router.post("/execution/{demand_id}/enact")
async def enact_policy(demand_id: str, payload: EnactPolicyPayload, user: UserSchema = Depends(require_policymaker)):
    db = get_firestore_db()
    if not db:
        raise HTTPException(status_code=500, detail="Database not initialized")
        
    demand_ref = db.collection("demands").document(demand_id)
    
    @firestore.transactional
    def execute_in_transaction(transaction, ref):
        snapshot = ref.get(transaction=transaction)
        if not snapshot.exists:
            return {"error": "Demand not found"}
            
        data = snapshot.to_dict()
        
        # Verify scope
        if user.district_id and user.district_id != 'all' and data.get("district_id") != user.district_id:
            return {"error": "Unauthorized: Out of jurisdiction"}
            
        if user.department_id and user.department_id != 'all':
            expected_cat = get_category_from_dept_id(user.department_id)
            if data.get("category") != expected_cat:
                return {"error": "Unauthorized: Out of department domain"}
        
        status = data.get("status")
        if status not in ["escalated_to_policy", "approved_for_budget"]:
            return {"error": f"Invalid status for execution: {status}"}
            
        transaction.update(ref, {
            "status": "fulfilled",
            "allocated_budget": payload.allocated_amount,
            "status_updated_at": firestore.SERVER_TIMESTAMP,
            "timeline": firestore.ArrayUnion([{
                "title": "Policy Enacted & Budget Allocated",
                "description": payload.execution_notes,
                "actor": user.id,
                "date": datetime.now(timezone.utc).isoformat(),
                "completed": True,
                "details": f"₹{payload.allocated_amount:,.2f} allocated."
            }])
        })
        return {"status": "success"}
        
    transaction = db.transaction()
    result = execute_in_transaction(transaction, demand_ref)
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
        
    return result
