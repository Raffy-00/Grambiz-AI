from typing import Dict, Any, List

SCHEMES_CONFIG_REGISTRY: List[Dict[str, Any]] = [
    {
        "id": "MICRO_FINANCE",
        "name": "Micro Finance Concessional Scheme",
        "min_project_cost": 0.0,
        "max_project_cost": 140000.0,
        "funding_percentage": 90.0,
        "max_loan": 125000.0,
        "interest_rate": 6.5,
        "tenure_months": 36,
        "tenure_years": 3,
        "moratorium_months": 3,
        "source": "State Micro-Credit & NABARD Refinance Framework 2026",
        "effective_date": "2026-01-01",
        "last_verified_at": "2026-08-01",
        "description": "Concessional micro credit scheme for small project costs up to ₹1.40 Lakh."
    },
    {
        "id": "TERM_LOAN",
        "name": "Term Loan Assistance Scheme",
        "min_project_cost": 140000.0,
        "max_project_cost": 5000000.0,
        "funding_percentage": 90.0,
        "max_loan": 4500000.0,
        "interest_rate": 8.0,
        "tenure_months": 84,
        "tenure_years": 7,
        "moratorium_months": 6,
        "source": "District Industries Centre (DIC) Rural Enterprise Refinance",
        "effective_date": "2026-01-01",
        "last_verified_at": "2026-08-01",
        "description": "Term loan assistance for small rural enterprises with project costs up to ₹50 Lakh."
    }
]

def get_scheme_by_project_cost(project_cost: float) -> Dict[str, Any]:
    if project_cost <= SCHEMES_CONFIG_REGISTRY[0]["max_project_cost"]:
        return SCHEMES_CONFIG_REGISTRY[0]
    return SCHEMES_CONFIG_REGISTRY[1]
