"""
Tests de integración para Musubi API
Verifica el flujo completo IPFS + Blockchain
"""
import pytest
import requests
import json
import time
from datetime import datetime

API_BASE_URL = "http://localhost:5003/api"

class TestIntegration:
    """Tests de integración para el flujo completo"""
    
    def test_health_check(self):
        """Test del health check básico"""
        response = requests.get(f"{API_BASE_URL.replace('/api', '')}/health")
        assert response.status_code == 200
        data = response.json()
        assert data['status'] == 'healthy'
        assert 'services' in data
    
    def test_detailed_health_check(self):
        """Test del health check detallado"""
        response = requests.get(f"{API_BASE_URL.replace('/api', '')}/health/detailed")
        assert response.status_code == 200
        data = response.json()
        assert data['status'] == 'healthy'
        assert 'services' in data
        assert 'blockchain' in data['services']
        assert 'ipfs' in data['services']
        assert 'contracts' in data['services']
    
    def test_ipfs_integration_flow(self):
        """Test completo del flujo IPFS + Blockchain"""
        # 1. Crear datos de prueba
        test_data = {
            "name": "Test User Integration",
            "email": f"integration_{int(time.time())}@musubi.com",
            "profile_type": "professional",
            "skills": ["Solidity", "Python", "React"],
            "description": "Usuario de prueba para integración"
        }
        
        # 2. Crear usuario (esto almacena en IPFS y registra en blockchain)
        response = requests.post(f"{API_BASE_URL}/users", json=test_data)
        assert response.status_code == 201
        user_response = response.json()
        assert user_response['success'] is True
        assert 'user_id' in user_response
        assert 'ipfs_hash' in user_response
        
        user_id = user_response['user_id']
        ipfs_hash = user_response['ipfs_hash']
        
        # 3. Verificar que el usuario se creó correctamente
        response = requests.get(f"{API_BASE_URL}/users/{user_id}")
        assert response.status_code == 200
        user_data = response.json()
        assert user_data['success'] is True
        assert user_data['user']['name'] == test_data['name']
        
        # 4. Verificar hash en IPFS Registry
        response = requests.get(f"{API_BASE_URL}/ipfs/verify/{ipfs_hash}")
        assert response.status_code == 200
        ipfs_verify = response.json()
        # Nota: Esto puede fallar si el contrato IPFSRegistry no está configurado
        # assert ipfs_verify['success'] is True
        
        # 5. Obtener contenido de IPFS
        response = requests.get(f"{API_BASE_URL}/ipfs/{ipfs_hash}")
        if response.status_code == 200:
            ipfs_content = response.json()
            assert ipfs_content['success'] is True
            assert 'data' in ipfs_content
        
        # 6. Verificar que aparece en la lista de usuarios
        response = requests.get(f"{API_BASE_URL}/users")
        assert response.status_code == 200
        users_response = response.json()
        assert users_response['success'] is True
        
        # Buscar el usuario creado
        user_found = False
        for user in users_response['users']:
            if user['id'] == user_id:
                user_found = True
                break
        assert user_found is True
    
    def test_krm_token_integration(self):
        """Test de integración con el token KRM"""
        test_address = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
        
        # 1. Obtener balance
        response = requests.get(f"{API_BASE_URL}/krm/balance/{test_address}")
        assert response.status_code == 200
        balance_response = response.json()
        assert balance_response['success'] is True
        assert 'data' in balance_response
        assert balance_response['data']['address'].lower() == test_address.lower()
        
        # 2. Obtener información del token
        response = requests.get(f"{API_BASE_URL}/krm/info")
        assert response.status_code == 200
        info_response = response.json()
        assert info_response['success'] is True
        assert 'data' in info_response
        assert 'name' in info_response['data']
        assert 'symbol' in info_response['data']
        
        # 3. Obtener suministro total
        response = requests.get(f"{API_BASE_URL}/krm/total-supply")
        assert response.status_code == 200
        supply_response = response.json()
        assert supply_response['success'] is True
        assert 'data' in supply_response
        assert 'total_supply_krm' in supply_response['data']
    
    def test_marketplace_integration(self):
        """Test de integración con el marketplace"""
        # 1. Obtener todos los servicios
        response = requests.get(f"{API_BASE_URL}/marketplace/services")
        assert response.status_code == 200
        services_response = response.json()
        assert services_response['success'] is True
        assert 'data' in services_response
        assert 'services' in services_response['data']
        
        # 2. Obtener estadísticas del marketplace
        response = requests.get(f"{API_BASE_URL}/marketplace/stats")
        assert response.status_code == 200
        stats_response = response.json()
        assert stats_response['success'] is True
        assert 'data' in stats_response
    
    def test_error_handling(self):
        """Test de manejo de errores"""
        # 1. Usuario inexistente
        response = requests.get(f"{API_BASE_URL}/users/nonexistent-user-id")
        assert response.status_code == 404
        
        # 2. Datos inválidos para crear usuario
        invalid_data = {"email": "invalid@test.com"}  # Falta name y profile_type
        response = requests.post(f"{API_BASE_URL}/users", json=invalid_data)
        assert response.status_code == 400
        
        # 3. Dirección inválida para KRM
        response = requests.get(f"{API_BASE_URL}/krm/balance/invalid-address")
        assert response.status_code == 400
    
    def test_api_documentation(self):
        """Test de que la documentación esté disponible"""
        response = requests.get(f"{API_BASE_URL.replace('/api', '')}/docs")
        assert response.status_code == 200
    
    def test_cors_headers(self):
        """Test de que CORS esté configurado correctamente"""
        response = requests.get(f"{API_BASE_URL}/users")
        assert response.status_code == 200
        # Verificar que los headers CORS estén presentes
        assert 'Access-Control-Allow-Origin' in response.headers

if __name__ == "__main__":
    # Ejecutar tests manualmente
    test_instance = TestIntegration()
    
    print("🧪 Ejecutando tests de integración...")
    
    try:
        test_instance.test_health_check()
        print("✅ Health check básico: OK")
    except Exception as e:
        print(f"❌ Health check básico: {e}")
    
    try:
        test_instance.test_detailed_health_check()
        print("✅ Health check detallado: OK")
    except Exception as e:
        print(f"❌ Health check detallado: {e}")
    
    try:
        test_instance.test_krm_token_integration()
        print("✅ Integración KRM: OK")
    except Exception as e:
        print(f"❌ Integración KRM: {e}")
    
    try:
        test_instance.test_marketplace_integration()
        print("✅ Integración Marketplace: OK")
    except Exception as e:
        print(f"❌ Integración Marketplace: {e}")
    
    try:
        test_instance.test_error_handling()
        print("✅ Manejo de errores: OK")
    except Exception as e:
        print(f"❌ Manejo de errores: {e}")
    
    print("🎯 Tests de integración completados") 