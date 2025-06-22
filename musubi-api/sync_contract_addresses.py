#!/usr/bin/env python3
"""
Script de sincronización de direcciones de contratos para Musubi API
Lee automáticamente las direcciones desde los archivos de despliegue de Hardhat Ignition
y actualiza la configuración de la API.
"""

import os
import json
import sys
from pathlib import Path
from typing import Dict, Optional

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

def get_project_root() -> Path:
    """Obtiene la ruta raíz del proyecto"""
    current_dir = Path(__file__).parent
    return current_dir.parent

def get_available_networks() -> Dict[str, Dict]:
    """Obtiene las redes disponibles basándose en los directorios de despliegue"""
    project_root = get_project_root()
    ignition_dir = project_root / "hardhat-dev" / "ignition" / "deployments"
    
    networks = {}
    
    if not ignition_dir.exists():
        print_warning(f"Directorio de despliegues no encontrado: {ignition_dir}")
        return networks
    
    # Buscar directorios de redes (chain-*)
    for chain_dir in ignition_dir.iterdir():
        if chain_dir.is_dir() and chain_dir.name.startswith("chain-"):
            chain_id = chain_dir.name.replace("chain-", "")
            deployed_file = chain_dir / "deployed_addresses.json"
            
            if deployed_file.exists():
                try:
                    with open(deployed_file, 'r') as f:
                        addresses = json.load(f)
                    
                    # Mapear nombres de red
                    network_name = get_network_name(chain_id)
                    networks[network_name] = {
                        'chain_id': chain_id,
                        'deployment_path': str(deployed_file),
                        'addresses': addresses
                    }
                    print_success(f"Red encontrada: {network_name} (Chain ID: {chain_id})")
                except Exception as e:
                    print_error(f"Error leyendo {deployed_file}: {e}")
    
    return networks

def get_network_name(chain_id: str) -> str:
    """Mapea el chain ID a un nombre de red legible"""
    network_map = {
        "31337": "local",
        "11155111": "sepolia", 
        "80002": "polygon_amoy",
        "137": "polygon",
        "1": "ethereum",
        "56": "bsc",
        "42161": "arbitrum"
    }
    return network_map.get(chain_id, f"chain_{chain_id}")

def create_api_config(networks: Dict[str, Dict], selected_network: Optional[str] = None) -> Dict:
    """Crea la configuración para la API"""
    project_root = get_project_root()
    
    # Configuración base de redes
    networks_config = {
        'local': {
            'rpc_url': 'http://localhost:8545',
            'chain_id': 31337,
            'name': 'Musubi Local'
        },
        'sepolia': {
            'name': 'Sepolia Testnet',
            'rpc_url': f"https://sepolia.infura.io/v3/{os.getenv('INFURA_PROJECT_ID', '')}",
            'chain_id': 11155111,
            'explorer_url': 'https://sepolia.etherscan.io'
        },
        'polygon_amoy': {
            'name': 'Polygon Amoy Testnet',
            'rpc_url': f"https://polygon-amoy.infura.io/v3/{os.getenv('INFURA_PROJECT_ID', '')}",
            'chain_id': 80002,
            'explorer_url': 'https://amoy.polygonscan.com'
        },
        'polygon': {
            'name': 'Polygon Mainnet',
            'rpc_url': f"https://polygon-mainnet.infura.io/v3/{os.getenv('INFURA_PROJECT_ID', '')}",
            'chain_id': 137,
            'explorer_url': 'https://polygonscan.com'
        }
    }
    
    # Direcciones de contratos por red
    contract_addresses = {}
    
    for network_name, network_data in networks.items():
        if network_name in networks_config:
            # Mapear direcciones desde el formato de Ignition
            addresses = {}
            for contract_key, address in network_data['addresses'].items():
                # Convertir "MusubiDeployment#KRMToken" a "KRMToken"
                contract_name = contract_key.split('#')[-1]
                addresses[contract_name] = address
            
            contract_addresses[network_name] = addresses
    
    # Si no hay redes disponibles, usar configuración por defecto
    if not contract_addresses:
        print_warning("No se encontraron redes desplegadas, usando configuración por defecto")
        contract_addresses = {
            'local': {
                'KRMToken': '0x5FbDB2315678afecb367f032d93F642f64180aa3',
                'ProfileRegistry': '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
                'SkillSystem': '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
                'TimeRegistry': '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
                'P2PMarketplace': '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9'
            }
        }
    
    # Configuración final
    config = {
        'networks': networks_config,
        'contract_addresses': contract_addresses,
        'active_network': selected_network or 'local',
        'last_sync': str(Path().cwd()),
        'artifacts_path': str(project_root / "hardhat-dev" / "artifacts" / "contracts")
    }
    
    return config

def save_api_config(config: Dict) -> str:
    """Guarda la configuración en un archivo JSON"""
    config_file = Path(__file__).parent / "src" / "config" / "api_config.json"
    config_file.parent.mkdir(parents=True, exist_ok=True)
    
    with open(config_file, 'w') as f:
        json.dump(config, f, indent=2)
    
    return str(config_file)

def main():
    """Función principal del script"""
    print_status(f"{Colors.BOLD}🔄 Sincronizando direcciones de contratos para Musubi API{Colors.END}")
    print()
    
    # Obtener redes disponibles
    networks = get_available_networks()
    
    if not networks:
        print_error("No se encontraron redes desplegadas")
        print_warning("Ejecuta primero el despliegue de contratos")
        return 1
    
    # Mostrar redes disponibles
    print_status("📡 Redes disponibles:")
    for i, (network_name, network_data) in enumerate(networks.items(), 1):
        print(f"  {i}. {network_name} (Chain ID: {network_data['chain_id']})")
    
    # Selección de red (por ahora usar la primera disponible)
    selected_network = list(networks.keys())[0]
    print_success(f"Red seleccionada: {selected_network}")
    
    # Crear configuración
    config = create_api_config(networks, selected_network)
    
    # Guardar configuración
    config_file = save_api_config(config)
    print_success(f"Configuración guardada en: {config_file}")
    
    # Mostrar resumen
    print()
    print_status("📋 Resumen de la configuración:")
    print(f"  Red activa: {config['active_network']}")
    print(f"  Redes configuradas: {', '.join(config['contract_addresses'].keys())}")
    
    for network_name, addresses in config['contract_addresses'].items():
        print(f"  {network_name}: {len(addresses)} contratos")
    
    print()
    print_success("✅ Sincronización completada")
    print_status("La API usará automáticamente esta configuración al reiniciarse")
    
    return 0

if __name__ == "__main__":
    sys.exit(main()) 