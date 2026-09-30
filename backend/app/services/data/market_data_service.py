from typing import Dict, Any

def get_market_pricing_for_category(category: str) -> Dict[str, Any]:
    pricing_map = {
        "Dairy": {
            "range": "₹45 – ₹65 / Litre",
            "suggested": "₹52 / Litre",
            "margin": "₹8 – ₹12 / Litre",
            "considerations": ["Feed & fodder acquisition", "Cooling & transport", "Perishability buffer"]
        },
        "Poultry": {
            "range": "₹160 – ₹220 / Kg",
            "suggested": "₹185 / Kg",
            "margin": "₹25 – ₹40 / Kg",
            "considerations": ["Commercial feed blend", "Vaccination costs", "Seasonal demand"]
        },
        "Grocery/Retail": {
            "range": "MRP based with 8% – 18% margin",
            "suggested": "Competitive MRP Bundle",
            "margin": "12% Gross Margin",
            "considerations": ["Wholesale stock purchasing", "Shop rent & electricity", "Credit ledger buffer"]
        },
        "Tailoring": {
            "range": "₹150 – ₹600 / Garment",
            "suggested": "₹220 / Blouse/Shirt",
            "margin": "65% Labor Margin",
            "considerations": ["Power backup / inverter", "Thread & accessories", "Peak season labor"]
        }
    }

    res = pricing_map.get(category, {
        "range": "₹100 – ₹500 / unit",
        "suggested": "₹250 / unit",
        "margin": "25% – 35% margin",
        "considerations": ["Initial stock acquisition", "Rent & utilities", "Transport & logistics"]
    })

    return {
        "market_price_range": res["range"],
        "suggested_starting_price": res["suggested"],
        "estimated_gross_margin": res["margin"],
        "cost_considerations": res["considerations"],
        "status": "ESTIMATED",
        "data_source": "Regional Benchmark Price Index"
    }
