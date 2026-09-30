from fastapi import APIRouter, Depends, HTTPException
from google.cloud import aiplatform
from vertexai.generative_models import GenerativeModel
import json
from firebase_admin import firestore
from spin_agents.auth import get_current_user
from spin_agents.models import UserSchema
from spin_agents.rbac import has_min_role

router = APIRouter()
db = firestore.client()

def require_policymaker(user: UserSchema = Depends(get_current_user)):
    if not has_min_role(user.role, "policymaker"):
        raise HTTPException(status_code=403, detail="Insufficient privileges.")
    return user

@router.post("/api/policy/ai-advisor")
async def get_ai_policy_recommendation(
    current_user: UserSchema = Depends(require_policymaker)
):
    district_id = current_user.district_id
    department_id = current_user.department_id
    
    # 1. Fetch demands currently in the execution queue for this specific policymaker
    query = db.collection("demands")
    
    if district_id and district_id != "all":
        query = query.where("district", "==", district_id)
        
    demands_ref = query.stream()
    
    demand_data = []
    for doc in demands_ref:
        d = doc.to_dict() or {}
        status = d.get("status")
        # filter by category manually if needed or in query
        if department_id and department_id != "all" and d.get("category") != department_id:
            continue
            
        demand_data.append({
            "id": doc.id,
            "title": d.get("english_translation", d.get("original_text", "")),
            "votes": d.get("vote_count", 0),
            "feasibility_score": d.get("feasibility_score", "N/A"),
            "status": status
        })

    if not demand_data:
        return {"recommendation_markdown": "Not enough verified data to generate a policy recommendation."}

    # 2. Initialize Gemini 1.5 Flash
    model = GenerativeModel("gemini-1.5-flash-002")
    
    # 3. The highly-engineered System Prompt
    prompt = f"""
    You are an expert Public Policy Advisor for a municipal government in India. 
    Analyze the following list of verified, field-inspected public infrastructure demands for the {department_id} department.

    DATA:
    {json.dumps(demand_data, indent=2)}

    Based on the vote velocity and feasibility scores, generate a brief Executive Policy Brief.
    Format your response in clean Markdown with the following sections:
    1. **Primary Immediate Concern:** (Identify the most critical cluster of demands)
    2. **Estimated Impact:** (What happens if this is resolved vs ignored)
    3. **Actionable Policy Recommendation:** (A specific, pragmatic directive the policymaker should enact right now, e.g., "Authorize emergency road patching contract for Zone B")
    4. **Resource Allocation Suggestion:** (How to prioritize the budget across these items)
    
    Keep it professional, highly analytical, and concise (under 250 words). Do not invent data. Base it strictly on the provided JSON.
    """

    response = model.generate_content(prompt)
    
    return {"recommendation_markdown": response.text}
