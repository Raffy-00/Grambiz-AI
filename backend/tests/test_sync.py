from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_auth_and_draft_synchronization():
    test_phone = "9876543210"
    
    # 1. Authenticate user
    auth_resp = client.post("/api/user/auth", json={
        "phone": test_phone,
        "name": "Ramesh Patel",
        "language": "en"
    })
    assert auth_resp.status_code == 200
    data = auth_resp.json()
    assert data["status"] == "success"
    assert data["user"]["name"] == "Ramesh Patel"

    # 2. Save a draft from Web
    draft_payload = {
        "user_id": test_phone,
        "current_step": 3,
        "business_data": {
            "category": "Dairy",
            "custom_category": "Organic Cow Dairy Farm",
            "experience": "Some experience"
        },
        "location_data": {
            "village": "Valarpuram",
            "district": "Kanchipuram",
            "state": "Tamil Nadu"
        },
        "capital_data": {
            "margin_capital": 100000
        },
        "completed_steps": {"1": True, "2": True},
        "last_platform": "web"
    }
    save_resp = client.post("/api/user/draft", json=draft_payload)
    assert save_resp.status_code == 200
    assert save_resp.json()["status"] == "synchronized"

    # 3. Simulate Mobile fetching the exact same draft
    get_resp = client.get(f"/api/user/draft?user_id={test_phone}")
    assert get_resp.status_code == 200
    retrieved = get_resp.json()
    assert retrieved["has_draft"] is True
    assert retrieved["draft"]["current_step"] == 3
    assert retrieved["draft"]["business_data"]["category"] == "Dairy"
    assert retrieved["draft"]["location_data"]["village"] == "Valarpuram"

    # 4. Simulate Mobile updating Location and continuing
    mobile_update_payload = dict(draft_payload)
    mobile_update_payload["current_step"] = 4
    mobile_update_payload["location_data"]["village"] = "Sriperumbudur"
    mobile_update_payload["last_platform"] = "mobile"
    
    update_resp = client.post("/api/user/draft", json=mobile_update_payload)
    assert update_resp.status_code == 200

    # 5. Simulate Web fetching updated draft
    web_sync_resp = client.get(f"/api/user/draft?user_id={test_phone}")
    assert web_sync_resp.status_code == 200
    updated_draft = web_sync_resp.json()["draft"]
    assert updated_draft["current_step"] == 4
    assert updated_draft["location_data"]["village"] == "Sriperumbudur"
    assert updated_draft["last_platform"] == "mobile"

def test_chat_message_sync():
    test_phone = "9876543210"
    
    # Store a user message
    post_msg = client.post("/api/user/chat", json={
        "user_id": test_phone,
        "role": "user",
        "content": "What is the PMEGP subsidy in Tamil Nadu?"
    })
    assert post_msg.status_code == 200

    # Store assistant reply
    post_asst = client.post("/api/user/chat", json={
        "user_id": test_phone,
        "role": "assistant",
        "content": "In rural areas of Tamil Nadu, PMEGP subsidy is up to 35%."
    })
    assert post_asst.status_code == 200

    # Retrieve shared chat thread
    get_chat = client.get(f"/api/user/chat?user_id={test_phone}")
    assert get_chat.status_code == 200
    msgs = get_chat.json()
    assert len(msgs) >= 2
    assert msgs[-1]["role"] == "assistant"
