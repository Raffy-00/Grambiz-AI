from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional
from app.schemas.schemas import (
    AssessmentRequest, BusinessAnalysisResult,
    ComparisonRequest, ComparisonResult,
    ScenarioSimulatorInput, ScenarioSimulatorResult,
    CustomBusinessInput, BusinessCatalogItem,
    IdeaDiscoveryRequest, IdeaDiscoveryResponse
)
from app.services.feasibility_engine import (
    analyze_feasibility, compare_businesses, simulate_scenario
)
from app.services.data.business_catalog_service import (
    search_business_catalog, add_custom_business, discover_business_ideas
)

router = APIRouter(prefix="/api/business", tags=["business"])

@router.get("/catalog", response_model=List[BusinessCatalogItem])
def get_business_catalog(
    q: Optional[str] = Query("", description="Search query for business name or description"),
    category: Optional[str] = Query("", description="Category filter")
):
    return search_business_catalog(query=q, category=category)

@router.post("/custom", response_model=BusinessCatalogItem)
def create_custom_business_endpoint(payload: CustomBusinessInput):
    return add_custom_business(payload)

@router.post("/discover-ideas", response_model=IdeaDiscoveryResponse)
def discover_ideas_endpoint(payload: IdeaDiscoveryRequest):
    return discover_business_ideas(payload)

@router.post("/analyze", response_model=BusinessAnalysisResult)
def analyze_business_endpoint(payload: AssessmentRequest):
    return analyze_feasibility(
        location=payload.location,
        capital=payload.capital,
        business=payload.business
    )

@router.post("/compare", response_model=ComparisonResult)
def compare_businesses_endpoint(payload: ComparisonRequest):
    return compare_businesses(
        categories=payload.categories,
        margin_capital=payload.margin_capital,
        location=payload.location
    )

@router.post("/simulate", response_model=ScenarioSimulatorResult)
def simulate_scenario_endpoint(payload: ScenarioSimulatorInput):
    return simulate_scenario(payload)

# Admin Business Catalog Router Endpoints
@router.get("/admin/catalog", response_model=List[BusinessCatalogItem])
def admin_get_catalog():
    return search_business_catalog()

@router.post("/admin/catalog", response_model=BusinessCatalogItem)
def admin_add_business(payload: CustomBusinessInput):
    return add_custom_business(payload)
