import uuid
import datetime
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import AnalysisDraft, ChatMessageRecord, AssessmentRecord, User

router = APIRouter(prefix="/api/user", tags=["user_sync"])

class DraftPayload(BaseModel):
    user_id: str = Field(..., description="User ID or Mobile number")
    current_step: int = 1
    business_data: Optional[Dict[str, Any]] = None
    location_data: Optional[Dict[str, Any]] = None
    capital_data: Optional[Dict[str, Any]] = None
    feasibility_data: Optional[Dict[str, Any]] = None
    completed_steps: Optional[Any] = None
    last_platform: str = "web" # 'web' or 'mobile'

class ChatMessagePayload(BaseModel):
    user_id: str
    role: str # 'user' or 'assistant'
    content: str
    timestamp: Optional[str] = None

class AuthRequest(BaseModel):
    phone: str
    name: Optional[str] = "Entrepreneur"
    language: Optional[str] = "en"

@router.post("/auth")
def authenticate_user(payload: AuthRequest, db: Session = Depends(get_db)):
    clean_phone = payload.phone.strip()
    user = db.query(User).filter((User.id == clean_phone) | (User.phone_or_email == clean_phone)).first()
    if not user:
        user = User(
            id=clean_phone,
            name=payload.name or "Entrepreneur",
            phone_or_email=clean_phone,
            preferred_language=payload.language or "en"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        if payload.name and payload.name != "Entrepreneur":
            user.name = payload.name
        if payload.language:
            user.preferred_language = payload.language
        db.commit()

    # Also check if user has an existing draft
    draft = db.query(AnalysisDraft).filter(AnalysisDraft.user_id == clean_phone).first()

    return {
        "status": "success",
        "user": {
            "id": user.id,
            "name": user.name or "Entrepreneur",
            "phone": user.phone_or_email,
            "language": user.preferred_language or "en"
        },
        "has_active_draft": draft is not None
    }

@router.get("/draft")
def get_user_draft(user_id: str = Query(..., description="User ID or Phone"), db: Session = Depends(get_db)):
    draft = db.query(AnalysisDraft).filter(AnalysisDraft.user_id == user_id).first()
    if not draft:
        return {"has_draft": False, "draft": None}
    
    return {
        "has_draft": True,
        "draft": {
            "user_id": draft.user_id,
            "current_step": draft.current_step,
            "business_data": draft.business_data or {},
            "location_data": draft.location_data or {},
            "capital_data": draft.capital_data or {},
            "feasibility_data": draft.feasibility_data or {},
            "completed_steps": draft.completed_steps if draft.completed_steps is not None else [],
            "last_platform": draft.last_platform,
            "updated_at": draft.updated_at.isoformat() if draft.updated_at else None
        }
    }

@router.post("/draft")
def save_user_draft(payload: DraftPayload, db: Session = Depends(get_db)):
    draft = db.query(AnalysisDraft).filter(AnalysisDraft.user_id == payload.user_id).first()
    now = datetime.datetime.now(datetime.timezone.utc)

    if not draft:
        draft = AnalysisDraft(
            id=payload.user_id,
            user_id=payload.user_id,
            current_step=payload.current_step,
            business_data=payload.business_data,
            location_data=payload.location_data,
            capital_data=payload.capital_data,
            feasibility_data=payload.feasibility_data,
            completed_steps=payload.completed_steps,
            last_platform=payload.last_platform,
            updated_at=now
        )
        db.add(draft)
    else:
        draft.current_step = payload.current_step
        if payload.business_data is not None:
            draft.business_data = payload.business_data
        if payload.location_data is not None:
            draft.location_data = payload.location_data
        if payload.capital_data is not None:
            draft.capital_data = payload.capital_data
        if payload.feasibility_data is not None:
            draft.feasibility_data = payload.feasibility_data
        if payload.completed_steps is not None:
            draft.completed_steps = payload.completed_steps
        draft.last_platform = payload.last_platform
        draft.updated_at = now

    db.commit()
    return {
        "status": "synchronized",
        "user_id": payload.user_id,
        "current_step": draft.current_step,
        "last_platform": draft.last_platform,
        "updated_at": now.isoformat()
    }

@router.delete("/draft")
def clear_user_draft(user_id: str = Query(...), db: Session = Depends(get_db)):
    draft = db.query(AnalysisDraft).filter(AnalysisDraft.user_id == user_id).first()
    if draft:
        db.delete(draft)
        db.commit()
    return {"status": "cleared", "user_id": user_id}

@router.get("/reports")
def get_user_reports(user_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(AssessmentRecord)
    if user_id:
        query = query.filter(AssessmentRecord.user_id == user_id)
    records = query.order_by(AssessmentRecord.created_at.desc()).limit(30).all()

    results = []
    for r in records:
        if r.raw_json_data:
            data = dict(r.raw_json_data)
            data["id"] = r.id
            data["user_id"] = r.user_id
            results.append(data)
    return results

@router.get("/chat")
def get_chat_history(user_id: str = Query(...), db: Session = Depends(get_db)):
    messages = db.query(ChatMessageRecord).filter(
        ChatMessageRecord.user_id == user_id
    ).order_by(ChatMessageRecord.created_at.asc()).limit(50).all()

    return [
        {
            "id": m.id,
            "role": m.role,
            "content": m.content,
            "timestamp": m.timestamp or (m.created_at.strftime("%I:%M %p") if m.created_at else "")
        }
        for m in messages
    ]

@router.post("/chat")
def append_chat_message(payload: ChatMessagePayload, db: Session = Depends(get_db)):
    msg_id = f"msg-{uuid.uuid4().hex[:8]}"
    time_str = payload.timestamp or datetime.datetime.now().strftime("%I:%M %p")
    record = ChatMessageRecord(
        id=msg_id,
        user_id=payload.user_id,
        role=payload.role,
        content=payload.content,
        timestamp=time_str
    )
    db.add(record)
    db.commit()
    return {"id": msg_id, "status": "stored", "timestamp": time_str}
