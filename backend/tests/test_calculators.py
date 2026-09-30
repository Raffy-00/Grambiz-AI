import pytest
from app.calculators.financial import calculate_financial_structure, calculate_emi

def test_margin_zero_raises_error():
    with pytest.raises(ValueError):
        calculate_financial_structure(margin_capital=0.0)

def test_margin_negative_raises_error():
    with pytest.raises(ValueError):
        calculate_financial_structure(margin_capital=-5000.0)

def test_margin_boundary_14000():
    # Margin ₹14,000 -> Calculated Loan ₹1,26,000 > ₹1,25,000 Micro Finance Cap -> Capped at ₹1,25,000
    res = calculate_financial_structure(margin_capital=14000.0)
    assert res.loan_amount == 125000.0
    assert res.project_cost == 139000.0
    assert "Micro Finance" in res.scheme_name
    assert res.cap_exceeded == True

def test_margin_boundary_14001():
    # Margin ₹14,001 -> Project Cost = ₹1,40,010 (> 1.40L -> Term Loan Scheme)
    res = calculate_financial_structure(margin_capital=14001.0)
    assert res.project_cost == 140010.0
    assert res.loan_amount == 126009.0
    assert "Term Loan" in res.scheme_name

def test_margin_boundary_50000():
    res = calculate_financial_structure(margin_capital=50000.0)
    assert res.project_cost == 500000.0
    assert res.loan_amount == 450000.0
    assert res.cap_exceeded == False

def test_margin_boundary_100000():
    res = calculate_financial_structure(margin_capital=100000.0)
    assert res.project_cost == 1000000.0
    assert res.loan_amount == 900000.0
    assert res.cap_exceeded == False

def test_margin_boundary_500000():
    res = calculate_financial_structure(margin_capital=500000.0)
    assert res.project_cost == 5000000.0
    assert res.loan_amount == 4500000.0
    assert res.cap_exceeded == False

def test_margin_boundary_555556_overflow():
    # Margin ₹5,55,556 -> Calculated Loan ₹50,00,004 > ₹45,00,000 Cap
    res = calculate_financial_structure(margin_capital=555556.0)
    assert res.loan_amount == 4500000.0
    assert res.cap_exceeded == True

def test_margin_boundary_1000000_overflow():
    # Margin ₹10,00,000 -> Calculated Loan ₹90,00,000 > ₹45,00,000 Cap -> Loan capped at ₹45L
    res = calculate_financial_structure(margin_capital=1000000.0)
    assert res.loan_amount == 4500000.0
    assert res.cap_exceeded == True
    assert res.max_supported_project_cost == 5000000.0

def test_margin_boundary_10000000_extremely_high():
    res = calculate_financial_structure(margin_capital=10000000.0)
    assert res.loan_amount == 4500000.0
    assert res.cap_exceeded == True

def test_emi_calculation():
    # P = 900,000, 8% rate, 7 years
    emi, total_rep, total_int = calculate_emi(900000.0, 8.0, 7)
    assert emi > 0
    assert total_rep > 900000.0
    assert total_int > 0
