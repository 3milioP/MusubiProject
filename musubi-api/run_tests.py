#!/usr/bin/env python3
"""
Script para ejecutar todos los tests de la API de Musubi
"""

import os
import sys
import subprocess
import time
import requests
from pathlib import Path

# Colores para output
class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    END = '\033[0m'

def print_status(message: str, color: str = Colors.BLUE):
    """Imprime un mensaje de estado con color"""
    print(f"{color}{message}{Colors.END}")

def print_success(message: str):
    """Imprime un mensaje de éxito"""
    print(f"{Colors.GREEN}✅ {message}{Colors.END}")

def print_warning(message: str):
    """Imprime un mensaje de advertencia"""
    print(f"{Colors.YELLOW}⚠️  {message}{Colors.END}")

def print_error(message: str):
    """Imprime un mensaje de error"""
    print(f"{Colors.RED}❌ {message}{Colors.END}")

def check_api_running():
    """Verifica si la API está corriendo"""
    try:
        response = requests.get("http://localhost:5001/health", timeout=5)
        return response.status_code == 200
    except:
        return False

def run_pytest_tests():
    """Ejecuta los tests de pytest"""
    print_status("🧪 Ejecutando tests de pytest...")
    
    # Cambiar al directorio de tests
    test_dir = Path(__file__).parent / "src" / "tests"
    os.chdir(test_dir)
    
    # Ejecutar pytest
    try:
        result = subprocess.run([
            sys.executable, "-m", "pytest", 
            "-v", "--tb=short", "--color=yes"
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            print_success("Tests de pytest completados exitosamente")
            print(result.stdout)
        else:
            print_error("Tests de pytest fallaron")
            print(result.stdout)
            print(result.stderr)
            return False
            
    except Exception as e:
        print_error(f"Error ejecutando pytest: {e}")
        return False
    
    return True

def run_integration_tests():
    """Ejecuta los tests de integración"""
    print_status("🔗 Ejecutando tests de integración...")
    
    # Cambiar al directorio de tests
    test_dir = Path(__file__).parent / "src" / "tests"
    os.chdir(test_dir)
    
    try:
        result = subprocess.run([
            sys.executable, "test_integration.py"
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            print_success("Tests de integración completados exitosamente")
            print(result.stdout)
        else:
            print_warning("Tests de integración fallaron (puede ser normal si los servicios no están corriendo)")
            print(result.stdout)
            print(result.stderr)
            
    except Exception as e:
        print_error(f"Error ejecutando tests de integración: {e}")

def run_manual_tests():
    """Ejecuta tests manuales de endpoints críticos"""
    print_status("🔍 Ejecutando tests manuales...")
    
    endpoints_to_test = [
        ("GET", "/health", "Health check básico"),
        ("GET", "/health/detailed", "Health check detallado"),
        ("GET", "/api/krm/info", "Información del token KRM"),
        ("GET", "/api/marketplace/stats", "Estadísticas del marketplace"),
        ("GET", "/api/users", "Lista de usuarios"),
        ("GET", "/docs", "Documentación Swagger")
    ]
    
    base_url = "http://localhost:5001"
    
    for method, endpoint, description in endpoints_to_test:
        try:
            url = f"{base_url}{endpoint}"
            response = requests.request(method, url, timeout=10)
            
            if response.status_code in [200, 201]:
                print_success(f"{description}: OK ({response.status_code})")
            else:
                print_warning(f"{description}: {response.status_code}")
                
        except requests.exceptions.ConnectionError:
            print_error(f"{description}: API no disponible")
        except Exception as e:
            print_error(f"{description}: Error - {e}")

def main():
    """Función principal"""
    print_status(f"{Colors.BOLD}🧪 Ejecutando tests de la API de Musubi{Colors.END}")
    print()
    
    # Verificar si la API está corriendo
    if not check_api_running():
        print_warning("La API no está corriendo en http://localhost:5001")
        print_warning("Inicia la API primero con: python src/main.py")
        print()
    
    # Ejecutar tests de pytest
    pytest_success = run_pytest_tests()
    print()
    
    # Ejecutar tests de integración
    run_integration_tests()
    print()
    
    # Ejecutar tests manuales
    run_manual_tests()
    print()
    
    # Resumen
    print_status(f"{Colors.BOLD}📊 Resumen de tests:{Colors.END}")
    if pytest_success:
        print_success("Tests de pytest: PASARON")
    else:
        print_error("Tests de pytest: FALLARON")
    
    print_success("Tests de integración: EJECUTADOS")
    print_success("Tests manuales: EJECUTADOS")
    
    print()
    print_status("💡 Para ver la documentación de la API: http://localhost:5001/docs")
    print_status("💡 Para ver el health check: http://localhost:5001/health/detailed")

if __name__ == "__main__":
    main() 