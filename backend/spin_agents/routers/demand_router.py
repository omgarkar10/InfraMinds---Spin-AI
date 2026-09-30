from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
import time
from firebase_admin import storage
from spin_agents.auth import get_current_user, require_staff
from spin_agents.models import UserSchema
from spin_agents.schemas import CitizenMessage, PipelineRequest
from spin_agents.services.demand_service import process_citizen_webhook, process_pipeline_run, get_demands_list, cast_vote, get_demand_by_id, get_user_votes

router = APIRouter(tags=["Demands"])

@router.post("/webhook/citizen")
async def citizen_webhook(payload: CitizenMessage):
    """Public webhook for citizen-facing channels (WhatsApp, Telegram, PWA)."""
    return await process_citizen_webhook(payload.model_dump())

from fastapi import Request, Response
import os

@router.get("/webhook/whatsapp")
async def verify_whatsapp_webhook(request: Request):
    """Webhook Verification for Meta/WhatsApp."""
    mode = request.query_params.get("hub.mode")
    token = request.query_params.get("hub.verify_token")
    challenge = request.query_params.get("hub.challenge")

    if mode and token:
        if mode == "subscribe" and token == os.getenv("WHATSAPP_VERIFY_TOKEN", "my_secure_token"):
            return Response(content=challenge, status_code=200)
        else:
            raise HTTPException(status_code=403, detail="Verification token mismatch")
    raise HTTPException(status_code=400, detail="Missing parameters")

@router.post("/webhook/whatsapp")
async def handle_whatsapp_webhook(request: Request):
    """Handle incoming WhatsApp messages from citizens."""
    body = await request.json()
    
    # Meta webhook structure
    # body["entry"][0]["changes"][0]["value"]["messages"][0]
    try:
        if body.get("object") == "whatsapp_business_account":
            for entry in body.get("entry", []):
                for change in entry.get("changes", []):
                    value = change.get("value", {})
                    messages = value.get("messages", [])
                    contacts = value.get("contacts", [])
                    
                    for msg in messages:
                        sender_phone = msg.get("from")
                        msg_type = msg.get("type")
                        text = ""
                        
                        if msg_type == "text":
                            text = msg.get("text", {}).get("body", "")
                        elif msg_type == "audio":
                            audio_id = msg.get("audio", {}).get("id")
                            text = f"[Audio ID: {audio_id}]" # Need Graph API call to download in full implementation
                            
                        # Map to internal schema
                        citizen_msg = {
                            "user_id": sender_phone,
                            "text": text,
                            "channel": "whatsapp",
                            "source_language": "hi", # We can detect this later
                        }
                        
                        # Process via pipeline
                        # We should run this as a background task to return 200 OK fast
                        from fastapi import BackgroundTasks
                        # Assuming background tasks or just await it if fast enough
                        await process_citizen_webhook(citizen_msg)
                        
            return Response(content="EVENT_RECEIVED", status_code=200)
    except Exception as e:
        print("Error processing whatsapp payload:", e)
        
    # Return 200 even on errors to prevent Meta from retrying indefinitely
    return Response(content="EVENT_RECEIVED", status_code=200)

@router.post("/api/pipeline/run")
async def pipeline_run(
    payload: PipelineRequest,
    current_user: UserSchema = Depends(get_current_user),
):
    """Run the 3-agent pipeline. Requires a valid auth token."""
    return await process_pipeline_run(payload.model_dump())

@router.get("/api/demands")
async def list_demands(
    limit: int = 50,
    author_user_id: Optional[str] = None
):
    """List all demands (public feed)."""
    return get_demands_list(limit, author_user_id)

@router.get("/api/demands/{demand_id}")
async def get_single_demand(demand_id: str):
    """Get a single demand detail."""
    demand = get_demand_by_id(demand_id)
    if not demand:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Demand not found")
    return demand

@router.post("/api/demands/{demand_id}/vote")
async def vote_for_demand(
    demand_id: str,
    current_user: UserSchema = Depends(get_current_user),
):
    """Cast a vote for a demand."""
    success = cast_vote(demand_id, current_user.id)
    return {"status": "success" if success else "already_voted"}

@router.get("/api/users/me/votes")
async def my_votes(
    current_user: UserSchema = Depends(get_current_user),
):
    """Get list of demand IDs the user has voted for."""
    return {"voted_demand_ids": get_user_votes(current_user.id)}

@router.post("/api/upload")
async def upload_file(
    request: Request,
    file: UploadFile = File(...),
    current_user: UserSchema = Depends(get_current_user)
):
    """Upload evidence to Firebase storage."""
    try:
        bucket = storage.bucket()
        timestamp = int(time.time())
        filename = file.filename.replace(' ', '_')
        blob_path = f"demands/{current_user.id}/{timestamp}_{filename}"
        
        blob = bucket.blob(blob_path)
        file.file.seek(0)
        blob.upload_from_file(file.file, content_type=file.content_type)
        
        # Make the blob publicly viewable
        blob.make_public()
        
        return {"url": blob.public_url, "filename": filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
