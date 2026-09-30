import os
import json
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
from app.schemas.schemas import BusinessCatalogItem, CustomBusinessInput, IdeaDiscoveryRequest, IdeaDiscoveryResponse, SuggestedIdeaItem

# Ensure .env is loaded
env_file = Path(__file__).resolve().parent.parent.parent.parent.parent / ".env"
if env_file.exists():
    load_dotenv(dotenv_path=env_file)
else:
    load_dotenv()


DEFAULT_BUSINESS_CATALOG: List[Dict[str, Any]] = [
    {
        "id": "biz-dairy",
        "name": "Dairy Farm & Milk Processing",
        "category": "Animal Husbandry",
        "description": "Commercial milk production, chilling, and regional distribution.",
        "products_services": ["Fresh Milk", "Curd", "Paneer", "Ghee"],
        "target_customers": "Village households, tea stalls, local sweet shops",
        "default_cost_range": "₹2,50,000 – ₹10,00,000",
        "default_margin_range": "20% – 30% Gross Margin",
        "active": True
    },
    {
        "id": "biz-poultry",
        "name": "Poultry & Egg Farming",
        "category": "Animal Husbandry",
        "description": "Broiler and layer chicken farming for meat and egg supply.",
        "products_services": ["Broiler Chicken", "Farm Fresh Eggs"],
        "target_customers": "Local meat shops, restaurants, households",
        "default_cost_range": "₹3,00,000 – ₹12,00,000",
        "default_margin_range": "18% – 28% Gross Margin",
        "active": True
    },
    {
        "id": "biz-grocery",
        "name": "Supermarket & Kirana Store",
        "category": "Retail",
        "description": "Daily essential grocery, packaged food, and household supplies.",
        "products_services": ["Ration Items", "Packaged Snacks", "Toiletries"],
        "target_customers": "Local village and township residents",
        "default_cost_range": "₹1,50,000 – ₹8,00,000",
        "default_margin_range": "12% – 20% Gross Margin",
        "active": True
    },
    {
        "id": "biz-textile",
        "name": "Textile & Readymade Garments",
        "category": "Textile",
        "description": "Retail clothing store for sarees, kids wear, and menswear.",
        "products_services": ["Sarees", "Casuals", "Kids Wear", "Unstitched Fabric"],
        "target_customers": "Local families and festival buyers",
        "default_cost_range": "₹2,00,000 – ₹10,00,000",
        "default_margin_range": "25% – 40% Gross Margin",
        "active": True
    },
    {
        "id": "biz-tailoring",
        "name": "Bespoke Tailoring Workshop",
        "category": "Textile",
        "description": "Custom blouse, suit, and garment stitching service.",
        "products_services": ["Custom Stitching", "Alteration", "Embroidery"],
        "target_customers": "Local women and wedding buyers",
        "default_cost_range": "₹50,000 – ₹3,00,000",
        "default_margin_range": "40% – 60% Gross Margin",
        "active": True
    },
    {
        "id": "biz-food-processing",
        "name": "Agro-Food Processing Unit",
        "category": "Food",
        "description": "Flour mill, spice grinding, and local snack packaging.",
        "products_services": ["Atta", "Chilli Powder", "Haldi", "Local Snacks"],
        "target_customers": "Wholesale merchants and retail shops",
        "default_cost_range": "₹2,00,000 – ₹15,00,000",
        "default_margin_range": "25% – 35% Gross Margin",
        "active": True
    },
    {
        "id": "biz-bakery",
        "name": "Fresh Bakery & Confectionery",
        "category": "Food",
        "description": "Fresh bread, cakes, biscuits, and evening snacks unit.",
        "products_services": ["Fresh Bread", "Custom Birthday Cakes", "Puffs"],
        "target_customers": "Local youth, schools, tea shops",
        "default_cost_range": "₹1,50,000 – ₹6,00,000",
        "default_margin_range": "30% – 45% Gross Margin",
        "active": True
    },
    {
        "id": "biz-mobile-repair",
        "name": "Mobile Repair & Accessories",
        "category": "Services",
        "description": "Smartphone screen repair, battery swap, and accessory sales.",
        "products_services": ["Screen Repair", "Chargers", "Covers", "Software Service"],
        "target_customers": "Local smartphone users",
        "default_cost_range": "₹1,00,000 – ₹4,00,000",
        "default_margin_range": "35% – 50% Gross Margin",
        "active": True
    },
    {
        "id": "biz-cloud-kitchen",
        "name": "Cloud Kitchen & Catering",
        "category": "Food",
        "description": "Delivery-only food preparation and event catering.",
        "products_services": ["Biryani", "South Indian Meals", "Catering Service"],
        "target_customers": "Office workers, local event organizers",
        "default_cost_range": "₹1,50,000 – ₹5,00,000",
        "default_margin_range": "30% – 40% Gross Margin",
        "active": True
    },
    {
        "id": "biz-beauty-salon",
        "name": "Beauty Salon & Spa",
        "category": "Beauty & Wellness",
        "description": "Hair styling, bridal makeup, and skincare services.",
        "products_services": ["Haircut", "Facial", "Bridal Package"],
        "target_customers": "Local women and brides",
        "default_cost_range": "₹1,00,000 – ₹5,00,000",
        "default_margin_range": "50% – 70% Gross Margin",
        "active": True
    },
    {
        "id": "biz-solar-install",
        "name": "Solar Panel Installation & Repair",
        "category": "Renewable Energy",
        "description": "Rooftop solar setup, inverter wiring, and maintenance.",
        "products_services": ["Solar Setup", "Inverter Battery Repair", "Annual Maintenance"],
        "target_customers": "Rooftop homeowners, commercial shops",
        "default_cost_range": "₹2,50,000 – ₹10,00,000",
        "default_margin_range": "20% – 35% Gross Margin",
        "active": True
    },
    {
        "id": "biz-two-wheeler",
        "name": "Two-Wheeler Repair & Service",
        "category": "Automotive",
        "description": "Motorcycle/scooter servicing, oil replacement, and spare parts.",
        "products_services": ["General Service", "Engine Oil", "Spare Parts"],
        "target_customers": "Local vehicle owners & commuters",
        "default_cost_range": "₹1,00,000 – ₹5,00,000",
        "default_margin_range": "35% – 50% Gross Margin",
        "active": True
    }
]

DYNAMIC_CUSTOM_CATALOG: List[Dict[str, Any]] = []

def search_business_catalog(query: str = "", category: str = "") -> List[BusinessCatalogItem]:
    all_items = DEFAULT_BUSINESS_CATALOG + DYNAMIC_CUSTOM_CATALOG
    filtered = []
    
    q_clean = query.strip().lower()
    c_clean = category.strip().lower()

    for item in all_items:
        if not item.get("active", True):
            continue
        
        matches_q = not q_clean or (
            q_clean in item["name"].lower() or 
            q_clean in item["category"].lower() or 
            q_clean in item["description"].lower()
        )
        matches_c = not c_clean or c_clean == "all" or item["category"].lower() == c_clean

        if matches_q and matches_c:
            filtered.append(BusinessCatalogItem(**item))

    return filtered

def add_custom_business(payload: CustomBusinessInput) -> BusinessCatalogItem:
    new_id = f"custom-{len(DYNAMIC_CUSTOM_CATALOG) + 1}-{payload.name.lower().replace(' ', '-')[:15]}"
    new_item = {
        "id": new_id,
        "name": payload.name,
        "category": payload.category,
        "description": payload.description,
        "products_services": payload.products_services or ["Custom Product/Service"],
        "target_customers": payload.target_customers or "Local residents",
        "default_cost_range": f"₹{int(payload.estimated_startup_cost or 100000):,} Est.",
        "default_margin_range": "25% – 40% Estimated Gross Margin",
        "active": True
    }
    DYNAMIC_CUSTOM_CATALOG.append(new_item)
    return BusinessCatalogItem(**new_item)

def discover_business_ideas(payload: IdeaDiscoveryRequest) -> IdeaDiscoveryResponse:
    margin = payload.capital
    loc = payload.location
    exp = payload.experience or "Beginner"

    # 1. Attempt Live Groq AI Idea Generation if API key is provided
    groq_api_key = (os.getenv("GROQ_API_KEY") or os.getenv("AI_API_KEY") or "").strip().strip('"\'')
    if groq_api_key and groq_api_key.startswith("gsk_"):
        try:
            from groq import Groq
            client = Groq(api_key=groq_api_key)
            model_name = os.getenv("AI_MODEL", "qwen/qwen3.8-27b").strip()
            village = (loc.village if loc else "") or "rural area"
            district = (loc.district if loc else "") or "local district"
            state = (loc.state if loc else "") or "India"
            project_cost = margin / 0.10 if margin > 0 else 1000000

            prompt = (
                f"You are GramBiz AI, an expert rural enterprise advisory engine in India.\n"
                f"Entrepreneur Profile:\n"
                f"- Location: {village}, District: {district}, State: {state}\n"
                f"- Available Margin Capital: ₹{margin:,.0f} (10% equity, total project size ₹{project_cost:,.0f} under 90% bank loan)\n"
                f"- Experience Level: {exp}\n\n"
                f"Recommend exactly 2 or 3 realistic, viable micro-enterprise ideas specifically tailored to this geography, demand, and budget.\n"
                f"Return valid JSON with key 'ideas' containing a list of objects with these keys:\n"
                f"- id: string (e.g. 'biz-ai-1')\n"
                f"- name: string (business title)\n"
                f"- category: string (one of 'Animal Husbandry', 'Retail', 'Textile', 'Food Processing', 'Services', 'Manufacturing', 'Renewable Energy')\n"
                f"- fit_rationale: string (1 sentence explaining why it fits ₹{margin:,.0f} equity)\n"
                f"- estimated_capital: number (total project cost around ₹{project_cost:,.0f})\n"
                f"- market_opportunity: string (1 sentence on customer demand in {district})\n"
                f"- risk_level: string ('Low', 'Medium', or 'High')\n"
                f"- confidence_level: string ('HIGH' or 'MEDIUM')"
            )

            candidate_models = [
                model_name,
                "qwen/qwen3.8-27b",
                "qwen/qwen3.6-27b",
                "openai/gpt-oss-120b"
            ]
            seen_models = set()
            models_to_try = [x for x in candidate_models if x and not (x in seen_models or seen_models.add(x))]

            for m_name in models_to_try:
                try:
                    res = client.chat.completions.create(
                        model=m_name,
                        messages=[{"role": "user", "content": prompt}],
                        response_format={"type": "json_object"},
                        max_tokens=650,
                        temperature=0.5,
                        timeout=10.0
                    )
                    raw_json = res.choices[0].message.content
                    parsed = json.loads(raw_json)
                    raw_ideas = parsed.get("ideas") if isinstance(parsed, dict) else parsed
                    if isinstance(raw_ideas, list) and len(raw_ideas) > 0:
                        validated_ideas = []
                        for idx, item in enumerate(raw_ideas[:3]):
                            validated_ideas.append(SuggestedIdeaItem(
                                id=str(item.get("id", f"biz-ai-{idx+1}")),
                                name=str(item.get("name", "Rural Enterprise")),
                                category=str(item.get("category", "Retail")),
                                fit_rationale=str(item.get("fit_rationale", f"Suitable for ₹{margin:,.0f} margin.")),
                                estimated_capital=float(item.get("estimated_capital", project_cost)),
                                market_opportunity=str(item.get("market_opportunity", f"Strong local market demand in {district}.")),
                                risk_level=str(item.get("risk_level", "Medium")),
                                confidence_level=str(item.get("confidence_level", "HIGH"))
                            ))
                        if validated_ideas:
                            return IdeaDiscoveryResponse(
                                ideas=validated_ideas,
                                disclaimer="AI-tailored micro-enterprise opportunities generated by GramBiz AI (Groq Engine)."
                            )
                except Exception as attempt_err:
                    logging.getLogger(__name__).warning("Groq idea model %s attempt failed: %s", m_name, attempt_err)
                    continue
        except Exception as groq_err:
            logging.getLogger(__name__).warning("Live Groq idea discovery failed, falling back to rule templates: %s", groq_err)

    # 2. Deterministic Rule & Catalog Templates Fallback
    ideas = []
    if margin < 100000:
        ideas = [
            SuggestedIdeaItem(
                id="biz-tailoring",
                name="Bespoke Tailoring Workshop",
                category="Textile",
                fit_rationale=f"Margin contribution of ₹{margin:,.0f} fits low-capital stitching machine setup.",
                estimated_capital=margin / 0.10,
                market_opportunity="High demand for bridal & custom blouse tailoring.",
                risk_level="Low",
                confidence_level="HIGH"
            ),
            SuggestedIdeaItem(
                id="biz-mobile-repair",
                name="Mobile Repair & Accessories",
                category="Services",
                fit_rationale="Low inventory setup with high service margins.",
                estimated_capital=margin / 0.10,
                market_opportunity="Rising smartphone population in local block.",
                risk_level="Low",
                confidence_level="MEDIUM"
            )
        ]
    elif margin < 500000:
        ideas = [
            SuggestedIdeaItem(
                id="biz-dairy",
                name="Dairy Farm & Milk Processing",
                category="Animal Husbandry",
                fit_rationale=f"Margin of ₹{margin:,.0f} supports 5-cattle dairy herd setup.",
                estimated_capital=margin / 0.10,
                market_opportunity="Steady daily cash flow from local tea stalls & households.",
                risk_level="Medium",
                confidence_level="HIGH"
            ),
            SuggestedIdeaItem(
                id="biz-bakery",
                name="Fresh Bakery & Confectionery",
                category="Food",
                fit_rationale="Supports commercial oven & retail shop lease.",
                estimated_capital=margin / 0.10,
                market_opportunity="Unserved youth & school evening snack market.",
                risk_level="Medium",
                confidence_level="MEDIUM"
            )
        ]
    else:
        ideas = [
            SuggestedIdeaItem(
                id="biz-solar-install",
                name="Solar Panel Installation & Services",
                category="Renewable Energy",
                fit_rationale=f"Margin of ₹{margin:,.0f} leverages larger scheme loans for equipment & vehicle.",
                estimated_capital=margin / 0.10,
                market_opportunity="Rising commercial rooftop solar adoption.",
                risk_level="Medium",
                confidence_level="HIGH"
            ),
            SuggestedIdeaItem(
                id="biz-food-processing",
                name="Agro-Food Processing Unit",
                category="Food",
                fit_rationale="Sufficient capital for automated spice mill & packaging machinery.",
                estimated_capital=margin / 0.10,
                market_opportunity="Regional wholesale flour & spice distribution.",
                risk_level="Low",
                confidence_level="HIGH"
            )
        ]

    return IdeaDiscoveryResponse(ideas=ideas)
