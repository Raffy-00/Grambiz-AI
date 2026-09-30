import os
from fastapi import APIRouter
from app.schemas.schemas import AIChatRequest, AIChatResponse
from app.services.feasibility_engine import generate_ai_chat_response

router = APIRouter(prefix="/api/ai", tags=["ai"])

@router.get("/status")
def get_ai_status():
    groq_api_key = (os.getenv("GROQ_API_KEY") or os.getenv("AI_API_KEY") or "").strip().strip('"\'')
    is_configured = bool(groq_api_key and groq_api_key.startswith("gsk_"))
    active_model = os.getenv("AI_MODEL", "qwen/qwen3.8-27b").strip()
    return {
        "status": "online" if is_configured else "rule_based_fallback",
        "configured": is_configured,
        "engine": "Groq Cloud LLM" if is_configured else "Rule-Based Advisory Fallback",
        "model": active_model if is_configured else "Deterministic Engine",
        "key_prefix": groq_api_key[:8] + "..." if is_configured else None
    }


@router.post("/chat", response_model=AIChatResponse)
def ai_chat_endpoint(payload: AIChatRequest):
    messages_dicts = [m.model_dump() for m in payload.messages]
    result = generate_ai_chat_response(
        request=payload,
        messages=messages_dicts,
        context=payload.context,
        lang=payload.language or "en"
    )
    if isinstance(result, AIChatResponse):
        return result
    return AIChatResponse(reply=str(result))

