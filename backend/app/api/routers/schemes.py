from fastapi import APIRouter
from app.calculators.schemes_config import SCHEMES_CONFIG_REGISTRY

router = APIRouter(prefix="/api", tags=["schemes"])

@router.get("/schemes")
def list_schemes():
    return {
        "schemes": SCHEMES_CONFIG_REGISTRY,
        "disclaimer": "Scheme parameters are verified against state micro-credit guidelines and district industry refinance frameworks."
    }
