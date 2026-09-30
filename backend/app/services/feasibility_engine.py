import os
import logging
from pathlib import Path
from typing import Dict, Any, List
from dotenv import load_dotenv

# Ensure root .env is loaded
env_file = Path(__file__).resolve().parent.parent.parent.parent / ".env"
if env_file.exists():
    load_dotenv(dotenv_path=env_file)
else:
    load_dotenv()

from app.schemas.schemas import (
    BusinessAnalysisResult, MarketReach, SWOTAnalysis,
    ThreatItem, PricingGuidance, FeasibilityScore, FeasibilityScoreExplanation,
    ScoreComponentExplanation, ConfidenceRating, ActionPlan,
    LocationInput, CapitalInput, BusinessInput,
    ComparisonResult, BusinessComparisonItem,
    ScenarioSimulatorInput, ScenarioSimulatorResult, ScenarioSummaryCard,
    AIChatRequest, AIChatResponse, NearbyBusinessItem,
    BusinessTrajectory, BusinessTrajectoryTimeline
)
from app.services.data.data_quality_service import generate_default_data_sources, DataQualityStatus
from app.services.data.demographic_service import get_demographics_for_location
from app.services.data.places_service import get_competitors_for_category, fetch_nearby_competitors
from app.services.data.market_data_service import get_market_pricing_for_category
from app.calculators.financial import calculate_financial_structure, calculate_scenario_simulation

def calculate_business_trajectory(
    business: BusinessInput,
    capital: CapitalInput,
    comp_nearby: Dict[str, Any],
    price_info: Dict[str, Any],
    location: LocationInput,
    feasibility_score: int
) -> BusinessTrajectory:
    margin = capital.margin_capital
    project_cost = margin / 0.10
    cat_name = business.custom_category if (business.category == "Other" and business.custom_category) else business.category
    biz_name = business.business_name or f"{location.village or 'Local'} {cat_name}"

    monthly_rev_min = round(max(35000, project_cost * 0.45), -2)
    monthly_rev_max = round(max(55000, project_cost * 0.70), -2)
    monthly_op_cost = round(monthly_rev_min * 0.62, -2)
    net_profit_min = round(max(14000, monthly_rev_min - monthly_op_cost), -2)
    net_profit_max = round(max(22000, monthly_rev_max - (monthly_op_cost * 1.12)), -2)

    comp_count = comp_nearby.get("count_5km", 3)
    comp_level = comp_nearby.get("competition_level", "MEDIUM")

    daily_min = max(25, int(30 + (margin / 15000)))
    daily_max = daily_min + 20
    daily_customers_str = f"{daily_min}–{daily_max} customers / day"

    breakeven = "4 to 6 months" if comp_level == "LOW" else ("5 to 7 months" if comp_level == "MEDIUM" else "7 to 9 months")
    village_name = location.village or "your village"

    timeline = BusinessTrajectoryTimeline(
        month_1_3=f"Launch & Customer Acquisition: Set up {biz_name} in {village_name}, source direct wholesale inventory, and build an initial base of 25–35 loyal daily customers.",
        month_4_6=f"Break-Even & Scheme Moratorium: Achieve stable cash flow covering monthly expenses of ~₹{monthly_op_cost:,.0f}. Concessional scheme moratorium protects your working capital.",
        month_7_12=f"Net Profitability & Expansion: Generate ₹{net_profit_min:,.0f}–₹{net_profit_max:,.0f}/month in net profits. Smoothly pay regular loan EMI and expand doorstep delivery."
    )

    tactics = [
        f"Early Bird Advantage: Open {biz_name} 1–2 hours before neighboring {cat_name} outlets to capture morning commuters, tea stalls, and village shoppers.",
        f"Doorstep Delivery & WhatsApp: Provide prompt 30-minute doorstep delivery within 2–3km in {village_name} to win customer loyalty over static shops.",
        f"Verified Freshness & Fair Pricing: Display transparent pricing (target ₹{price_info.get('suggested_starting_price', 'market rates')}) with verified quality."
    ]

    audio_narrative = (
        f"In {village_name}, our AI evaluated your proposed business, {biz_name}, alongside {comp_count} competitors within 5 kilometers. "
        f"With your investment of ₹{margin:,.0f}, {biz_name} has an estimated viability rating of {feasibility_score} percent. "
        f"If you start this venture, your projected monthly net profit will be ₹{net_profit_min:,.0f} to ₹{net_profit_max:,.0f}, "
        f"serving {daily_customers_str}. You can reach break-even within {breakeven} "
        f"with concessional government scheme support."
    )

    return BusinessTrajectory(
        estimated_monthly_revenue_min=monthly_rev_min,
        estimated_monthly_revenue_max=monthly_rev_max,
        estimated_monthly_op_cost=monthly_op_cost,
        estimated_net_profit_min=net_profit_min,
        estimated_net_profit_max=net_profit_max,
        estimated_daily_customers=daily_customers_str,
        breakeven_months=breakeven,
        viability_rate_percentage=feasibility_score,
        timeline_stages=timeline,
        competitive_advantage_tactics=tactics,
        ai_verdict_audio_text=audio_narrative
    )

def analyze_feasibility(
    location: LocationInput,
    capital: CapitalInput,
    business: BusinessInput
) -> BusinessAnalysisResult:
    cat_name = business.custom_category if (business.category == "Other" and business.custom_category) else business.category
    
    # Fetch Modular Data Services
    demo_info = get_demographics_for_location(location.village or "Village", location.district or "District")
    comp_nearby = fetch_nearby_competitors(
        latitude=location.latitude or 13.0125,
        longitude=location.longitude or 79.9754,
        radius_km=5.0,
        category=cat_name,
        business_name=business.business_name or business.custom_category or cat_name,
        location_name=f"{location.village or ''}, {location.district or ''}".strip(', ')
    )
    competitors_list = [NearbyBusinessItem(**b) for b in comp_nearby.get("businesses", [])]
    comp_count_display = f"{comp_nearby.get('count_5km', 3)} direct competitors (5km)"
    comp_level = comp_nearby.get("competition_level", "MEDIUM")

    price_info = get_market_pricing_for_category(cat_name)
    data_sources = generate_default_data_sources(is_demo=True)

    # Market Reach
    market_reach = MarketReach(
        radius_5km_reach=demo_info["radius_5km"],
        radius_10km_reach=demo_info["radius_10km"],
        primary_segments=["Village households", "Local market commuters", "Small regional buyers"],
        demand_indicator="HIGH - Steady rural consumption trend in " + (location.district or "the region"),
        data_status="ESTIMATED"
    )

    # Calculate 7-Dimensional Feasibility Score & Explanations
    capital_val = capital.margin_capital
    exp = business.experience or "Beginner"

    cap_score = 90 if capital_val >= 200000 else (75 if capital_val >= 100000 else 60)
    exp_score = 95 if exp == "Experienced" else (80 if exp == "Some experience" else 68)
    market_score = 82
    comp_score = 75 if comp_level == "LOW" else (65 if comp_level == "MEDIUM" else 55)
    profit_score = 80
    risk_score = 72
    scalability_score = 78

    overall = int((cap_score + exp_score + market_score + comp_score + profit_score + risk_score + scalability_score) / 7)
    
    if overall >= 80:
        label = "Strong Potential"
    elif overall >= 60:
        label = "Moderate Potential"
    elif overall >= 40:
        label = "Needs Validation"
    else:
        label = "High Risk / Weak Fit"

    score_explanation = FeasibilityScoreExplanation(
        market_potential=ScoreComponentExplanation(
            name="Market Potential",
            score=market_score,
            explanation=f"High estimated population reach ({demo_info['radius_5km']}) supports steady local demand.",
            supporting_factors=["Catchment area population > 5,000", f"Daily essential demand for {cat_name}"],
            potential_improvements=["Offer doorstep delivery subscriptions", "Expand marketing to adjacent village clusters"]
        ),
        competition=ScoreComponentExplanation(
            name="Competition Level",
            score=comp_score,
            explanation=f"Estimated competition level is {comp_level} ({comp_count_display}).",
            supporting_factors=["Moderate number of active competitors", "No dominant monopoly provider"],
            potential_improvements=["Focus on superior product freshness/quality", "Offer emergency night availability"]
        ),
        capital_adequacy=ScoreComponentExplanation(
            name="Capital Adequacy",
            score=cap_score,
            explanation=f"Your margin contribution of ₹{capital_val:,.0f} provides suitable leverage under scheme guidelines.",
            supporting_factors=[f"Self-contributed margin of ₹{capital_val:,.0f} (10%)", "Covers minimum required project equity"],
            potential_improvements=["Maintain a 15% contingency reserve", "Seek NABARD/PMEGP margin subsidy subvention"]
        ),
        profit_potential=ScoreComponentExplanation(
            name="Profit Margin Potential",
            score=profit_score,
            explanation=f"Estimated gross margin ({price_info['estimated_gross_margin']}) offers healthy operational return.",
            supporting_factors=["Low fixed overheads in village location", "Healthy product gross margins"],
            potential_improvements=["Introduce high-margin value-added products", "Negotiate bulk wholesale purchasing"]
        ),
        risk_score=ScoreComponentExplanation(
            name="Risk Resilience",
            score=risk_score,
            explanation="Identified local risks have actionable supply-chain and working-capital mitigations.",
            supporting_factors=["Diversified local buyer base", "Multiple alternative raw material suppliers"],
            potential_improvements=["Enforce strict customer credit limits (max ₹1,000)", "Maintain 3-month working capital reserve"]
        ),
        experience_fit=ScoreComponentExplanation(
            name="Experience Fit",
            score=exp_score,
            explanation=f"Self-declared experience level ({exp}) matches initial operational requirements.",
            supporting_factors=[f"Declared background: {exp}", "Accessible domain skills"],
            potential_improvements=["Attend 3-day District DIC skill training program", "Consult local experienced mentor"]
        ),
        scalability=ScoreComponentExplanation(
            name="Scalability",
            score=scalability_score,
            explanation="Business model can expand into adjacent village clusters or added product lines.",
            supporting_factors=["Replicable operational model", "Low initial capital barrier"],
            potential_improvements=["Add secondary service line after 6 months", "Partner with local cooperative distributor"]
        )
    )

    feasibility_score = FeasibilityScore(
        overall_score=overall,
        label=label,
        market_potential=market_score,
        competition=comp_score,
        capital_adequacy=cap_score,
        profit_potential=profit_score,
        risk_score=risk_score,
        experience_fit=exp_score,
        scalability=scalability_score,
        explanation=score_explanation
    )

    # Separate Confidence Rating
    confidence_level = "MEDIUM"
    confidence_score = 72
    quality_label = "Estimated / Sample Data"
    confidence_reasons = [
        "Financial scheme parameters are verified against official government guidelines.",
        "Local competitor density relies on sample block estimates and requires direct local verification.",
        "Demographic catchment population is derived from census benchmarks."
    ]

    confidence_rating = ConfidenceRating(
        level=confidence_level,
        score=confidence_score,
        data_quality_label=quality_label,
        reasons=confidence_reasons
    )

    # SWOT Analysis & Threats
    swot = SWOTAnalysis(
        strengths=[f"Steady daily cash flow potential for {cat_name}", f"Available margin capital of ₹{capital_val:,.0f}"],
        weaknesses=["Requires initial brand building phase", "Working capital locked in initial stock"],
        opportunities=["Unserved sub-clusters in 5km radius", "Government scheme interest subvention support"],
        threats=["Raw material price volatility", "Credit default risk from local buyers"]
    )

    threats = [
        ThreatItem(risk_name="Raw Material Price Volatility", severity="High", mitigation="Establish bulk purchase agreements with wholesale suppliers."),
        ThreatItem(risk_name="Buyer Credit Default Risk", severity="Medium", mitigation="Set customer credit caps (max ₹1,000) and digitize ledgers."),
        ThreatItem(risk_name="Seasonal Demand Slump", severity="Medium", mitigation="Diversify product offerings during festive off-seasons.")
    ]

    pricing = PricingGuidance(
        market_price_range=price_info["market_price_range"],
        suggested_starting_price=price_info["suggested_starting_price"],
        estimated_gross_margin=price_info["estimated_gross_margin"],
        cost_considerations=price_info["cost_considerations"],
        data_status="ESTIMATED"
    )

    action_plan = ActionPlan(
        this_week=[
            f"Talk to 10 potential customers in {location.village or 'your village'} to test interest.",
            "Visit 3 local competitors to observe pricing and product offerings.",
            "Obtain firm quotations from 2 wholesale suppliers."
        ],
        before_applying=[
            "Finalize detailed itemized business budget.",
            "Collect required KYC documents (Aadhaar, PAN, Bank Passbook, Land proof).",
            "Verify scheme guidelines with local bank branch manager.",
            "Confirm financing terms and moratorium treatment."
        ],
        before_starting=[
            "Validate final local demand with advance orders.",
            "Confirm primary supplier contract.",
            "Reserve mandatory 3-month working capital cushion.",
            "Finalize product pricing strategy."
        ],
        checked_tasks={}
    )

    trajectory = calculate_business_trajectory(
        business=business,
        capital=capital,
        comp_nearby=comp_nearby,
        price_info=price_info,
        location=location,
        feasibility_score=overall
    )

    resolved_biz_name = business.business_name or f"{location.village or 'Local'} {cat_name}"

    return BusinessAnalysisResult(
        business_name=resolved_biz_name,
        market_reach=market_reach,
        opportunity_analysis=[
            f"High estimated demand for {resolved_biz_name} ({cat_name}) in {location.district or 'the region'}.",
            "Direct delivery model commands a premium gross margin.",
            "Digital marketing via WhatsApp Business expands reach by 25%."
        ],
        swot=swot,
        threats=threats,
        competitor_count=comp_count_display,
        competition_level=comp_level,
        competitors=competitors_list,
        business_trajectory=trajectory,
        pricing=pricing,
        feasibility_score=feasibility_score,
        confidence_rating=confidence_rating,
        data_sources=data_sources,
        recommendation_summary=f"Proceed with planned rollout for {resolved_biz_name} in {location.village or 'your location'}. Feasibility score ({overall}/100) indicates {label.lower()}.",
        recommendation_why=[
            f"Local market demand for {cat_name} is steady with accessible customer segments.",
            f"Your available margin of ₹{capital_val:,.0f} provides solid project leverage.",
            f"Estimated competition level is {comp_level} in your immediate block ({comp_count_display})."
        ],
        recommendation_assumptions=[
            "10% beneficiary margin contribution with 90% scheme loan funding.",
            "3-month initial moratorium relief prior to regular EMI repayments.",
            "Consistent operational effort and supply-chain stability."
        ],
        recommendation_risks=[
            "Raw material price inflation during peak seasons.",
            "Delayed buyer payments affecting working capital cash flows."
        ],
        recommendation_verify_first=[
            "Local competitor selling prices in your immediate market.",
            "Wholesale supplier price quotations and delivery timelines.",
            "Exact bank loan eligibility criteria and required documentation."
        ],
        recommendation_steps=[
            f"1. Conduct customer survey with 25 local residents in {location.village or 'village'}.",
            "2. Obtain price quotes from 2 wholesale suppliers.",
            "3. Finalize rental lease agreement before loan application.",
            "4. Reserve 3-month working capital cushion."
        ],
        action_plan=action_plan
    )

def compare_businesses(categories: List[str], margin_capital: float, location: LocationInput) -> ComparisonResult:
    items = []
    category_scores = {
        "Dairy": {"market": 82, "comp": 65, "cap": 90, "profit": 78, "risk": 70, "exp": 85, "scale": 75},
        "Textile": {"market": 68, "comp": 52, "cap": 72, "profit": 74, "risk": 60, "exp": 70, "scale": 72},
        "Food Processing": {"market": 76, "comp": 80, "cap": 65, "profit": 81, "risk": 68, "exp": 62, "scale": 80},
        "Grocery": {"market": 85, "comp": 50, "cap": 80, "profit": 65, "risk": 65, "exp": 90, "scale": 70},
        "Retail": {"market": 82, "comp": 55, "cap": 82, "profit": 68, "risk": 65, "exp": 85, "scale": 72},
        "Poultry": {"market": 78, "comp": 75, "cap": 78, "profit": 82, "risk": 58, "exp": 72, "scale": 76}
    }

    best_cat = categories[0]
    highest_overall = 0

    for cat in categories:
        scores = category_scores.get(cat, {"market": 75, "comp": 65, "cap": 75, "profit": 75, "risk": 68, "exp": 75, "scale": 72})
        overall = int((scores["market"] + scores["comp"] + scores["cap"] + scores["profit"] + scores["risk"] + scores["exp"] + scores["scale"]) / 7)
        if overall > highest_overall:
            highest_overall = overall
            best_cat = cat

        items.append(BusinessComparisonItem(
            category=cat,
            overall_score=overall,
            market_potential=scores["market"],
            competition=scores["comp"],
            capital_fit=scores["cap"],
            profit_potential=scores["profit"],
            risk=scores["risk"],
            experience_fit=scores["exp"],
            scalability=scores["scale"]
        ))

    return ComparisonResult(
        items=items,
        recommended_option=best_cat,
        recommendation_why=(
            f"Based on your available capital of ₹{margin_capital:,.0f}, local market benchmarks in {location.district or 'your region'}, "
            f"and competition density, {best_cat} currently has the strongest preliminary feasibility score ({highest_overall}/100)."
        )
    )

def simulate_scenario(input_data: ScenarioSimulatorInput) -> ScenarioSimulatorResult:
    res = calculate_scenario_simulation(
        margin_capital=input_data.margin_capital,
        selling_price=input_data.selling_price,
        monthly_sales_volume=input_data.monthly_sales_volume,
        monthly_operating_cost=input_data.monthly_operating_cost
    )
    return ScenarioSimulatorResult(
        current_scenario=ScenarioSummaryCard(**res["current_scenario"]),
        new_scenario=ScenarioSummaryCard(**res["new_scenario"]),
        revenue_delta=res["revenue_delta"],
        gross_profit_delta=res["gross_profit_delta"],
        disclaimer=res['disclaimer']
    )

def normalize_target_lang(lang_str: Any) -> str:
    if not lang_str:
        return 'en'
    l = str(lang_str).lower().strip()
    if l.startswith('ta') or 'tamil' in l or 'தமிழ்' in l:
        return 'ta'
    if l.startswith('hi') or 'hindi' in l or 'हिन्दी' in l or 'हिंदी' in l:
        return 'hi'
    if l.startswith('mr') or 'marathi' in l or 'मराठी' in l:
        return 'mr'
    if l.startswith('ml') or 'malayalam' in l or 'മലയാളം' in l:
        return 'ml'
    if l.startswith('kn') or 'kannada' in l or 'ಕನ್ನಡ' in l:
        return 'kn'
    if l.startswith('te') or 'telugu' in l or 'తెలుగు' in l:
        return 'te'
    if l.startswith('bn') or 'bengali' in l or 'bangla' in l or 'বাংলা' in l:
        return 'bn'
    return 'en'

def generate_ai_chat_response(
    request: AIChatRequest = None,
    messages: List[Dict[str, Any]] = None,
    context: Dict[str, Any] = None,
    lang: str = "en"
) -> AIChatResponse:
    if request is not None:
        user_msg = request.messages[-1].content if request.messages else ""
        ctx = request.context or {}
        raw_lang = request.language or lang or "en"
    else:
        user_msg = messages[-1].get("content", "") if messages else ""
        ctx = context or {}
        raw_lang = lang or "en"

    target_lang = normalize_target_lang(raw_lang)
    
    biz = ctx.get("business", {}).get("category", "your business")
    loc = ctx.get("location", {}).get("village", "your location")
    margin = float(ctx.get("capital", {}).get("margin_capital") or ctx.get("capital", {}).get("marginCapital") or 100000)
    score = ctx.get("business_analysis", {}).get("feasibility_score", {}).get("overall_score", 78)
    conf = ctx.get("business_analysis", {}).get("confidence_rating", {}).get("level", "MEDIUM")

    # Safely compute and extract financial parameters from context or defaults
    fin = ctx.get("financial_result") or ctx.get("financial") or {}
    project_cost = float(fin.get("project_cost") or fin.get("projectCost") or (margin / 0.10 if margin else 1000000))
    raw_loan = float(fin.get("raw_loan") or fin.get("rawLoan") or (project_cost * 0.90))
    loan = float(fin.get("loan_amount") or fin.get("loanAmount") or raw_loan)
    scheme_obj = fin.get("scheme") if isinstance(fin.get("scheme"), dict) else {}
    scheme_name = fin.get("scheme_name") or scheme_obj.get("name") or ("Micro Finance Scheme" if project_cost <= 140000 else "Term Loan Scheme / PMEGP")
    quarterly_emi = float(fin.get("quarterly_emi") or fin.get("quarterlyEMI") or 0)
    emi = quarterly_emi / 3 if quarterly_emi > 0 else (loan * 0.08 / 12)

    msg_lower = user_msg.lower()

    # 1. Attempt Live Groq LLM Generation if API key is provided
    groq_api_key = (os.getenv("GROQ_API_KEY") or os.getenv("AI_API_KEY") or "").strip().strip('"\'')
    if groq_api_key and groq_api_key.startswith("gsk_"):
        try:
            from groq import Groq
            client = Groq(api_key=groq_api_key)

            LANG_MAP = {
                'hi': 'Hindi (in pure Hindi using Devanagari script)',
                'ta': 'Tamil (in pure Tamil using Tamil script தமிழ்)',
                'te': 'Telugu (in pure Telugu using Telugu script తెలుగు)',
                'mr': 'Marathi (in pure Marathi using Devanagari script मराठी)',
                'bn': 'Bengali (in pure Bengali using Bengali script বাংলা)',
                'kn': 'Kannada (in pure Kannada using Kannada script ಕನ್ನಡ)',
                'ml': 'Malayalam (in pure Malayalam using Malayalam script മലയാളം)',
                'en': 'English'
            }
            lang_instruction = LANG_MAP.get(target_lang, 'English')

            system_instruction = (
                f"You are Udyam Sahayak, an intelligent, empathetic, and trusted AI Business Advisory Assistant for rural and semi-urban entrepreneurs in India.\n\n"
                f"Active Business Evaluation Context:\n"
                f"- Business Venture: {biz}\n"
                f"- Target Village/Location: {loc}\n"
                f"- Margin Capital Contribution: ₹{margin:,.0f} (10% beneficiary equity)\n"
                f"- Total Project Cost: ₹{project_cost:,.0f}\n"
                f"- Feasibility Viability Score: {score}/100 ({conf} confidence rating)\n"
                f"- 90% Bank Scheme Loan: ₹{loan:,.0f}\n"
                f"- Estimated EMI: ₹{emi:,.0f}/month\n"
                f"- Government Scheme: {scheme_name}\n"
                f"- Rural Capital Subsidy: up to 35% under PMEGP (25% for urban / 35% for rural)\n\n"
                f"Response Guidelines:\n"
                f"1. Language Requirement: Respond {lang_instruction}. Write natively and clearly in this language.\n"
                f"2. Keep the answer structured (2-4 clear paragraphs or bullet points), practical, encouraging, and focused on real-world Indian grassroots commerce.\n"
                f"3. Provide realistic guidance on scheme eligibility, bank procedures (Lead District Bank, Jan Samarth portal), suppliers, and working capital.\n"
                f"4. Avoid generic chatbot disclaimers; be an encouraging, practical rural business advisor."
            )

            llm_messages = [{"role": "system", "content": system_instruction}]
            history_list = messages if messages else ([{"role": "user", "content": user_msg}] if user_msg else [])
            for m in history_list[-8:]:
                m_role = m.get("role", "user")
                role_str = "assistant" if m_role in ("assistant", "bot", "ai") else "user"
                m_content = m.get("content") or m.get("text") or ""
                if m_content:
                    llm_messages.append({"role": role_str, "content": m_content})

            candidate_models = [
                os.getenv("AI_MODEL", "qwen/qwen3.8-27b").strip(),
                "qwen/qwen3.8-27b",
                "qwen/qwen3.6-27b",
                "openai/gpt-oss-120b"
            ]
            seen_models = set()
            models_to_try = [x for x in candidate_models if x and not (x in seen_models or seen_models.add(x))]

            llm_reply = None
            for model_name in models_to_try:
                try:
                    completion = client.chat.completions.create(
                        model=model_name,
                        messages=llm_messages,
                        max_tokens=650,
                        temperature=0.6,
                        timeout=12.0
                    )
                    content = completion.choices[0].message.content
                    if content and len(content.strip()) > 10:
                        llm_reply = content.strip()
                        break
                except Exception as model_err:
                    logging.getLogger(__name__).warning("Groq model %s failed: %s", model_name, model_err)
                    continue

            if llm_reply:
                return AIChatResponse(reply=llm_reply)
        except Exception as groq_err:
            logging.getLogger(__name__).warning("Groq AI API call failed, falling back to rule engine: %s", groq_err)

    # 2. Deterministic Rule-Based & Knowledge Engine Fallback
    is_profit = any(w in msg_lower for w in ["profit", "earn", "income", "revenue", "grow", "sales", "margin", "money", "नफा", "लाभ", "லாபம்", "வருமானம்", "வியாபாரம்", "விற்பனை", "లాభం", "ఆదాయం", "মুনাফা", "नफ़ा", "कमाई"])
    is_moratorium = any(w in msg_lower for w in ["moratorium", "grace", "holiday", "emi", "repay", "installment", "pay", "month", "हप्ता", "सवलत", "தவணை", "சலுகை", "மடங்கு", "మొరటోరియం", "किस्त", "কিস্তি", "ಕಂತು"])
    is_scheme = any(w in msg_lower for w in ["loan", "scheme", "subsidy", "pmegp", "mudra", "bank", "fund", "grant", "finance", "borrow", "interest", "कर्ज", "கடன்", "திட்டம்", "மானியம்", "రుణం", "పథకం", "ऋण", "योजना", "ঋণ", "ಸಾಲ"])
    is_half_capital = any(w in msg_lower for w in ["half", "less", "reduce", "cost", "budget", "cheap", "low", "investment", "निम्म्या", "பாதி", "குறைந்த", "செலவு", "సగం", "ఖర్చు", "অর্ধেক", "अर्धा", "ಅರ್ಧ"])
    is_idea = any(w in msg_lower for w in ["idea", "which", "best", "good", "start", "open", "dairy", "grocery", "kirana", "shop", "suitable", "suggest", "தொழில்", "சிறந்த", "தொடங்க", "व्यापार", "व्यवसाय", "शुरू"])
    is_risk = any(w in msg_lower for w in ["risk", "threat", "competitor", "loss", "challenge", "safe", "problem", "danger", "धोके", "ஆபத்து", "சவால்", "போட்டி", "ప్రమాదం", "झুঁকি", "ಸವಾಲು"])
    is_links = any(w in msg_lower for w in ["link", "url", "website", "web", "site", "portal", "இணைப்பு", "வலைத்தளம்", "லிங்க்", "लिंक", "वेबसाइट", "లింక్", "ಲಿಂಕ್", "লিংক", "पोर्टल", "web"])
    is_apply = any(w in msg_lower for w in ["apply", "register", "registration", "document", "license", "portal", "process", "procedure", "udyam", "paper", "விண்ணப்ப", "பதிவு", "சான்றிதழ்", "आवेदन", "पंजीकरण", "कागजात"])

    if is_links:
        proj_cost = float(fin.get("project_cost") or (margin * 10))
        if proj_cost <= 140000:
            if target_lang == "ta":
                reply = f"உங்கள் ₹{proj_cost:,.0f} திட்ட மதிப்பீட்டிற்கு ஏற்ற அதிகாரப்பூர்வ அரசு கடன் தளங்கள் (Micro Finance):\n\n1) முத்ரா திட்டம் (PM MUDRA Shishu - பிணையில்லா கடன்): https://www.mudra.org.in/\n2) ஜன் சமர்த் தேசிய போர்டல் (Jan Samarth Micro Credit): https://www.jansamarth.in/\n3) உத்யம் மித்ரா (Udyami Mitra - SIDBI Micro Loan): https://udyamimitra.in/\n\nஇவை ₹1.40 லட்சத்திற்குட்பட்ட நுண் தொழில்களுக்கு பிரத்யேகமானது. இடைத்தரகர்கள் இன்றி நேரடியாக விண்ணப்பிக்கலாம்."
            elif target_lang == "hi":
                reply = f"आपकी ₹{proj_cost:,.0f} की लागत के लिए उपयुक्त आधिकारिक सरकारी ऋण पोर्टल (Micro Finance Schemes):\n\n1) पीएम मुद्रा पोर्टल (PM MUDRA Shishu - गारंटी-मुक्त ऋण): https://www.mudra.org.in/\n2) जन समर्थ पोर्टल (Jan Samarth Micro Credit): https://www.jansamarth.in/\n3) उद्यमी मित्र (Udyami Mitra - SIDBI Micro): https://udyamimitra.in/\n\nयह ₹1.40 लाख तक के सूक्ष्म व्यवसायों के लिए सीधे ऑनलाइन उपलब्ध हैं।"
            elif target_lang == "te":
                reply = f"మీ ₹{proj_cost:,.0f} ప్రాజెక్ట్ ఖర్చుకు తగిన ప్రభుత్వ రుణ పోర్టల్స్ (Micro Finance):\n\n1) పీఎం ముద్రా పోర్టల్ (PM MUDRA Shishu): https://www.mudra.org.in/\n2) జన్ సమర్థ్ నేషనల్ పోర్టల్: https://www.jansamarth.in/\n3) ఉద్యమి మిత్ర (SIDBI Micro): https://udyamimitra.in/"
            elif target_lang == "bn":
                reply = f"আপনার ₹{proj_cost:,.0f} খরচের জন্য উপযুক্ত সরকারি ঋণ পোর্টাল (Micro Finance):\n\n১) পিএম মুদ্রা পোর্টাল (PM MUDRA Shishu): https://www.mudra.org.in/\n২) জন সমর্থ পোর্টাল (Jan Samarth): https://www.jansamarth.in/\n৩) উদ্যমী মিত্র (Udyami Mitra): https://udyamimitra.in/"
            elif target_lang == "mr":
                reply = f"आपल्या ₹{proj_cost:,.0f} खर्चासाठी योग्य शासकीय कर्ज पोर्टल्स (Micro Finance):\n\n१) पीएम मुद्रा पोर्टल (PM MUDRA Shishu): https://www.mudra.org.in/\n२) जन समर्थ राष्ट्रीय पोर्टल: https://www.jansamarth.in/\n३) उद्यमी मित्र (SIDBI Micro): https://udyamimitra.in/"
            elif target_lang == "kn":
                reply = f"ನಿಮ್ಮ ₹{proj_cost:,.0f} ವೆಚ್ಚಕ್ಕೆ ಸೂಕ್ತವಾದ ಸರ್ಕಾರಿ ಸಾಲ ಪೋರ್ಟಲ್‌ಗಳು (Micro Finance):\n\n1) ಪಿಎಂ ಮುದ್ರಾ ಪೋರ್ಟಲ್: https://www.mudra.org.in/\n2) ಜನ್ ಸಮರ್ಥ್ ಪೋರ್ಟಲ್: https://www.jansamarth.in/\n3) ಉದ್ಯಮಿ ಮಿತ್ರ: https://udyamimitra.in/"
            elif target_lang == "ml":
                reply = f"നിങ്ങളുടെ ₹{proj_cost:,.0f} പ്രോജക്റ്റ് ചെലവിന് അനുയോജ്യമായ ഔദ്യോഗിക സർക്കാർ വായ്പാ പോർട്ടലുകൾ (Micro Finance):\n\n1) പിഎം മുദ്ര പോർട്ടൽ (PM MUDRA Shishu - ഈടില്ലാത്ത വായ്പ): https://www.mudra.org.in/\n2) ജൻ സമർത്ഥ് നാഷണൽ പോർട്ടൽ (Jan Samarth Micro Credit): https://www.jansamarth.in/\n3) ഉദ്യമി മിത്ര (Udyami Mitra - SIDBI Micro): https://udyamimitra.in/\n\nഇവ ₹1.40 ലക്ഷത്തിന് താഴെയുള്ള മൈക്രോ ബിസിനസ്സുകൾക്ക് ഇടനിലക്കാരില്ലാതെ ലഭ്യമാണ്."
            else:
                reply = f"Official Government Loan Portals suitable for your ₹{proj_cost:,.0f} Project Cost (Micro Finance):\n\n1) PM MUDRA Portal (Shishu Scheme - 0 Collateral): https://www.mudra.org.in/\n2) Jan Samarth National Portal (Micro Credit): https://www.jansamarth.in/\n3) Udyami Mitra (SIDBI Micro Finance): https://udyamimitra.in/\n\nThese schemes are specifically eligible for micro enterprises under ₹1.40 Lakhs with zero mediator commission."
        elif proj_cost <= 1000000:
            if target_lang == "ta":
                reply = f"உங்கள் ₹{proj_cost:,.0f} திட்ட மதிப்பீட்டிற்கு ஏற்ற அதிகாரப்பூர்வ அரசு கடன் தளங்கள் (Term Loan & Subsidy):\n\n1) முத்ரா திட்டம் (PM MUDRA Kishore/Tarun - பிணையில்லா கடன்): https://www.mudra.org.in/\n2) PMEGP ஆன்லைன் போர்டல் (KVIC 35% வரை அரசு மானியம்): https://www.kviconline.gov.in/pmegpeportal/\n3) ஜன் சமர்த் தேசிய போர்டல் (Jan Samarth - 200+ வங்கிகள்): https://www.jansamarth.in/\n4) உத்யம் மித்ரா (Udyami Mitra - SIDBI MSME): https://udyamimitra.in/\n\nஇவை ₹1.4 லட்சம் முதல் ₹10 லட்சம் வரையிலான தொழில் கடன்களுக்கு மிகச் சிறந்தவை."
            elif target_lang == "hi":
                reply = f"आपकी ₹{proj_cost:,.0f} की लागत के लिए उपयुक्त सरकारी ऋण पोर्टल (Term Loan & Subsidy):\n\n1) पीएम मुद्रा योजना (Mudra Kishore/Tarun - ₹10 लाख तक): https://www.mudra.org.in/\n2) PMEGP ई-पोर्टल (KVIC 35% सरकारी सब्सिडी): https://www.kviconline.gov.in/pmegpeportal/\n3) जन समर्थ राष्ट्रीय पोर्टल: https://www.jansamarth.in/\n4) उद्यमी मित्र (SIDBI MSME): https://udyamimitra.in/\n\n₹1.4 लाख से ₹10 लाख के लिए मुद्रा और PMEGP सब्सिडी दोनों उपलब्ध हैं।"
            elif target_lang == "te":
                reply = f"మీ ₹{proj_cost:,.0f} ప్రాజెక్ట్ ఖర్చుకు తగిన ప్రభుత్వ రుణ పోర్టల్స్ (Term Loan & Subsidy):\n\n1) పీఎం ముద్రా పోర్టల్ (₹10 లక్షల వరకు): https://www.mudra.org.in/\n2) PMEGP పోర్టల్ (35% సబ్సిడీ): https://www.kviconline.gov.in/pmegpeportal/\n3) జన్ సమర్థ్ నేషనల్ పోர்టల్: https://www.jansamarth.in/\n4) ఉద్యమి మిత్ర: https://udyamimitra.in/"
            elif target_lang == "bn":
                reply = f"আপনার ₹{proj_cost:,.0f} খরচের জন্য উপযুক্ত সরকারি পোর্টাল (Term Loan & Subsidy):\n\n১) পিএম মুদ্রা পোর্টাল (১০ লাখ টাকা পর্যন্ত): https://www.mudra.org.in/\n২) PMEGP ই-পোর্টাল (৩৫% ভর্তুকি): https://www.kviconline.gov.in/pmegpeportal/\n৩) জন সমর্থ পোর্টাল: https://www.jansamarth.in/\n৪) উদ্যমী মিত্র: https://udyamimitra.in/"
            elif target_lang == "mr":
                reply = f"आपल्या ₹{proj_cost:,.0f} खर्चासाठी योग्य शासकीय पोर्टल्स (Term Loan & Subsidy):\n\n१) पीएम मुद्रा पोर्टल (१० लाखांपर्यंत): https://www.mudra.org.in/\n२) PMEGP ई-पोर्टल (३५% अनुदान): https://www.kviconline.gov.in/pmegpeportal/\n३) जन समर्थ राष्ट्रीय पोर्टल: https://www.jansamarth.in/\n४) उद्यमी मित्र: https://udyamimitra.in/"
            elif target_lang == "kn":
                reply = f"ನಿಮ್ಮ ₹{proj_cost:,.0f} ವೆಚ್ಚಕ್ಕೆ ಸೂಕ್ತವಾದ ಸರ್ಕಾರಿ ಪೋರ್ಟಲ್‌ಗಳು (Term Loan & Subsidy):\n\n1) ಪಿಎಂ ಮುದ್ರಾ ಪೋರ್ಟಲ್: https://www.mudra.org.in/\n2) PMEGP ಪೋರ್ಟಲ್ (35% ಸಬ್ಸಿಡಿ): https://www.kviconline.gov.in/pmegpeportal/\n3) ಜನ್ ಸಮರ್ಥ್ ಪೋರ್ಟಲ್: https://www.jansamarth.in/\n4) ಉದ್ಯಮಿ ಮಿತ್ರ: https://udyamimitra.in/"
            elif target_lang == "ml":
                reply = f"നിങ്ങളുടെ ₹{proj_cost:,.0f} ചെലവിന് അനുയോജ്യമായ സർക്കാർ വായ്പാ പോർട്ടലുകൾ (Term Loan & 35% Subsidy):\n\n1) പിഎം മുദ്ര പോർട്ടൽ (MUDRA Kishore/Tarun - ₹10 ലക്ഷം വരെ): https://www.mudra.org.in/\n2) PMEGP ഓൺലൈൻ പോർട്ടൽ (KVIC 35% മൂലധന സബ്‌സിഡി): https://www.kviconline.gov.in/pmegpeportal/\n3) ജൻ സമർത്ഥ് നാഷണൽ പോർട്ടൽ: https://www.jansamarth.in/\n4) ഉദ്യമി മിത്ര: https://udyamimitra.in/\n\n₹1.4 ലക്ഷം മുതൽ ₹50 ലക്ഷം വരെയുള്ള സംരംഭങ്ങൾക്ക് PMEGP സബ്‌സിഡി ലഭ്യമാണ്."
            else:
                reply = f"Official Government Loan Portals suitable for your ₹{proj_cost:,.0f} Project Cost (Term Loan & Subsidy):\n\n1) PM MUDRA Portal (Kishore/Tarun - Up to ₹10 Lakhs): https://www.mudra.org.in/\n2) PMEGP Official e-Portal (Up to 35% Capital Subsidy): https://www.kviconline.gov.in/pmegpeportal/\n3) Jan Samarth National Portal (Unified 200+ Banks): https://www.jansamarth.in/\n4) Udyami Mitra (SIDBI MSME Credit): https://udyamimitra.in/\n\nEligible for both collateral-free MUDRA funding and PMEGP non-repayable capital subsidies."
        elif proj_cost <= 5000000:
            if target_lang == "ta":
                reply = f"உங்கள் ₹{proj_cost:,.0f} திட்ட மதிப்பீட்டிற்கு ஏற்ற அரசு கடன் தளங்கள் (PMEGP 35% மானியம் & MSME கடன்):\n\n1) PMEGP ஆன்லைன் போர்டல் (KVIC 35% வரை மானியம் - ₹50 லட்சம் வரை): https://www.kviconline.gov.in/pmegpeportal/\n2) ஜன் சமர்த் தேசிய போர்டல் (Jan Samarth MSME Term Loan): https://www.jansamarth.in/\n3) உத்யம் மித்ரா (CGTMSE பிணையில்லா கடன் உத்தரவாதம்): https://udyamimitra.in/\n\nகுறிப்பு: முத்ரா திட்டம் ₹10 லட்சத்துடன் முடிவடைகிறது. உங்கள் தொகைக்கு PMEGP & CGTMSE மட்டுமே பொருந்தும்."
            elif target_lang == "hi":
                reply = f"आपकी ₹{proj_cost:,.0f} की लागत के लिए उपयुक्त ऋण पोर्टल (PMEGP 35% सब्सिडी व MSME लोन):\n\n1) PMEGP ई-पोर्टल (KVIC 35% तक सब्सिडी - ₹50 लाख तक): https://www.kviconline.gov.in/pmegpeportal/\n2) जन समर्थ राष्ट्रीय पोर्टल (MSME टर्म लोन): https://www.jansamarth.in/\n3) उद्यमी मित्र (CGTMSE गारंटी): https://udyamimitra.in/\n\nनोट: मुद्रा योजना ₹10 लाख तक ही सीमित है। ₹10 लाख से ₹50 लाख के लिए PMEGP सबसे अधिक लाभकारी है।"
            elif target_lang == "te":
                reply = f"మీ ₹{proj_cost:,.0f} ఖర్చుకు తగిన పోర్టల్స్ (PMEGP 35% సబ్సిడీ):\n\n1) PMEGP పోర్టల్ (₹50 లక్షల వరకు): https://www.kviconline.gov.in/pmegpeportal/\n2) జన్ సమర్థ్ నేషనల్ పోర్టల్: https://www.jansamarth.in/\n3) ఉద్యమి మిత్ర (CGTMSE గ్యారెంటీ): https://udyamimitra.in/\n\nగమనిక: ముద్రా పథకం ₹10 లక్షలకే పరిమితం."
            elif target_lang == "bn":
                reply = f"আপনার ₹{proj_cost:,.0f} খরচের জন্য উপযুক্ত পোর্টাল (PMEGP ৩৫% ভর্তুকি):\n\n১) PMEGP ই-পোর্টাল (৫০ লাখ টাকা পর্যন্ত): https://www.kviconline.gov.in/pmegpeportal/\n২) জন সমর্থ পোর্টাল: https://www.jansamarth.in/\n৩) উদ্যমী মিত্র (CGTMSE গ্যারান্টি): https://udyamimitra.in/\n\nনোট: মুদ্রা যোজনা ১০ লাখ পর্যন্ত সীমাবদ্ধ।"
            elif target_lang == "mr":
                reply = f"आपल्या ₹{proj_cost:,.0f} खर्चासाठी योग्य पोर्टल्स (PMEGP ३५% अनुदान):\n\n१) PMEGP ई-पोर्टल (५० लाखांपर्यंत): https://www.kviconline.gov.in/pmegpeportal/\n२) जन समर्थ राष्ट्रीय पोर्टल: https://www.jansamarth.in/\n३) उद्यमी मित्र (CGTMSE हमी): https://udyamimitra.in/\n\nटीप: मुद्रा योजना १० लाखांपर्यंतच मर्यादित आहे."
            elif target_lang == "kn":
                reply = f"ನಿಮ್ಮ ₹{proj_cost:,.0f} ವೆಚ್ಚಕ್ಕೆ ಸೂಕ್ತವಾದ ಪೋರ್ಟಲ್‌ಗಳು (PMEGP 35% ಸಬ್ಸಿಡಿ):\n\n1) PMEGP ಪೋರ್ಟಲ್: https://www.kviconline.gov.in/pmegpeportal/\n2) ಜನ್ ಸಮರ್ಥ್ ಪೋರ್ಟಲ್: https://www.jansamarth.in/\n3) ಉದ್ಯಮಿ ಮಿತ್ರ (CGTMSE): https://udyamimitra.in/\n\nಸೂಚನೆ: ಮುದ್ರಾ ಯೋಜನೆ ₹10 ಲಕ್ಷಕ್ಕೆ ಸೀಮಿತವಾಗಿದೆ."
            else:
                reply = f"Official Government Loan Portals suitable for your ₹{proj_cost:,.0f} Project Cost (PMEGP & MSME Term Loan):\n\n1) PMEGP Official e-Portal (KVIC 15%-35% Capital Subsidy up to ₹50 Lakhs): https://www.kviconline.gov.in/pmegpeportal/\n2) Jan Samarth National Portal (MSME Term Loan Sanction): https://www.jansamarth.in/\n3) Udyami Mitra (CGTMSE Collateral-Free Credit Guarantee): https://udyamimitra.in/\n\nNote: PM MUDRA is legally capped at ₹10 Lakhs. For your ₹{proj_cost:,.0f} outlay, PMEGP (with up to 35% government capital grant) and CGTMSE are the prime eligible schemes."
        else:
            if target_lang == "ta":
                reply = f"உங்கள் ₹{proj_cost:,.0f} திட்ட மதிப்பீடு ₹50 லட்சத்தை விட அதிகம் என்பதால், பெரிய திட்டங்களுக்கான அரசு போர்டல்கள்:\n\n1) ஜன் சமர்த் - ஸ்டாண்ட்-அப் இந்தியா (Stand-Up India - ₹1 கோடி வரை): https://www.jansamarth.in/\n2) உத்யம் மித்ரா (SIDBI பெரிய தொழில் கடன்): https://udyamimitra.in/\n\nஇவை பெரிய அளவிலான புதிய தொழில்களுக்கான சிறப்பு திட்டங்கள்."
            elif target_lang == "hi":
                reply = f"आपकी ₹{proj_cost:,.0f} की लागत ₹50 लाख से अधिक है। बड़े प्रोजेक्ट्स के लिए उपयुक्त सरकारी पोर्टल:\n\n1) जन समर्थ - स्टैंड-अप इंडिया (Stand-Up India - ₹1 करोड़ तक): https://www.jansamarth.in/\n2) उद्यमी मित्र (SIDBI संस्थागत ऋण): https://udyamimitra.in/\n\nयह बड़े पैमाने के उद्यमों के लिए विशेष योजनाएं हैं।"
            elif target_lang == "te":
                reply = f"మీ ₹{proj_cost:,.0f} ఖర్చు ₹50 లక్షల కంటే ఎక్కువ. పెద్ద ప్రాజెక్టులకు తగిన పోర్టల్స్:\n\n1) జన్ సమర్థ్ (Stand-Up India - ₹1 కోటి వరకు): https://www.jansamarth.in/\n2) ఉద్యమి మిత్ర (SIDBI): https://udyamimitra.in/"
            elif target_lang == "bn":
                reply = f"আপনার ₹{proj_cost:,.0f} খরচ ৫০ লাখের বেশি। বড় প্রকল্পের জন্য পোর্টাল:\n\n১) জন সমর্থ (Stand-Up India - ১ কোটি পর্যন্ত): https://www.jansamarth.in/\n২) উদ্যমী মিত্র (SIDBI): https://udyamimitra.in/"
            elif target_lang == "mr":
                reply = f"आपला खर्च ₹५० लाखांपेक्षा जास्त आहे. मोठ्या प्रकल्पांसाठी योग्य शासकीय पोर्टल:\n\n१) जन समर्थ (Stand-Up India - १ कोटीपर्यंत): https://www.jansamarth.in/\n२) उद्यमी मित्र (SIDBI): https://udyamimitra.in/"
            elif target_lang == "kn":
                reply = f"ನಿಮ್ಮ ವೆಚ್ಚ ₹50 ಲಕ್ಷಕ್ಕಿಂತ ಹೆಚ್ಚು. ದೊಡ್ಡ ಯೋಜನೆಗಳ ಪೋರ್ಟಲ್:\n\n1) ಜನ್ ಸಮರ್ಥ್ (Stand-Up India - ₹1 ಕೋಟಿ ವರೆಗೆ): https://www.jansamarth.in/\n2) ಉದ್ಯಮಿ ಮಿತ್ರ: https://udyamimitra.in/"
            elif target_lang == "ml":
                reply = f"നിങ്ങളുടെ പ്രോജക്റ്റ് ചെലവ് ₹{proj_cost:,.0f} (₹50 ലക്ഷത്തിന് മുകളിൽ) ആയതിനാൽ അനുയോജ്യമായ വലിയ വായ്പാ പോർട്ടലുകൾ:\n\n1) ജൻ സമർത്ഥ് (Stand-Up India - ₹1 കോടി വരെ): https://www.jansamarth.in/\n2) ഉദ്യമി മിത്ര (SIDBI ഇൻസ്റ്റിറ്റിയൂഷണൽ ക്രെഡിറ്റ്): https://udyamimitra.in/"
            else:
                reply = f"Official Government Portals suitable for your ₹{proj_cost:,.0f} Project Cost (> ₹50 Lakhs Large-Scale):\n\n1) Jan Samarth Portal (Stand-Up India Scheme - up to ₹1 Crore): https://www.jansamarth.in/\n2) Udyami Mitra (SIDBI Institutional & Corporate Credit): https://udyamimitra.in/\n\nStandard micro/term schemes are capped at ₹50 Lakhs. For your scale, Stand-Up India and SIDBI corporate credit provide optimal funding."

    elif is_profit:
        if target_lang == "ta":
            reply = "மாதாந்திர லாபத்தை அதிகரிக்க 3 முக்கிய வழிகள்: 1) மொத்த விற்பனையாளர்களிடம் நேரடியாக மூலப்பொருட்களை வாங்கி 15-20% செலவை மிச்சப்படுத்துங்கள். 2) வாடிக்கையாளர்களுக்கு ஹோம் டெலிவரி வழங்கி விற்பனையை கூட்டுங்கள். 3) PMEGP திட்டத்தின் கீழ் 35% அரசு மானியம் பெற்று கடன் சுமையை குறையுங்கள்."
        elif target_lang == "hi":
            reply = "मासिक लाभ बढ़ाने के लिए 3 मुख्य रणनीतियाँ अपनाएं: 1) थोक मंडी से सीधे कच्चा माल खरीदें ताकि 15-20% मार्जिन बढ़े। 2) स्थानीय ग्राहकों को नियमित होम डिलीवरी सेवा दें। 3) PMEGP योजना के तहत 35% सरकारी सब्सिडी का लाभ उठाकर ब्याज का बोझ कम करें।"
        elif target_lang == "te":
            reply = "నెలవారీ లాభాన్ని పెంచడానికి 3 ముఖ్యమైన వ్యూహాలు: 1) హోల్‌సేల్ మార్కెట్ నుండి నేరుగా సరుకును కొనుగోలు చేసి 15-20% మార్జిన్ పెంచుకోండి. 2) స్థానిక కస్టమర్లకు హోమ్ డెలివరీ అందించండి. 3) PMEGP పథకం ద్వారా 35% ప్రభుత్వ రాయితీని ఉపయోగించుకుని వడ్డీ భారాన్ని తగ్గించుకోండి."
        elif target_lang == "bn":
            reply = "মাসিক লাভ বাড়ানোর জন্য ৩টি মূল কৌশল: ১) পাইকারি বাজার থেকে সরাসরি কাঁচামাল কিনুন যাতে ১৫-২০% খরচ সাশ্রয় হয়। ২) স্থানীয় গ্রাহকদের হোম ডেলিভারি পরিষেবা দিন। ৩) PMEGP প্রকল্পে ৩৫% সরকারি ভর্তুকি নিয়ে ঋণের সুদ ও কিস্তির চাপ কমান।"
        elif target_lang == "mr":
            reply = "मासिक नफा वाढवण्यासाठी ३ मुख्य उपाय: १) थेट घाऊक बाजारातून कच्चा माल खरेदी करा जेणेकरून १५-२०% खर्च वाचेल. २) ग्राहकांना घरपोच सेवा देऊन विक्री वाढवा. ३) PMEGP योजनेतून ३५% शासकीय अनुदान मिळवून कर्जाचा भार कमी करा."
        elif target_lang == "kn":
            reply = "ಮಾಸಿಕ ಲಾಭವನ್ನು ಹೆಚ್ಚಿಸಲು 3 ಪ್ರಮುಖ ಕ್ರಮಗಳು: 1) ಸಗಟು ಮಾರುಕಟ್ಟೆಯಿಂದ ನೇರವಾಗಿ ಕಚ್ಚಾ ವಸ್ತುಗಳನ್ನು ಖರೀದಿಸಿ 15-20% ವೆಚ್ಚ ಉಳಿಸಿ. 2) ಗ್ರಾಹಕರಿಗೆ ಮನೆಬಾಗಿಲಿಗೆ ಸೇವೆ ನೀಡಿ. 3) PMEGP ಯೋಜನೆಯಡಿ 35% ಸರ್ಕಾರಿ ಸಬ್ಸಿಡಿ ಪಡೆದು ಸಾಲದ ಹೊರೆಯನ್ನು ಕಡಿಮೆ ಮಾಡಿ."
        elif target_lang == "ml":
            reply = "പ്രതിമാസ ലാഭം വർദ്ധിപ്പിക്കാൻ 3 വഴികൾ: 1) മൊത്ത വിപണിയിൽ നിന്ന് നേരിട്ട് അസംസ്കൃത വസ്തുക്കൾ വാങ്ങി 15-20% ലാഭിക്കുക. 2) വീടുകളിൽ നേരിട്ട് ഉൽപ്പന്നങ്ങൾ എത്തിച്ച് സ്ഥിരം ഉപഭോക്താക്കളെ നേടുക. 3) PMEGP പദ്ധതിയിലൂടെ 35% സർക്കാർ സബ്‌സിഡി നേടി വായ്പാ തിരിച്ചടവ് ലഘൂകരിക്കുക."
        else:
            reply = "To maximize monthly profits: 1) Source raw materials directly from wholesale distributors to save 15-20% on procurement. 2) Offer regular delivery to retain loyal local households. 3) Avail the 35% PMEGP government capital subsidy to drastically reduce net debt servicing costs."

    elif is_moratorium:
        if target_lang == "ta":
            reply = "தவணை சலுகை (Moratorium) என்பது தொழில் தொடங்கிய முதல் 6 மாதங்களுக்கு நீங்கள் எவ்வித மாதத் தவணையும் (EMI) செலுத்த வேண்டியதில்லை. இந்த காலத்திற்கான வட்டி அசலுடன் சேர்க்கப்படும். இதனால் வணிகம் நிலைபெற்று பணப்புழக்கம் சீராகும் வரை நிதி நெருக்கடி இருக்காது."
        elif target_lang == "hi":
            reply = "मोरेटोरियम (किस्त छूट) का अर्थ है कि व्यवसाय शुरू करने के पहले 6 महीनों में आपको कोई ईएमआई (EMI) नहीं देनी होगी। इस अवधि का ब्याज मूलधन में जुड़ जाता है, जिससे आपको दुकान स्थापित करने और स्थिर नकद प्रवाह हासिल करने का समय मिल जाता है।"
        elif target_lang == "te":
            reply = "మొరటోరియం అంటే వ్యాపారం ప్రారంభించిన మొదటి 6 నెలల వరకు మీరు ఎలాంటి ఈఎంఐ (EMI) చెల్లించాల్సిన అవసరం లేదు. ఈ కాలపు వడ్డీ అసలులో కలుస్తుంది. ఇది వ్యాపారం నిలదొక్కుకోవడానికి ఎంతో సహాయపడుతుంది."
        elif target_lang == "bn":
            reply = "কিস্তি স্থগিতাদেশ (Moratorium) মানে হলো ব্যবসা শুরুর প্রথম ৬ মাস আপনাকে কোনো ইএমআই (EMI) দিতে হবে না। এই সময়ের সুদ মূলধনে যুক্ত হবে, যার ফলে ব্যবসা দাঁড়িয়ে যাওয়ার পর্যাপ্ত সময় পাওয়া যায়।"
        elif target_lang == "mr":
            reply = "हप्ता सवलत (Moratorium) म्हणजे व्यवसाय सुरू केल्यावर पहिल्या ६ महिन्यांत कोणताही ईएमआई (EMI) भरावा लागत नाही. या काळातील व्याज मुद्दलात जोडले जाते. यामुळे दुकानाचा पाया भक्कम करण्यास मदत होते."
        elif target_lang == "kn":
            reply = "ಮೊರಟೋರಿಯಂ ಅವಧಿಯೆಂದರೆ ವ್ಯಾಪಾರ ಪ್ರಾರಂಭಿಸಿದ ಮೊದಲ 6 ತಿಂಗಳು ನೀವು ಯಾವುದೇ ಇಎಂಐ (EMI) ಪಾವತಿಸಬೇಕಾಗಿಲ್ಲ. ಈ ಅವಧಿಯ ಬಡ್ಡಿ ಅಸಲಿನಲ್ಲಿ ಸೇರ್ಪಡೆಯಾಗುತ್ತದೆ. ಇದರಿಂದ ವ್ಯಾಪಾರ ಸುಲಭವಾಗಿ ಬೆಳೆಯಲು ಸಮಯ ಸಿಗುತ್ತದೆ."
        elif target_lang == "ml":
            reply = "മൊറട്ടോറിയം എന്നാൽ ബിസിനസ്സ് ആരംഭിച്ച് ആദ്യ 6 മാസം EMI അടയ്ക്കേണ്ടതില്ല. ഈ കാലയളവിലെ പലിശ മുതലിലേക്ക് ചേർക്കപ്പെടുന്നു. ഇത് ബിസിനസ്സ് സുസ്ഥിരമാകുന്നതുവരെ വലിയ ആശ്വാസമാണ്."
        else:
            reply = "A moratorium is a grace period where you pay zero EMI for the first 6 months. Interest accrued during this phase is capitalized into principal, giving your venture vital breathing room until revenue stabilizes."

    elif is_scheme:
        if target_lang == "ta":
            reply = f"உங்கள் ₹{margin:,.0f} முதலீட்டிற்கு 90% வரை அரசு கடன் உதவி (₹{loan:,.0f}) கிடைக்கும். PMEGP மற்றும் முத்ரா திட்டங்கள் மூலம் 6.5% முதல் 8% குறைந்த வட்டியில் கடன் மற்றும் 35% வரை மானியம் பெறலாம். மாவட்ட தொழில் மையம் (DIC) மூலம் ஆன்லைனில் விண்ணப்பிக்கலாம்."
        elif target_lang == "hi":
            reply = f"आपकी ₹{margin:,.0f} की 10% मार्जिन पूंजी पर 90% सरकारी ऋण (₹{loan:,.0f}) उपलब्ध है। PMEGP और मुद्रा (Mudra) योजना के अंतर्गत 6.5% से 8% रियायती ब्याज दर और ग्रामीण क्षेत्रों के लिए 25% से 35% तक की सब्सिडी का प्रावधान है।"
        elif target_lang == "te":
            reply = f"మీ ₹{margin:,.0f} పెట్టుబడిపై 90% ప్రభుత్వ రుణ సహాయం (₹{loan:,.0f}) లభిస్తుంది. PMEGP మరియు ముద్రా పథకాల ద్వారా 6.5% నుండి 8% రాయితీ వడ్డీ మరియు గ్రామీణ ప్రాంతాలకు 35% వరకు సబ్సిడీ లభిస్తుంది."
        elif target_lang == "bn":
            reply = f"আপনার ₹{margin:,.0f} নিজস্ব পুঁজিতে ৯০% সরকারি ঋণ সহায়তা (₹{loan:,.0f}) মিলবে। PMEGP এবং মুদ্রা যোজনার আওতায় ৬.৫% থেকে ৮% সুদে এবং ২৫% থেকে ৩৫% পর্যন্ত সরকারি ভর্তুকি পাওয়া যায়।"
        elif target_lang == "mr":
            reply = f"आपल्या ₹{margin:,.0f} स्वतःच्या भांडवलावर ९०% शासकीय कर्ज (₹{loan:,.0f}) उपलब्ध आहे. PMEGP आणि मुद्रा योजनेतून ६.५% ते ८% सवलतीच्या दरात कर्ज आणि ३५% पर्यंत अनुदान मिळते."
        elif target_lang == "kn":
            reply = f"ನಿಮ್ಮ ₹{margin:,.0f} ಬಂಡವಾಳಕ್ಕೆ 90% ಸರ್ಕಾರಿ ಸಾಲ (₹{loan:,.0f}) ಲಭ್ಯವಿದೆ. PMEGP ಮತ್ತು ಮುದ್ರಾ ಯೋಜನೆಗಳ ಮೂಲಕ 6.5% ರಿಂದ 8% ರಿಯಾಯಿತಿ ಬಡ್ಡಿದರ ಮತ್ತು 35% ವರೆಗೆ ಸಬ್ಸಿಡಿ ಸಿಗುತ್ತದೆ."
        elif target_lang == "ml":
            reply = f"നിങ്ങളുടെ ₹{margin:,.0f} നിക്ഷേപത്തിന് 90% സർക്കാർ വായ്പാ സഹായം (₹{loan:,.0f}) ലഭിക്കും. PMEGP, മുദ്ര പദ്ധതികൾ വഴി 6.5% മുതൽ 8% കുറഞ്ഞ പലിശയിലും 35% വരെ സബ്‌സിഡിയിലും വായ്പ ലഭ്യമാണ്."
        else:
            reply = f"Your ₹{margin:,.0f} margin qualifies for 90% government-backed scheme funding (₹{loan:,.0f}) under PMEGP and Mudra at 6.5%-8.0% p.a., with up to 35% capital subsidy for rural micro-enterprises."

    elif is_half_capital:
        half_m = margin / 2
        if target_lang == "ta":
            reply = f"ஆம், ₹{half_m:,.0f} என்ற பாதி முதலீட்டிலும் தொடங்கலாம்: 1) இடத்தை வாங்குவதற்கு பதில் வாடகைக்கு எடுக்கவும், 2) சான்றளிக்கப்பட்ட பயன்படுத்திய உபகரணங்களை பயன்படுத்தவும், 3) அத்தியாவசிய பொருட்களை மட்டுமே முதலில் இருப்பு வைக்கவும்."
        elif target_lang == "hi":
            reply = f"हाँ, आप ₹{half_m:,.0f} के आधे बजट में भी शुरुआत कर सकते हैं: 1) दुकान खरीदने के बजाय किराए पर लें, 2) प्रमाणित सेकंड-हैंड मशीनरी का उपयोग करें, और 3) केवल अधिक मांग वाले सामान से शुरुआत करें।"
        elif target_lang == "te":
            reply = f"అవును, మీరు ₹{half_m:,.0f} సగం పెట్టుబడితో కూడా ప్రారంభించవచ్చు: 1) స్థలాన్ని కొనకుండా అద్దెకు తీసుకోండి, 2) ఉపయోగించిన నాణ్యమైన పరికరాలను వాడండి, 3) అధిక డిమాండ్ ఉన్న సరుకును మాత్రమే ముందుగా నిల్వ చేయండి."
        elif target_lang == "bn":
            reply = f"হ্যাঁ, আপনি ₹{half_m:,.0f} অর্ধেক পুঁজিতেও শুরু করতে পারেন: ১) জায়গা কেনার বদলে ভাড়ায় নিন, ২) সেকেন্ড-হ্যান্ড সার্টিফাইড যন্ত্রপাতি ব্যবহার করুন, ৩) শুরুতে প্রয়োজনীয় পণ্য দিয়েই কাজ শুরু করুন।"
        elif target_lang == "mr":
            reply = f"होय, आपण ₹{half_m:,.0f} या निम्म्या भांडवलातही व्यवसाय सुरू करू शकता: १) जागा विकत घेण्याऐवजी भाड्याने घ्या, २) सेकंड-हँड यंत्रसामग्री वापरा, ३) फक्त अधिक खप असणाऱ्या मालाचा साठा ठेवा."
        elif target_lang == "kn":
            reply = f"ಹೌದು, ನೀವು ₹{half_m:,.0f} ಅರ್ಧ ಬಂಡವಾಳದಲ್ಲೂ ಪ್ರಾರಂಭಿಸಬಹುದು: 1) ಜಾಗವನ್ನು ಖರೀದಿಸುವ ಬದಲು ಬಾಡಿಗೆಗೆ ಪಡೆಯಿರಿ, 2) ಬಳಸಿದ ಯಂತ್ರೋಪಕರಣಗಳನ್ನು ಆರಿಸಿ, 3) ಆರಂಭದಲ್ಲಿ ಅಗತ್ಯ ವಸ್ತುಗಳ ದಾಸ್ತಾನು ಮಾತ್ರ ಇರಿಸಿ."
        elif target_lang == "ml":
            reply = f"അതെ, ₹{half_m:,.0f} എന്ന പകുതി നിക്ഷേപത്തിലും ആരംഭിക്കാം: 1) സ്ഥലം വാങ്ങുന്നതിന് പകരം വാടകയ്ക്കെടുക്കുക, 2) സെക്കൻഡ് ഹാൻഡ് യന്ത്രങ്ങൾ ഉപയോഗിക്കുക, 3) ആവശ്യമായ ഉൽപ്പന്നങ്ങൾ മാത്രം ആദ്യം സ്റ്റോക്ക് ചെയ്യുക."
        else:
            reply = f"Yes, you can launch with half capital (₹{half_m:,.0f}) by: 1) Leasing retail space instead of purchasing, 2) Buying certified refurbished equipment, and 3) Stocking only high-velocity inventory for the first quarter."

    elif is_idea:
        if target_lang == "ta":
            reply = f"{loc} பகுதியில் பால் பண்ணை (Dairy) மற்றும் மளிகை கடை (Kirana) ஆகியவை அதிக லாபகரமானவை. அத்தியாவசிய தேவை இருப்பதால் 75-82% வணிக சாத்தியக்கூறு உள்ளது. உங்கள் ₹{margin:,.0f} முதலீட்டிற்கு 90% அரசு கடன் கிடைக்கும்."
        elif target_lang == "hi":
            reply = f"{loc} में डेयरी (दुग्ध व्यवसाय) और किराना स्टोर सबसे अधिक मांग वाले व्यवसाय हैं। इनकी व्यवहार्यता 75-82% है और आपकी ₹{margin:,.0f} मार्जिन पूंजी पर 90% सरकारी ऋण उपलब्ध है।"
        elif target_lang == "te":
            reply = f"{loc} లో డెయిరీ మరియు కిరాణా వ్యాపారాలకు మంచి డిమాండ్ ఉంది. 75-82% సాధ్యత స్కోర్ ఉంది మరియు మీ ₹{margin:,.0f} పెట్టుబడిపై 90% ప్రభుత్వ రుణం లభిస్తుంది."
        elif target_lang == "bn":
            reply = f"{loc}-এ ডেইরি ও মুদি দোকান সবচেয়ে লাভজনক ব্যবসা। এর স্কোর ৭৫-৮২% এবং আপনার ₹{margin:,.0f} পুঁজিতে ৯০% সরকারি ঋণ মিলবে।"
        elif target_lang == "mr":
            reply = f"{loc} मध्ये डेअरी आणि किराणा व्यवसाय सर्वात फायदेशीर आहेत. ७५-८२% संभाव्यता आहे आणि आपल्या ₹{margin:,.0f} भांडवलावर ९०% शासकीय कर्ज उपलब्ध आहे."
        elif target_lang == "kn":
            reply = f"{loc} ನಲ್ಲಿ ಡೈರಿ ಮತ್ತು ಕಿರಾಣಿ ಅಂಗಡಿಗಳು ಅತಿ ಹೆಚ್ಚು ಲಾಭದಾಯಕವಾಗಿವೆ. ನಿಮ್ಮ ₹{margin:,.0f} ಬಂಡವಾಳಕ್ಕೆ 90% ಸರ್ಕಾರಿ ಸಾಲ ಸಿಗುತ್ತದೆ."
        elif target_lang == "ml":
            reply = f"{loc}-ൽ ഡയറി ഫാമും പലചരക്ക് കടയും വളരെ ലാഭകരമാണ്. സ്ഥിരമായ ആവശ്യക്കാരുള്ളതിനാൽ 75-82% സാധ്യതയുണ്ട്. നിങ്ങളുടെ ₹{margin:,.0f} നിക്ഷേപത്തിന് 90% സർക്കാർ വായ്പ ലഭിക്കും."
        else:
            reply = f"In {loc}, Dairy Farm and Grocery Store show the highest rural catchment demand with 75-82% feasibility ratings. Your margin capital of ₹{margin:,.0f} qualifies for 90% scheme leverage."

    elif is_apply:
        if target_lang == "ta":
            reply = "அரசு கடன் திட்டத்திற்கு விண்ணப்பிக்க தேவையானவை: 1) ஆதார் & பான் கார்டு, 2) உத்யம் பதிவு (Udyam Portal - இலவசம்), 3) விரிவான திட்ட அறிக்கை (DPR), 4) வங்கி பாஸ்புக். GramBiz AI மூலம் உங்கள் திட்ட அறிக்கையை உடனடியாக பதிவிறக்கலாம்."
        elif target_lang == "hi":
            reply = "सरकारी ऋण के लिए आवश्यक दस्तावेज: 1) आधार व पैन कार्ड, 2) उद्यम पंजीकरण (निःशुल्क पोर्टल), 3) विस्तृत परियोजना रिपोर्ट (DPR), 4) बैंक पासबुक। आप GramBiz AI से अपनी रिपोर्ट सीधे डाउनलोड कर सकते हैं।"
        elif target_lang == "te":
            reply = "ప్రభుత్వ రుణానికి కావలసిన పత్రాలు: 1) ఆధార్ & పాన్ కార్డ్, 2) ఉద్యమ్ రిజిస్ట్రేషన్, 3) ప్రాజెక్ట్ రిపోర్ట్ (DPR), 4) బ్యాంక్ పాస్‌బుక్. మీరు GramBiz AI నుండి ప్రాజెక్ట్ రిపోర్ట్ డౌన్‌లోడ్ చేసుకోవచ్చు."
        elif target_lang == "bn":
            reply = "সরকারি ঋণের জন্য প্রয়োজনীয় নথি: ১) আধার ও প্যান কার্ড, ২) উদ্যম রেজিস্ট্রেশন, ৩) প্রজেক্ট রিপোর্ট (DPR), ৪) ব্যাংক পাসবুক। GramBiz AI থেকে আপনার প্রজেক্ট রিপোর্ট ডাউনলোড করতে পারেন।"
        elif target_lang == "mr":
            reply = "शासकीय कर्जासाठी लागणारी कागदपत्रे: १) आधार व पॅन कार्ड, २) उद्यम नोंदणी (Udyam Portal), ३) प्रकल्प अहवाल (DPR), ४) बँक पासबुक. GramBiz AI वरून आपण अहवाल डाउनलोड करू शकता."
        elif target_lang == "kn":
            reply = "ಸರ್ಕಾರಿ ಸಾಲಕ್ಕೆ ಅಗತ್ಯ ದಾಖಲೆಗಳು: 1) ಆಧಾರ್ ಮತ್ತು ಪ್ಯಾನ್ ಕಾರ್ಡ್, 2) ಉದ್ಯಮ್ ನೋಂದಣಿ, 3) ಯೋಜನಾ ವರದಿ (DPR), 4) ಬ್ಯಾಂಕ್ ಪಾಸ್‌ಬುಕ್."
        elif target_lang == "ml":
            reply = "സർക്കാർ വായ്പയ്ക്ക് ആവശ്യമായ രേഖകൾ: 1) ആധാർ & പാൻ കാർഡ്, 2) ഉദ്യം രജിസ്ട്രേഷൻ (സൗജന്യം), 3) പ്രോജക്റ്റ് റിപ്പോർട്ട് (DPR), 4) ബാങ്ക് പാസ്ബുക്ക്. GramBiz AI-ൽ നിന്ന് പ്രോജക്റ്റ് റിപ്പോർട്ട് ഡൗൺലോഡ് ചെയ്യാം."
        else:
            reply = "Documents required for scheme loan: 1) Aadhaar & PAN Card, 2) Udyam MSME Registration (Free), 3) Detailed Project Report (DPR), and 4) Bank passbook. You can export your DPR report directly from GramBiz AI."

    elif is_risk:
        if target_lang == "ta":
            reply = f"{loc} பகுதியில் {biz} தொழிலுக்கு முக்கிய சவால்கள்: 1) மூலப்பொருள் விலை ஏற்றத்தாழ்வு, 2) வாடிக்கையாளர் கடன் பாக்கி. பரிந்துரை: வாடிக்கையாளர் கடனை அதிகபட்சம் ₹1,000க்குள் கட்டுப்படுத்துங்கள், பல சப்ளையர்களிடம் நேரடி தொடர்பு வையுங்கள்."
        elif target_lang == "hi":
            reply = f"{loc} में {biz} के लिए मुख्य जोखिम: 1) कच्चा माल कीमतों में उतार-चढ़ाव, और 2) ग्राहकों को अधिक उधारी देना। सुझाव: किसी भी ग्राहक को ₹1,000 से अधिक उधारी न दें और 2-3 विश्वसनीय सप्लायर्स से संबंध बनाएं।"
        elif target_lang == "te":
            reply = f"{loc} లో {biz} వ్యాపారానికి ప్రధాన సవాళ్లు: 1) ముడిసరుకు ధరల మార్పు, 2) కస్టమర్ల అప్పులు. సూచన: కస్టమర్ క్రెడిట్‌ను గరిష్టంగా ₹1,000 కి పరిమితం చేయండి మరియు పలువురు సరఫరాదారులను సంప్రదించండి."
        elif target_lang == "bn":
            reply = f"{loc}-এ {biz} ব্যবসার প্রধান ঝুঁকি: ১) কাঁচামালের দামের ওঠানামা, ২) বাকি পড়ে থাকা। পরামর্শ: গ্রাহকদের ঋণের সীমা সর্বোচ্চ ₹১,০০০ রাখুন এবং একাধিক সরবরাহকারীর সাথে যোগাযোগ রাখুন।"
        elif target_lang == "mr":
            reply = f"{loc} मध्ये {biz} व्यवसायाचे मुख्य धोके: १) कच्च्या मालाचे चढ-उतार, २) ग्राहकांची उधारी. सल्ला: कोणत्याही ग्राहकाला ₹१,००० पेक्षा जास्त उधारी देऊ नका आणि २-३ पुरवठादारांशी संपर्क ठेवा."
        elif target_lang == "kn":
            reply = f"{loc} ನಲ್ಲಿ {biz} ಉದ್ಯಮಕ್ಕೆ ಪ್ರಮುಖ ಸವಾಲುಗಳು: 1) ಕಚ್ಚಾ ವಸ್ತುಗಳ ಬೆಲೆ ಬದಲಾವಣೆ, 2) ಗ್ರಾಹಕರ ಸಾಲ. ಸಲಹೆ: ಸಾಲದ ಮಿತಿಯನ್ನು ₹1,000 ಕ್ಕೆ ಸೀಮಿತಗೊಳಿಸಿ ಮತ್ತು ವಿಶ್ವಾಸಾರ್ಹ ಪೂರೈಕೆದಾರರೊಂದಿಗೆ ಕೆಲಸ ಮಾಡಿ."
        elif target_lang == "ml":
            reply = f"{loc}-ൽ {biz} ബിസിനസ്സിന്റെ പ്രധാന വെല്ലുവിളികൾ: 1) അസംസ്കൃത വസ്തുക്കളുടെ വിലയിലെ ഏറ്റക്കുറച്ചിലുകൾ, 2) ഉപഭോക്താക്കളുടെ കടം. ഉപഭോക്താക്കൾക്കുള്ള കടം പരമാവധി ₹1,000 ആയി പരിമിതപ്പെടുത്തുക."
        else:
            reply = f"Key risks for {biz} in {loc}: 1) Input price spikes, and 2) Uncollected customer receivables. Keep credit limits under ₹1,000 per customer and maintain diversified vendor sources."

    else:
        if target_lang == "ta":
            reply = f"வணக்கம்! நான் GramBiz AI. உங்கள் {biz} தொழிலுக்கு {loc} பகுதியில் வணிக சாத்தியக்கூறு {score}/100 ஆக உள்ளது ({conf} நம்பிக்கை நிலை). உங்கள் ₹{margin:,.0f} முதலீட்டிற்கு 90% அரசு கடன் மற்றும் 35% வரை மானியம் பெறலாம். கடன் திட்டம், லாப கணக்கீடு அல்லது மானியம் பற்றி எதை அறிய விரும்புகிறீர்கள்?"
        elif target_lang == "hi":
            reply = f"नमस्ते! मैं GramBiz AI हूँ। {loc} में आपके {biz} व्यवसाय के लिए बेहतरीन अवसर हैं (व्यवहार्यता स्कोर: {score}/100)। आपकी ₹{margin:,.0f} की मार्जिन पूंजी पर 90% तक सरकारी ऋण और सब्सिडी उपलब्ध है। आप किस विषय पर अधिक जानना चाहते हैं?"
        elif target_lang == "te":
            reply = f"నమస్కారం! నేను GramBiz AI. {loc} లో మీ {biz} వ్యాపారానికి అద్భుతమైన అవకాశాలు ఉన్నాయి (సాధ్యత స్కోర్: {score}/100). మీ ₹{margin:,.0f} పెట్టుబడిపై 90% ప్రభుత్వ రుణ సహాయం లభిస్తుంది. మీకు ఏ వివరాలు కావాలి?"
        elif target_lang == "bn":
            reply = f"নমস্কার! আমি GramBiz AI। {loc}-এ আপনার {biz} ব্যবসার দারুণ সম্ভাবনা রয়েছে (স্কোর: {score}/১০০)। আপনার ₹{margin:,.0f} নিজস্ব পুঁজিতে ৯০% সরকারি ঋণ সহায়তা পাওয়া যাবে। আর কী তথ্য জানতে চান?"
        elif target_lang == "mr":
            reply = f"नमस्कार! मी GramBiz AI. {loc} मध्ये आपल्या {biz} व्यवसायासाठी उत्तम संधी आहेत (व्यवहार्यता स्कोर: {score}/१००). आपल्या ₹{margin:,.0f} भांडवलावर ९०% शासकीय कर्ज उपलब्ध आहे. आपल्याला कोणत्या विषयावर अधिक माहिती हवी आहे?"
        elif target_lang == "kn":
            reply = f"ನಮಸ್ಕಾರ! ನಾನು GramBiz AI. {loc} ನಲ್ಲಿ ನಿಮ್ಮ {biz} ವ್ಯಾಪಾರ ಆರಂಭಿಸಲು ಉತ್ತಮ ವಾತಾವರಣವಿದೆ (ಸ್ಕೋರ್: {score}/100). ನಿಮ್ಮ ₹{margin:,.0f} ಬಂಡವಾಳಕ್ಕೆ 90% ಸರ್ಕಾರಿ ಸಾಲ ಲಭ್ಯವಿದೆ. ನಿಮಗೆ ಬೇರೆ ಯಾವ ಮಾಹಿತಿ ಬೇಕು?"
        elif target_lang == "ml":
            reply = f"നമസ്കാരം! ഞാൻ GramBiz AI. {loc}-ൽ നിങ്ങളുടെ {biz} സംരംഭത്തിന് മികച്ച സാധ്യതയുണ്ട് (സ്കോർ: {score}/100). നിങ്ങളുടെ ₹{margin:,.0f} നിക്ഷേപത്തിന് 90% സർക്കാർ വായ്പ ലഭ്യമാണ്. താങ്കൾക്ക് എന്ത് വിവരമാണ് അറിയേണ്ടത്?"
        else:
            reply = f"GramBiz AI indicates strong feasibility for your {biz} venture in {loc} (Score: {score}/100). Your self-contributed margin of ₹{margin:,.0f} qualifies for 90% government scheme leverage. How can I assist with your business plan today?"

    return AIChatResponse(reply=reply)
