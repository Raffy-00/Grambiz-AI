from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from app.services.data.data_quality_service import DataPointTag, DataSourcesAndAssumptions

class LocationInput(BaseModel):
    village: Optional[str] = "Demo Village"
    gram_panchayat: Optional[str] = "Demo Panchayat"
    block: Optional[str] = "Demo Block"
    district: Optional[str] = "Demo District"
    state: Optional[str] = "Tamil Nadu"
    pincode: Optional[str] = "600001"
    latitude: Optional[float] = 13.0125
    longitude: Optional[float] = 79.9754

class CapitalInput(BaseModel):
    margin_capital: float = Field(..., gt=0, description="Own capital contribution in INR")

class FinancialCalculationRequest(BaseModel):
    margin_capital: float = Field(..., gt=0, description="Own capital contribution in INR")
    beneficiary_ratio: Optional[float] = 0.10

class BusinessInput(BaseModel):
    category: str = Field(..., description="Business category e.g. Dairy, Poultry, Retail")
    business_name: Optional[str] = Field(default=None, description="Proposed enterprise or shop name e.g. Sri Lakshmi Dairy")
    custom_category: Optional[str] = None
    description: Optional[str] = None
    products_services: Optional[List[str]] = []
    target_customers: Optional[str] = "Local residents"
    experience: Optional[str] = "Beginner"
    location_status: Optional[str] = "Planning to rent"
    existing_customers: Optional[str] = "No"
    target_market: Optional[str] = "Local village"
    expected_selling_price: Optional[float] = None
    expected_monthly_sales: Optional[float] = None
    estimated_startup_cost: Optional[float] = None

class CustomBusinessInput(BaseModel):
    name: str = Field(..., min_length=2, description="Custom business name")
    category: str = Field(..., description="Category e.g. Automotive Services, Retail, Technology")
    description: str = Field(..., description="Short business description")
    products_services: List[str] = Field(default_factory=list)
    target_customers: Optional[str] = "Local vehicle owners & residents"
    experience: Optional[str] = "Beginner"
    expected_selling_price: Optional[float] = 50.0
    expected_monthly_sales: Optional[float] = 500.0
    estimated_startup_cost: Optional[float] = 100000.0

class BusinessCatalogItem(BaseModel):
    id: str
    name: str
    category: str
    description: str
    products_services: List[str]
    target_customers: str
    default_cost_range: str
    default_margin_range: str
    active: bool = True

class IdeaDiscoveryRequest(BaseModel):
    location: LocationInput
    capital: float
    experience: Optional[str] = "Beginner"
    skills: Optional[List[str]] = []
    interests: Optional[List[str]] = []
    space_available: Optional[str] = "Rented Shop"

class SuggestedIdeaItem(BaseModel):
    id: str
    name: str
    category: str
    fit_rationale: str
    estimated_capital: float
    market_opportunity: str
    risk_level: str
    confidence_level: str
    data_status: str = "ESTIMATED"

class IdeaDiscoveryResponse(BaseModel):
    ideas: List[SuggestedIdeaItem]
    disclaimer: str = "Preliminary business ideas based on capital and location profile."

class AssessmentRequest(BaseModel):
    user_id: Optional[str] = None
    location: LocationInput
    capital: CapitalInput
    business: BusinessInput

class FinancialResult(BaseModel):
    margin_capital: float
    project_cost: float
    loan_amount: float
    beneficiary_ratio: float = 0.10
    loan_ratio: float = 0.90
    scheme_name: str
    max_funding: float
    interest_rate: float
    tenure_years: int
    moratorium_months: int
    monthly_emi: float
    total_interest: float
    total_repayment: float
    cap_exceeded: bool = False
    max_supported_project_cost: Optional[float] = None
    cap_warning_message: Optional[str] = None

class ScoreComponentExplanation(BaseModel):
    name: str
    score: int
    explanation: str
    supporting_factors: List[str] = []
    potential_improvements: List[str] = []

class FeasibilityScoreExplanation(BaseModel):
    market_potential: ScoreComponentExplanation
    competition: ScoreComponentExplanation
    capital_adequacy: ScoreComponentExplanation
    profit_potential: ScoreComponentExplanation
    risk_score: ScoreComponentExplanation
    experience_fit: ScoreComponentExplanation
    scalability: ScoreComponentExplanation

class ConfidenceRating(BaseModel):
    level: str  # HIGH, MEDIUM, LOW
    score: int  # 0-100
    data_quality_label: str
    reasons: List[str]

class FeasibilityScore(BaseModel):
    overall_score: int
    label: str  # Strong Potential, Moderate Potential, Needs Validation, High Risk
    market_potential: int
    competition: int
    capital_adequacy: int
    profit_potential: int
    risk_score: int
    experience_fit: int
    scalability: int
    explanation: Optional[FeasibilityScoreExplanation] = None

class MarketReach(BaseModel):
    radius_5km_reach: str
    radius_10km_reach: str
    primary_segments: List[str]
    demand_indicator: str
    data_status: str = "ESTIMATED"

class SWOTAnalysis(BaseModel):
    strengths: List[str]
    weaknesses: List[str]
    opportunities: List[str]
    threats: List[str]

class ThreatItem(BaseModel):
    risk_name: str
    severity: str  # Low, Medium, High
    mitigation: str

class PricingGuidance(BaseModel):
    market_price_range: str
    suggested_starting_price: str
    estimated_gross_margin: str
    cost_considerations: List[str]
    data_status: str = "ESTIMATED"

class ActionPlan(BaseModel):
    this_week: List[str]
    before_applying: List[str]
    before_starting: List[str]
    checked_tasks: Optional[Dict[str, bool]] = {}

class NearbyBusinessItem(BaseModel):
    id: str
    name: str
    category: str
    latitude: float
    longitude: float
    distance_km: float
    address: Optional[str] = "Local Area"
    source_name: str = "OpenStreetMap"
    data_status: str = "MAPPED BUSINESS"
    sector: Optional[str] = None

class BusinessTrajectoryTimeline(BaseModel):
    month_1_3: str
    month_4_6: str
    month_7_12: str

class BusinessTrajectory(BaseModel):
    estimated_monthly_revenue_min: float
    estimated_monthly_revenue_max: float
    estimated_monthly_op_cost: float
    estimated_net_profit_min: float
    estimated_net_profit_max: float
    estimated_daily_customers: str
    breakeven_months: str
    viability_rate_percentage: int
    timeline_stages: BusinessTrajectoryTimeline
    competitive_advantage_tactics: List[str] = []
    ai_verdict_audio_text: str

class BusinessAnalysisResult(BaseModel):
    business_name: Optional[str] = None
    market_reach: MarketReach
    opportunity_analysis: List[str]
    swot: SWOTAnalysis
    threats: List[ThreatItem]
    competitor_count: str
    competition_level: str
    competitors: Optional[List[NearbyBusinessItem]] = []
    business_trajectory: Optional[BusinessTrajectory] = None
    pricing: PricingGuidance
    feasibility_score: FeasibilityScore
    confidence_rating: ConfidenceRating
    data_sources: DataSourcesAndAssumptions
    recommendation_summary: str
    recommendation_why: List[str]
    recommendation_assumptions: List[str]
    recommendation_risks: List[str]
    recommendation_verify_first: List[str]
    recommendation_steps: List[str]
    action_plan: ActionPlan

class WorkingCapitalInput(BaseModel):
    rent: float = 0
    raw_materials: float = 0
    electricity: float = 0
    labour: float = 0
    transport: float = 0
    marketing: float = 0
    other: float = 0

class WorkingCapitalResult(BaseModel):
    total_monthly_op_cost: float
    reserve_3_months: float

class BudgetAllocationInput(BaseModel):
    equipment: float = 0
    inventory: float = 0
    infrastructure: float = 0
    working_capital: float = 0
    marketing: float = 0
    contingency: float = 0

class BudgetAllocationResult(BaseModel):
    total_allocated: float
    project_cost: float
    is_valid: bool
    remaining: float

class FullAssessmentResponse(BaseModel):
    id: str
    created_at: str
    location: LocationInput
    capital: CapitalInput
    business: BusinessInput
    financial_result: FinancialResult
    business_analysis: BusinessAnalysisResult
    working_capital: WorkingCapitalResult
    budget_allocation: BudgetAllocationResult
    disclaimer: str

class ComparisonRequest(BaseModel):
    categories: List[str] = Field(..., min_length=2, max_length=3)
    margin_capital: float
    location: LocationInput

class BusinessComparisonItem(BaseModel):
    category: str
    overall_score: int
    market_potential: int
    competition: int
    capital_fit: int
    profit_potential: int
    risk: int
    experience_fit: int
    scalability: int

class ComparisonResult(BaseModel):
    items: List[BusinessComparisonItem]
    recommended_option: str
    recommendation_why: str
    disclaimer: str = "This is a preliminary AI recommendation, not a guarantee of business success."

class ScenarioSimulatorInput(BaseModel):
    margin_capital: float
    category: str
    selling_price: float
    monthly_sales_volume: float
    monthly_operating_cost: float

class ScenarioSummaryCard(BaseModel):
    estimated_revenue: float
    estimated_operating_cost: float
    estimated_gross_profit: float
    net_margin_pct: float
    working_capital_requirement: float
    project_cost: float
    estimated_loan: float
    monthly_emi: float

class ScenarioSimulatorResult(BaseModel):
    current_scenario: ScenarioSummaryCard
    new_scenario: ScenarioSummaryCard
    revenue_delta: float
    gross_profit_delta: float
    disclaimer: str = "Simulated scenario estimates based on user parameters."

class GeocodeResponse(BaseModel):
    display_name: str
    village: Optional[str] = None
    district: Optional[str] = None
    block: Optional[str] = None
    suburb: Optional[str] = None
    town: Optional[str] = None
    state: Optional[str] = None
    postcode: Optional[str] = None
    latitude: float
    longitude: float

class NearbyBusinessesRequest(BaseModel):
    latitude: float
    longitude: float
    radius_km: float = 5.0
    business_category: str = "Dairy"
    business_name: Optional[str] = None
    location_name: Optional[str] = None

class NearbyBusinessesResponse(BaseModel):
    center_latitude: float
    center_longitude: float
    radius_km: float
    category: str
    count_5km: int
    count_10km: int
    count_5_to_10km: Optional[int] = 0
    competition_level: str
    businesses: List[NearbyBusinessItem]
    data_status: str = "MAPPED BUSINESS"

class ChatMessage(BaseModel):
    role: str
    content: str

class AIChatRequest(BaseModel):
    messages: List[ChatMessage]
    context: Optional[Dict[str, Any]] = None
    language: Optional[str] = "en"

class AIChatResponse(BaseModel):
    reply: str
