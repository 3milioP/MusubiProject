import pytest
import requests

API_URL = "http://localhost:5003/api/krm"
TEST_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"

OWNER = TEST_ADDRESS
SPENDER = TEST_ADDRESS

def test_get_balance():
    r = requests.get(f"{API_URL}/balance/{TEST_ADDRESS}")
    assert r.status_code == 200, r.text
    resp = r.json()
    assert resp["success"] is True
    assert "data" in resp
    assert resp["data"]["address"].lower() == TEST_ADDRESS.lower()

def test_get_total_supply():
    r = requests.get(f"{API_URL}/total-supply")
    assert r.status_code == 200, r.text
    resp = r.json()
    assert resp["success"] is True
    assert "data" in resp
    assert "total_supply_wei" in resp["data"]

def test_get_token_info():
    r = requests.get(f"{API_URL}/info")
    assert r.status_code == 200, r.text
    resp = r.json()
    assert resp["success"] is True
    assert "data" in resp
    assert "name" in resp["data"]

def test_get_allowance():
    r = requests.get(f"{API_URL}/allowance?owner={OWNER}&spender={SPENDER}")
    assert r.status_code == 200, r.text
    resp = r.json()
    assert resp["success"] is True
    assert "data" in resp
    assert resp["data"]["owner"].lower() == OWNER.lower()
    assert resp["data"]["spender"].lower() == SPENDER.lower() 