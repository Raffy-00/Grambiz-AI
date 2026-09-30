export type Language = 'en' | 'ta' | 'hi' | 'ml' | 'kn' | 'mr' | 'te';

export interface LocationInput {
  village: string;
  gram_panchayat?: string;
  block?: string;
  district: string;
  state?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
}

export type LocationData = LocationInput;

export interface CapitalInput {
  margin_capital: number;
}

export type CapitalData = CapitalInput;

export interface BusinessInput {
  enterprise_name?: string;
  business_name?: string;
  category: string;
  custom_category?: string;
  description?: string;
  products_services?: string[];
  target_customers?: string;
  experience?: string;
  location_status?: string;
  existing_customers?: string;
  target_market?: string;
  expected_selling_price?: number;
  expected_monthly_sales?: number;
  estimated_startup_cost?: number;
}

export type BusinessData = BusinessInput;

export interface AssessmentRequest {
  location: LocationInput;
  capital: CapitalInput;
  business: BusinessInput;
}

export interface FinancialResult {
  margin_capital: number;
  project_cost: number;
  loan_amount: number;
  beneficiary_ratio: number;
  loan_ratio: number;
  scheme_name: string;
  max_funding: number;
  interest_rate: number;
  tenure_years: number;
  moratorium_months: number;
  monthly_emi: number;
  total_interest: number;
  total_repayment: number;
  cap_exceeded?: boolean;
  max_supported_project_cost?: number;
  cap_warning_message?: string;
}

export interface ScoreComponentExplanation {
  name: string;
  score: number;
  explanation: string;
  supporting_factors?: string[];
  potential_improvements?: string[];
}

export interface FeasibilityScoreExplanation {
  market_potential: ScoreComponentExplanation;
  competition: ScoreComponentExplanation;
  capital_adequacy: ScoreComponentExplanation;
  profit_potential: ScoreComponentExplanation;
  risk_score: ScoreComponentExplanation;
  experience_fit: ScoreComponentExplanation;
  scalability: ScoreComponentExplanation;
}

export interface ConfidenceRating {
  level: 'HIGH' | 'MEDIUM' | 'LOW';
  score: number;
  data_quality_label: string;
  reasons: string[];
}

export interface FeasibilityScore {
  overall_score: number;
  label: string; // Strong Potential, Moderate Potential, Needs Validation, High Risk
  market_potential: number;
  competition: number;
  capital_adequacy: number;
  profit_potential: number;
  risk_score: number;
  experience_fit: number;
  scalability: number;
  explanation?: FeasibilityScoreExplanation;
}

export type FeasibilityScoreData = FeasibilityScore;

export interface MarketReach {
  radius_5km_reach: string;
  radius_10km_reach: string;
  primary_segments: string[];
  demand_indicator: string;
  data_status: string;
}

export interface SWOTAnalysis {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface ThreatItem {
  risk_name: string;
  severity: string;
  mitigation: string;
}

export interface PricingGuidance {
  market_price_range: string;
  suggested_starting_price: string;
  estimated_gross_margin: string;
  cost_considerations: string[];
  data_status: string;
}

export interface ActionPlan {
  this_week: string[];
  before_applying: string[];
  before_starting: string[];
  checked_tasks?: Record<string, boolean>;
}

export interface BusinessTrajectoryTimeline {
  month_1_3: string;
  month_4_6: string;
  month_7_12: string;
}

export interface BusinessTrajectory {
  estimated_monthly_revenue_min: number;
  estimated_monthly_revenue_max: number;
  estimated_monthly_op_cost: number;
  estimated_net_profit_min: number;
  estimated_net_profit_max: number;
  estimated_daily_customers: string;
  breakeven_months: string;
  viability_rate_percentage: number;
  timeline_stages: BusinessTrajectoryTimeline;
  competitive_advantage_tactics: string[];
  ai_verdict_audio_text: string;
}

export interface BusinessAnalysisResult {
  business_name?: string;
  market_reach: MarketReach;
  opportunity_analysis: string[];
  swot: SWOTAnalysis;
  threats: ThreatItem[];
  competitor_count: string;
  competition_level: string;
  competitors?: NearbyBusiness[];
  business_trajectory?: BusinessTrajectory;
  pricing: PricingGuidance;
  feasibility_score: FeasibilityScore;
  confidence_rating: ConfidenceRating;
  data_sources: {
    demographics?: any;
    competitor_density?: any;
    benchmarks?: any;
    financial_rates?: any;
    location_source?: any;
    population_source?: any;
    competitor_source?: any;
    pricing_source?: any;
    capital_source?: any;
    financial_scheme_source?: any;
    ai_assumptions_source?: any;
    disclaimer_note?: string;
  };
  recommendation_summary: string;
  recommendation_why: string[];
  recommendation_assumptions: string[];
  recommendation_risks: string[];
  recommendation_verify_first: string[];
  recommendation_steps: string[];
  action_plan: ActionPlan;
}

export interface WorkingCapitalResult {
  total_monthly_op_cost: number;
  reserve_3_months: number;
}

export interface BudgetAllocationResult {
  total_allocated: number;
  project_cost: number;
  is_valid: boolean;
  remaining: number;
}

export interface FullAssessmentResponse {
  id: string;
  created_at: string;
  location: LocationInput;
  capital: CapitalInput;
  business: BusinessInput;
  financial_result: FinancialResult;
  business_analysis: BusinessAnalysisResult;
  working_capital: WorkingCapitalResult;
  budget_allocation: BudgetAllocationResult;
  disclaimer: string;
}

export type FullAssessment = FullAssessmentResponse;

export interface BusinessComparisonItem {
  category: string;
  overall_score: number;
  market_potential: number;
  competition: number;
  capital_fit: number;
  profit_potential: number;
  risk: number;
  experience_fit: number;
  scalability: number;
}

export interface ComparisonResult {
  items: BusinessComparisonItem[];
  recommended_option: string;
  recommendation_why: string;
  disclaimer: string;
}

export interface ScenarioSummaryCard {
  estimated_revenue: number;
  estimated_operating_cost: number;
  estimated_gross_profit: number;
  net_margin_pct: number;
  working_capital_requirement: number;
  project_cost: number;
  estimated_loan: number;
  monthly_emi: number;
}

export interface ScenarioSimulatorInput {
  margin_capital: number;
  category: string;
  selling_price: number;
  monthly_sales_volume: number;
  monthly_operating_cost: number;
}

export interface ScenarioSimulatorResult {
  current_scenario: ScenarioSummaryCard;
  new_scenario: ScenarioSummaryCard;
  revenue_delta: number;
  gross_profit_delta: number;
  disclaimer: string;
}

export interface SchemeConfig {
  name: string;
  min_project_cost: number;
  max_project_cost: number;
  funding_percentage: number;
  max_loan: number;
  interest_rate: number;
  tenure_years: number;
  moratorium_months: number;
  source: string;
  effective_date: string;
  last_verified_at: string;
}

export interface NearbyBusiness {
  id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  distance_km: number;
  address?: string;
  source_name: string;
  data_status: string;
}

export interface NearbyBusinessesResponse {
  center_latitude: number;
  center_longitude: number;
  radius_km: number;
  category: string;
  count_5km: number;
  count_10km: number;
  immediate_5km_count?: number;
  extended_10km_count?: number;
  competition_level: string;
  businesses: NearbyBusiness[];
  data_status: string;
  primary_source?: string;
  google_places_status?: string;
}

export interface GeocodeLocation {
  display_name: string;
  village?: string;
  town?: string;
  suburb?: string;
  county?: string;
  district?: string;
  state?: string;
  postcode?: string;
  latitude: number;
  longitude: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface DemoScenario {
  id: string;
  title: string;
  subtitle?: string;
  category: string;
  capital: number;
  location: {
    village: string;
    gram_panchayat?: string;
    block?: string;
    district: string;
    state: string;
    pincode?: string;
    latitude?: number;
    longitude?: number;
  };
  description?: string;
}

export interface UserDraftData {
  user_id: string;
  current_step: number;
  business_data?: any;
  location_data?: any;
  capital_data?: any;
  feasibility_data?: any;
  pricing_data?: {
    mode?: 'recommended' | 'manual';
    selling_price?: number;
    unit_cost?: number;
    monthly_volume?: number;
    unit_label?: string;
  };
  budget_data?: {
    equipment?: number;
    inventory?: number;
    infrastructure?: number;
    working_capital?: number;
    marketing?: number;
    total_allocated?: number;
    remaining?: number;
    is_valid?: boolean;
  };
  completed_steps?: number[] | any;
  last_platform?: 'web' | 'mobile' | string;
  updated_at?: string;
}
