import math
from typing import Dict, Any, Tuple
from app.schemas.schemas import FinancialResult, WorkingCapitalResult, BudgetAllocationResult
from app.calculators.schemes_config import SCHEMES_CONFIG_REGISTRY, get_scheme_by_project_cost

def calculate_emi(principal: float, annual_rate: float, tenure_years: int) -> Tuple[float, float, float]:
    if principal <= 0 or tenure_years <= 0:
        return 0.0, 0.0, 0.0

    n = tenure_years * 12
    r = (annual_rate / 100.0) / 12.0

    if r == 0:
        emi = principal / n
    else:
        emi = principal * r * math.pow(1 + r, n) / (math.pow(1 + r, n) - 1)

    total_repayment = emi * n
    total_interest = total_repayment - principal
    return round(emi, 2), round(total_repayment, 2), round(total_interest, 2)

def calculate_financial_structure(margin_capital: float, beneficiary_ratio: float = 0.10) -> FinancialResult:
    if margin_capital <= 0:
        raise ValueError("Margin capital must be greater than 0")

    project_cost = margin_capital / beneficiary_ratio
    calculated_loan = project_cost * (1.0 - beneficiary_ratio)

    scheme = get_scheme_by_project_cost(project_cost)

    max_funding = scheme["max_loan"]
    max_project_cost_range = scheme["max_project_cost"]
    
    cap_exceeded = False
    max_supported_project_cost = None
    warning_message = None

    actual_loan = calculated_loan
    if calculated_loan > max_funding or project_cost > max_project_cost_range:
        cap_exceeded = True
        actual_loan = max_funding
        max_supported_project_cost = round(max_funding / (1.0 - beneficiary_ratio), 2)
        
        warning_message = (
            f"Your requested loan structure (Calculated Loan: ₹{calculated_loan:,.2f}) "
            f"exceeds the scheme funding cap of ₹{max_funding:,.2f}. The maximum supported "
            f"project cost under this scheme cap is ₹{max_supported_project_cost:,.2f}."
        )

    effective_project_cost = margin_capital + actual_loan if cap_exceeded else project_cost

    emi, total_repayment, total_interest = calculate_emi(
        principal=actual_loan,
        annual_rate=scheme["interest_rate"],
        tenure_years=scheme["tenure_years"]
    )

    return FinancialResult(
        margin_capital=round(margin_capital, 2),
        project_cost=round(effective_project_cost, 2),
        loan_amount=round(actual_loan, 2),
        beneficiary_ratio=beneficiary_ratio,
        loan_ratio=1.0 - beneficiary_ratio,
        scheme_name=scheme["name"],
        max_funding=max_funding,
        interest_rate=scheme["interest_rate"],
        tenure_years=scheme["tenure_years"],
        moratorium_months=scheme["moratorium_months"],
        monthly_emi=emi,
        total_interest=total_interest,
        total_repayment=total_repayment,
        cap_exceeded=cap_exceeded,
        max_supported_project_cost=max_supported_project_cost,
        cap_warning_message=warning_message
    )

def calculate_working_capital(
    rent: float = 0,
    raw_materials: float = 0,
    electricity: float = 0,
    labour: float = 0,
    transport: float = 0,
    marketing: float = 0,
    other: float = 0
) -> WorkingCapitalResult:
    monthly = rent + raw_materials + electricity + labour + transport + marketing + other
    reserve_3_months = monthly * 3.0
    return WorkingCapitalResult(
        total_monthly_op_cost=round(monthly, 2),
        reserve_3_months=round(reserve_3_months, 2)
    )

def calculate_budget_allocation(
    project_cost: float,
    equipment: float = 0,
    inventory: float = 0,
    infrastructure: float = 0,
    working_capital: float = 0,
    marketing: float = 0,
    contingency: float = 0
) -> BudgetAllocationResult:
    allocated = equipment + inventory + infrastructure + working_capital + marketing + contingency
    remaining = project_cost - allocated
    is_valid = allocated <= project_cost
    return BudgetAllocationResult(
        total_allocated=round(allocated, 2),
        project_cost=round(project_cost, 2),
        is_valid=is_valid,
        remaining=round(remaining, 2)
    )

def _build_scenario_card(margin: float, price: float, vol: float, op: float) -> Dict[str, Any]:
    fin = calculate_financial_structure(margin_capital=margin)
    rev = price * vol
    gross = rev - op
    margin_pct = round((gross / rev * 100), 1) if rev > 0 else 0.0
    return {
        "estimated_revenue": round(rev, 2),
        "estimated_operating_cost": round(op, 2),
        "estimated_gross_profit": round(gross, 2),
        "net_margin_pct": margin_pct,
        "working_capital_requirement": round(op * 3.0, 2),
        "project_cost": fin.project_cost,
        "estimated_loan": fin.loan_amount,
        "monthly_emi": fin.monthly_emi
    }

def calculate_scenario_simulation(
    margin_capital: float,
    selling_price: float,
    monthly_sales_volume: float,
    monthly_operating_cost: float
) -> Dict[str, Any]:
    # Current scenario baseline (100k margin, 50 price, 1000 vol, 35k op cost)
    curr_card = _build_scenario_card(100000.0, 50.0, 1000.0, 35000.0)
    new_card = _build_scenario_card(margin_capital, selling_price, monthly_sales_volume, monthly_operating_cost)

    rev_delta = new_card["estimated_revenue"] - curr_card["estimated_revenue"]
    profit_delta = new_card["estimated_gross_profit"] - curr_card["estimated_gross_profit"]

    return {
        "current_scenario": curr_card,
        "new_scenario": new_card,
        "revenue_delta": round(rev_delta, 2),
        "gross_profit_delta": round(profit_delta, 2),
        "disclaimer": "Simulated scenario estimates based on provided user parameters."
    }
