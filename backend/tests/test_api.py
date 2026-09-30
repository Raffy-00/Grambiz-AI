from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

def test_schemes_endpoint():
    res = client.get("/api/schemes")
    assert res.status_code == 200
    data = res.json()
    assert "schemes" in data
    assert len(data["schemes"]) >= 2
    assert "Micro Finance" in data["schemes"][0]["name"]

def test_geocode_endpoint():
    res = client.get("/api/location/geocode?q=Kanchipuram")
    assert res.status_code == 200
    data = res.json()
    assert "latitude" in data
    assert "longitude" in data

def test_reverse_geocode_endpoint():
    res = client.get("/api/location/reverse-geocode?lat=13.0125&lon=79.9754")
    assert res.status_code == 200
    data = res.json()
    assert "village" in data

def test_nearby_businesses_endpoint():
    payload = {
        "latitude": 13.0125,
        "longitude": 79.9754,
        "radius_km": 5.0,
        "business_category": "Dairy"
    }
    res = client.post("/api/location/nearby-businesses", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "businesses" in data
    assert "count_5km" in data
    assert len(data["businesses"]) >= 1

def test_create_assessment_endpoint():
    payload = {
        "location": {"village": "Valarpuram", "block": "Sriperumbudur", "district": "Kanchipuram", "state": "Tamil Nadu", "latitude": 13.0125, "longitude": 79.9754},
        "capital": {"margin_capital": 100000.0},
        "business": {"category": "Dairy", "experience": "Beginner"}
    }
    res = client.post("/api/assessment", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["financial_result"]["loan_amount"] == 900000.0
    assert data["business_analysis"]["feasibility_score"]["overall_score"] > 0
    assert data["business_analysis"]["confidence_rating"]["level"] in ["HIGH", "MEDIUM", "LOW"]

def test_business_comparison_endpoint():
    payload = {
        "categories": ["Dairy", "Textile", "Food Processing"],
        "margin_capital": 100000.0,
        "location": {"village": "Valarpuram", "district": "Kanchipuram"}
    }
    res = client.post("/api/business/compare", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert len(data["items"]) == 3
    assert data["recommended_option"] in ["Dairy", "Textile", "Food Processing"]

def test_scenario_simulator_endpoint():
    payload = {
        "margin_capital": 100000.0,
        "category": "Dairy",
        "selling_price": 52.0,
        "monthly_sales_volume": 1000.0,
        "monthly_operating_cost": 35000.0
    }
    res = client.post("/api/financial/scenario", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "current_scenario" in data
    assert "new_scenario" in data
    assert data["new_scenario"]["estimated_revenue"] == 52000.0

def test_ai_status_endpoint():
    res = client.get("/api/ai/status")
    assert res.status_code == 200
    data = res.json()
    assert "status" in data
    assert "configured" in data
    assert "engine" in data

def test_ai_chat_endpoint():
    payload = {
        "messages": [{"role": "user", "content": "Namaste! Tell me about the PMEGP subsidy."}],
        "language": "en",
        "context": {
            "business": {"category": "Dairy Farm"},
            "location": {"village": "Valarpuram"},
            "capital": {"margin_capital": 100000.0}
        }
    }
    res = client.post("/api/ai/chat", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "reply" in data
    assert len(data["reply"]) > 20

