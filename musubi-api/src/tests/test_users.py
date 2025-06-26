import pytest
import requests
import uuid

API_URL = "http://localhost:5003/api"

@pytest.fixture(scope="module")
def user_payload():
    return {
        "name": "Test User",
        "email": f"testuser_{uuid.uuid4()}@musubi.com",
        "profile_type": "professional",
        "skills": ["Solidity", "Python"],
        "description": "Usuario de prueba para API"
    }

def test_create_user(user_payload):
    r = requests.post(f"{API_URL}/users", json=user_payload)
    assert r.status_code == 201, r.text
    resp = r.json()
    assert resp["success"] is True
    assert "user_id" in resp
    global created_user_id
    created_user_id = resp["user_id"]

def test_list_users():
    r = requests.get(f"{API_URL}/users")
    assert r.status_code == 200, r.text
    resp = r.json()
    assert resp["success"] is True
    assert "users" in resp
    assert isinstance(resp["users"], list)
    if resp["users"]:
        assert "id" in resp["users"][0]

def test_get_user_by_id():
    r = requests.get(f"{API_URL}/users")
    users = r.json()["users"]
    if not users:
        pytest.skip("No hay usuarios para probar get_user_by_id")
    user_id = users[-1]["id"]
    r2 = requests.get(f"{API_URL}/users/{user_id}")
    assert r2.status_code == 200, r2.text
    resp = r2.json()
    assert resp["success"] is True
    assert resp["user"]["id"] == user_id

def test_create_user_invalid():
    # Falta el campo obligatorio 'name'
    payload = {"email": "fail@musubi.com", "profile_type": "professional"}
    r = requests.post(f"{API_URL}/users", json=payload)
    assert r.status_code == 400
    resp = r.json()
    assert resp["success"] is False
    assert "error" in resp 