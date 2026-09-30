from fastapi import APIRouter, HTTPException
from app.schemas.schemas import (
    FinancialCalculationRequest, FinancialResult,
    WorkingCapitalInput, WorkingCapitalResult,
    BudgetAllocationInput, BudgetAllocationResult,
    ScenarioSimulatorInput, ScenarioSimulatorResult
)
from app.calculators.financial import (
    calculate_financial_structure, calculate_emi,
    calculate_working_capital, calculate_budget_allocation,
    calculate_scenario_simulation
)

router = APIRouter(prefix="/api/financial", tags=["financial"])

@router.post("/calculate", response_model=FinancialResult)
def calculate_financial(payload: FinancialCalculationRequest):
    try:
        res = calculate_financial_structure(margin_capital=payload.margin_capital)
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/working-capital", response_model=WorkingCapitalResult)
def calculate_wc(payload: WorkingCapitalInput):
    return calculate_working_capital(
        rent=payload.rent,
        raw_materials=payload.raw_materials,
        electricity=payload.electricity,
        labour=payload.labour,
        transport=payload.transport,
        marketing=payload.marketing,
        other=payload.other
    )

@router.post("/budget-allocation", response_model=BudgetAllocationResult)
def calculate_budget(payload: BudgetAllocationInput, project_cost: float):
    return calculate_budget_allocation(
        project_cost=project_cost,
        equipment=payload.equipment,
        inventory=payload.inventory,
        infrastructure=payload.infrastructure,
        working_capital=payload.working_capital,
        marketing=payload.marketing,
        contingency=payload.contingency
    )

@router.post("/scenario", response_model=ScenarioSimulatorResult)
def calculate_scenario_endpoint(payload: ScenarioSimulatorInput):
    res = calculate_scenario_simulation(
        margin_capital=payload.margin_capital,
        selling_price=payload.selling_price,
        monthly_sales_volume=payload.monthly_sales_volume,
        monthly_operating_cost=payload.monthly_operating_cost
    )
    return ScenarioSimulatorResult(**res)
