from spin_agents.schemas import PolicyAction
from spin_agents.db import get_firestore_db
from collections import Counter

async def get_dashboard_summary(district: str | None = None) -> dict:
    db = get_firestore_db()
    if not db:
        return {"executive_summary": "", "weekly_stats": {}}
    
    query = db.collection("demands")
    if district:
        query = query.where("district", "==", district)
    
    docs = query.stream()
    total = 0
    domains = Counter()
    red_count = 0
    
    for doc in docs:
        d = doc.to_dict()
        total += 1
        domains[d.get("domain", "General")] += 1
        if d.get("vote_count", 0) >= 50:
            red_count += 1
            
    top_domain = domains.most_common(1)[0][0] if domains else "Infrastructure"
    dist = district or "National"
    
    summary = (
        f"{total:,} verified complaints in {dist}. "
        f"{top_domain} infrastructure dominates grievance volume. "
        f"{red_count} Red Zone clusters require immediate policy action."
    )
    
    stats = {
        "total_complaints": total, 
        "top_domain": top_domain, 
        "district": dist, 
        "red_zone_count": red_count
    }
    
    return {
        "executive_summary": summary, 
        "weekly_stats": stats
    }

async def get_dashboard_red_zones(min_severity: int = 8) -> dict:
    db = get_firestore_db()
    if not db:
        return {"red_zones": [], "count": 0}
        
    docs = db.collection("demands").where("vote_count", ">=", 50).stream()
    zones = []
    for doc in docs:
        d = doc.to_dict()
        zones.append({
            "district": d.get("district", "Unknown"),
            "category": d.get("category", "General"),
            "vote_count": d.get("vote_count", 0),
            "demand_id": doc.id,
            "latitude": d.get("latitude"),
            "longitude": d.get("longitude"),
            "lat": d.get("latitude"),
            "lng": d.get("longitude")
        })
        
    return {"red_zones": zones, "count": len(zones)}

async def execute_policy_action(action: PolicyAction) -> dict:
    from spin_agents.tools.bhashini import bhashini_notify_citizen
    notification = await bhashini_notify_citizen(
        action.message_en, action.target_language, action.user_id
    )
    return {
        "status": "approved" if action.action == "approved" else action.action,
        "notification": notification,
        "budget_reallocated_cr": action.budget_cr,
    }
