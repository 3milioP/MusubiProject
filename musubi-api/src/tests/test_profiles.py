import pytest
import requests

API_URL = "http://localhost:5003/api/profiles"

# Usa una dirección de prueba de Hardhat
TEST_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"

def test_get_profile():
    r = requests.get(f"{API_URL}/{TEST_ADDRESS}")
    assert r.status_code in (200, 404)
    resp = r.json()
    assert "success" in resp
    if resp["success"]:
        assert resp["data"]["address"].lower() == TEST_ADDRESS.lower()

def test_check_profile_exists():
    r = requests.get(f"{API_URL}/exists/{TEST_ADDRESS}")
    assert r.status_code == 200
    resp = r.json()
    assert "success" in resp
    assert "data" in resp
    assert resp["data"]["address"].lower() == TEST_ADDRESS.lower()
    assert "exists" in resp["data"]

def test_get_profile_count():
    r = requests.get(f"{API_URL}/count")
    assert r.status_code == 200
    resp = r.json()
    assert resp["success"] is True
    assert "data" in resp
    assert "total_profiles" in resp["data"] 