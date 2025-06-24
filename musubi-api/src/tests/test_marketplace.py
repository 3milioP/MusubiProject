import pytest
import requests

API_URL = "http://localhost:5001/api/marketplace"
TEST_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"

def test_list_user_orders():
    r = requests.get(f"{API_URL}/orders/user/{TEST_ADDRESS}")
    assert r.status_code == 200, r.text
    resp = r.json()
    assert resp["success"] is True
    assert "data" in resp
    assert resp["data"]["user"].lower() == TEST_ADDRESS.lower()
    assert "orders" in resp["data"] 