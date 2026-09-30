import uuid
import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.schemas.schemas import AssessmentRequest, FullAssessmentResponse
from app.calculators.financial import calculate_financial_structure, calculate_working_capital, calculate_budget_allocation
from app.services.feasibility_engine import analyze_feasibility
from app.database.database import get_db
from app.database.models import AssessmentRecord

router = APIRouter(prefix="/api", tags=["assessment"])

DISCLAIMER_TEXT = (
    "Estimated financial structure based on the provided scheme parameters. "
    "Final loan eligibility and sanction are subject to the applicable authority, eligibility criteria, documentation, verification, and approval."
)

@router.post("/assessment", response_model=FullAssessmentResponse)
def create_assessment(payload: AssessmentRequest, db: Session = Depends(get_db)):
    # 1. Run Financial Engine
    fin_res = calculate_financial_structure(margin_capital=payload.capital.margin_capital)
    
    # 2. Run Feasibility Engine
    biz_res = analyze_feasibility(
        location=payload.location,
        capital=payload.capital,
        business=payload.business
    )
    
    # 3. Default Working Capital & Budget Allocation
    wc_res = calculate_working_capital(
        rent=10000, raw_materials=25000, electricity=3000, labour=12000, transport=5000
    )
    budget_res = calculate_budget_allocation(
        project_cost=fin_res.project_cost,
        equipment=fin_res.project_cost * 0.40,
        inventory=fin_res.project_cost * 0.25,
        infrastructure=fin_res.project_cost * 0.15,
        working_capital=fin_res.project_cost * 0.10,
        marketing=fin_res.project_cost * 0.05,
        contingency=fin_res.project_cost * 0.05
    )

    assessment_id = f"GB-{uuid.uuid4().hex[:8].upper()}"
    created_at_str = datetime.datetime.now(datetime.timezone.utc).isoformat()

    full_resp = FullAssessmentResponse(
        id=assessment_id,
        created_at=created_at_str,
        location=payload.location,
        capital=payload.capital,
        business=payload.business,
        financial_result=fin_res,
        business_analysis=biz_res,
        working_capital=wc_res,
        budget_allocation=budget_res,
        disclaimer=DISCLAIMER_TEXT
    )

    # Persist in DB
    try:
        village_val = (payload.location.village if payload.location and payload.location.village else "Valarpuram")
        district_val = (payload.location.district if payload.location and payload.location.district else "Kanchipuram")
        state_val = (payload.location.state if payload.location and payload.location.state else "Tamil Nadu")

        record = AssessmentRecord(
            id=assessment_id,
            user_id=payload.user_id,
            village=village_val,
            district=district_val,
            state=state_val,
            margin_capital=payload.capital.margin_capital,
            business_category=payload.business.category,
            experience=payload.business.experience,
            project_cost=fin_res.project_cost,
            loan_amount=fin_res.loan_amount,
            scheme_name=fin_res.scheme_name,
            feasibility_score=biz_res.feasibility_score.overall_score,
            raw_json_data=full_resp.model_dump()
        )
        db.add(record)
        db.commit()
    except Exception as e:
        db.rollback()
        # Non-blocking log if db save fails in demo
        print("Database save error:", e)

    return full_resp

@router.get("/reports", response_model=List[FullAssessmentResponse])
def get_reports(db: Session = Depends(get_db)):
    records = db.query(AssessmentRecord).order_by(AssessmentRecord.created_at.desc()).limit(20).all()
    results = []
    for r in records:
        if r.raw_json_data:
            results.append(FullAssessmentResponse(**r.raw_json_data))
    return results

@router.get("/reports/{report_id}", response_model=FullAssessmentResponse)
def get_report_by_id(report_id: str, db: Session = Depends(get_db)):
    record = db.query(AssessmentRecord).filter(AssessmentRecord.id == report_id).first()
    if not record or not record.raw_json_data:
        raise HTTPException(status_code=404, detail="Assessment report not found")
    return FullAssessmentResponse(**record.raw_json_data)
