from enum import Enum
from typing import Dict, Any, Optional
from pydantic import BaseModel

class DataQualityStatus(str, Enum):
    VERIFIED = "VERIFIED"
    ESTIMATED = "ESTIMATED"
    DEMO_DATA = "DEMO DATA"
    USER_PROVIDED = "USER PROVIDED"
    UNAVAILABLE = "UNAVAILABLE"

class DataPointTag(BaseModel):
    field_name: str
    status: DataQualityStatus
    source_name: str
    description: str
    is_authoritative: bool = False

class DataSourcesAndAssumptions(BaseModel):
    location_source: DataPointTag
    population_source: DataPointTag
    competitor_source: DataPointTag
    pricing_source: DataPointTag
    capital_source: DataPointTag
    financial_scheme_source: DataPointTag
    ai_assumptions_source: DataPointTag
    disclaimer_note: str = (
        "Results are preliminary estimates and should be validated with local market research "
        "and the applicable authority before financial decisions are made."
    )

def generate_default_data_sources(is_demo: bool = True) -> DataSourcesAndAssumptions:
    comp_status = DataQualityStatus.DEMO_DATA if is_demo else DataQualityStatus.ESTIMATED
    pop_status = DataQualityStatus.ESTIMATED
    pricing_status = DataQualityStatus.ESTIMATED

    return DataSourcesAndAssumptions(
        location_source=DataPointTag(
            field_name="Location",
            status=DataQualityStatus.USER_PROVIDED,
            source_name="User Input / Browser Geolocation",
            description="Entered village, block, and district boundaries."
        ),
        population_source=DataPointTag(
            field_name="Population",
            status=pop_status,
            source_name="Rural District Catchment Model (Census Derived)",
            description="Estimated 5km and 10km radius population catchment."
        ),
        competitor_source=DataPointTag(
            field_name="Competitor Data",
            status=comp_status,
            source_name="Local Business Registry & Sample Survey",
            description="Estimated active local service providers in target block."
        ),
        pricing_source=DataPointTag(
            field_name="Pricing Guidance",
            status=pricing_status,
            source_name="Regional Benchmark Price Index",
            description="Estimated product entry price and gross margin ranges."
        ),
        capital_source=DataPointTag(
            field_name="User Capital",
            status=DataQualityStatus.USER_PROVIDED,
            source_name="Entrepreneur Declaration",
            description="User-stated available margin contribution."
        ),
        financial_scheme_source=DataPointTag(
            field_name="Loan Scheme Parameters",
            status=DataQualityStatus.VERIFIED,
            source_name="Official Scheme Policy Parameters",
            description="Verified interest rate, tenure, and moratorium rules.",
            is_authoritative=True
        ),
        ai_assumptions_source=DataPointTag(
            field_name="AI-Generated Analysis",
            status=DataQualityStatus.ESTIMATED,
            source_name="GramBiz Deterministic Feasibility Engine",
            description="Rule-based SWOT, risk assessment, and recommendation generation."
        )
    )
