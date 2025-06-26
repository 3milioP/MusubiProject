import pytest
import requests

API_URL = "http://localhost:5003/api/timeregistry"
TEST_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"

def test_get_user_time_records():
    r = requests.get(f"{API_URL}/user/{TEST_ADDRESS}")
    assert r.status_code == 200, r.text
    resp = r.json()
    assert "success" in resp
    assert "data" in resp
    assert resp["data"]["address"].lower() == TEST_ADDRESS.lower()
    assert "records" in resp["data"]

def test_get_time_records_count():
    r = requests.get(f"{API_URL}/count")
    assert r.status_code == 200, r.text
    resp = r.json()
    assert resp["success"] is True
    assert "data" in resp
    assert "total_records" in resp["data"] 