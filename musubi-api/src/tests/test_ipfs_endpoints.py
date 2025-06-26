import pytest
import requests
import hashlib
import json

API_URL = "http://localhost:5003/api"

@pytest.fixture(scope="module")
def example_ipfs_data():
    # Simula un archivo de metadatos de usuario
    data = {
        "name": "Test User",
        "email": "test@musubi.com",
        "profile_type": "professional",
        "skills": ["Solidity", "Python"],
        "description": "Usuario de prueba para IPFS"
    }
    data_str = json.dumps(data, sort_keys=True)
    sha256_hash = hashlib.sha256(data_str.encode()).hexdigest()
    # CID de ejemplo (debería ser real en integración)
    ipfs_hash = "QmXnnyufdzAWL5CqZ2RnSNgPbvCc1ALT73s6epPrRnZ1Xy"
    return {
        "ipfs_hash": ipfs_hash,
        "sha256_hash": sha256_hash,
        "collection": "users",
        "data_type": "user_data",
        "data": data
    }

def test_store_ipfs_hash(example_ipfs_data):
    """Testea el endpoint de almacenamiento de hash IPFS en blockchain"""
    payload = {
        "ipfs_hash": example_ipfs_data["ipfs_hash"],
        "sha256_hash": example_ipfs_data["sha256_hash"],
        "collection": example_ipfs_data["collection"],
        "data_type": example_ipfs_data["data_type"]
    }
    r = requests.post(f"{API_URL}/ipfs/store", json=payload)
    assert r.status_code == 200, r.text
    resp = r.json()
    assert resp["success"] is True
    assert resp["ipfs_hash"] == payload["ipfs_hash"]
    assert resp["sha256_hash"] == payload["sha256_hash"]
    assert resp["collection"] == payload["collection"]
    assert resp["data_type"] == payload["data_type"]
    assert "transaction_hash" in resp

def test_verify_ipfs_hash(example_ipfs_data):
    """Testea la verificación de existencia de un hash IPFS en blockchain"""
    ipfs_hash = example_ipfs_data["ipfs_hash"]
    r = requests.get(f"{API_URL}/ipfs/verify/{ipfs_hash}")
    assert r.status_code == 200, r.text
    resp = r.json()
    assert resp["success"] is True
    assert resp["exists"] is True
    assert resp["record"]["ipfs_hash"] == ipfs_hash

def test_get_collection_records(example_ipfs_data):
    """Testea la consulta de registros por colección"""
    collection = example_ipfs_data["collection"]
    r = requests.get(f"{API_URL}/ipfs/collection/{collection}")
    assert r.status_code == 200, r.text
    resp = r.json()
    assert resp["success"] is True
    assert resp["collection"] == collection
    assert resp["total_records"] >= 1
    found = any(rec["ipfs_hash"] == example_ipfs_data["ipfs_hash"] for rec in resp["records"])
    assert found 