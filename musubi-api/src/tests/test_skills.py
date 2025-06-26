import pytest
import requests

API_URL = "http://localhost:5003/api/skills"

def test_get_skill_categories():
    r = requests.get(f"{API_URL}/categories")
    assert r.status_code == 200, r.text
    resp = r.json()
    assert resp["success"] is True
    assert "data" in resp
    assert "categories" in resp["data"]
    assert isinstance(resp["data"]["categories"], list) 