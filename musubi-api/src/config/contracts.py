"""
Configuración de contratos inteligentes para Musubi API
Carga dinámicamente la configuración desde api_config.json
"""
import os
import json
from web3 import Web3
from typing import Dict, Any, Optional
from pathlib import Path
import sys

# Variables globales para la configuración
API_CONFIG = {}
CONTRACT_ABIS = {}

def load_api_config():
    """Carga la configuración de la API desde el archivo JSON"""
    global API_CONFIG
    
    config_file = Path(__file__).parent / "api_config.json"
    
    if not config_file.exists():
        print(f"⚠️  Archivo de configuración no encontrado: {config_file}")
        print("🔄 Ejecutando sincronización automática...")
        
        # Intentar ejecutar el script de sincronización
        sync_script = Path(__file__).parent.parent.parent / "sync_contract_addresses.py"
        if sync_script.exists():
            import subprocess
            try:
                result = subprocess.run([sys.executable, str(sync_script)], 
                                      capture_output=True, text=True, cwd=str(sync_script.parent))
                if result.returncode == 0:
                    print("✅ Sincronización completada")
                    # Recargar configuración
                    if config_file.exists():
                        with open(config_file, 'r') as f:
                            API_CONFIG = json.load(f)
                        return
                else:
                    print(f"❌ Error en sincronización: {result.stderr}")
            except Exception as e:
                print(f"❌ Error ejecutando sincronización: {e}")
        
        # Usar configuración por defecto
        API_CONFIG = {
            'networks': {
                'local': {
                    'rpc_url': 'http://localhost:8545',
                    'chain_id': 31337,
                    'name': 'Musubi Local'
                }
            },
            'contract_addresses': {
                'local': {
                    'KRMToken': '0x5FbDB2315678afecb367f032d93F642f64180aa3',
                    'ProfileRegistry': '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
                    'SkillSystem': '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
                    'TimeRegistry': '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
                    'P2PMarketplace': '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
                    'IPFSRegistry': '0x0165878A594ca255338adfa4d48449f69242Eb8F'
                }
            },
            'active_network': 'local'
        }
        return
    
    try:
        with open(config_file, 'r') as f:
            API_CONFIG = json.load(f)
        print(f"✅ Configuración cargada desde: {config_file}")
    except Exception as e:
        print(f"❌ Error cargando configuración: {e}")
        API_CONFIG = {}

def get_networks() -> Dict[str, Dict]:
    """Obtiene la configuración de redes disponibles"""
    if not API_CONFIG:
        load_api_config()
    return API_CONFIG.get('networks', {})

def get_contract_addresses(network: Optional[str] = None) -> Dict[str, str]:
    """Obtiene las direcciones de contratos para la red especificada"""
    if not API_CONFIG:
        load_api_config()
    
    if network is None:
        network = API_CONFIG.get('active_network', 'local')
    
    addresses = API_CONFIG.get('contract_addresses', {}).get(network, {})
    
    if not addresses:
        print(f"⚠️  No se encontraron direcciones para la red: {network}")
        return {}
    
    return addresses

def get_active_network() -> str:
    """Obtiene la red activa actual"""
    if not API_CONFIG:
        load_api_config()
    return API_CONFIG.get('active_network', 'local')

def get_network_info(network: Optional[str] = None) -> Dict[str, Any]:
    """Obtiene información de la red especificada"""
    if network is None:
        network = get_active_network()
    
    networks = get_networks()
    network_info = networks.get(network, {})
    
    if not network_info:
        raise ValueError(f"Red no soportada: {network}")
    
    return network_info

def load_contract_abis():
    """Carga los ABIs de los contratos desde los archivos de artifacts"""
    global CONTRACT_ABIS
    
    # Usar la ruta de artifacts desde la configuración
    artifacts_path = API_CONFIG.get('artifacts_path', '')
    if not artifacts_path:
        # Ruta por defecto
        artifacts_path = Path(__file__).parent.parent.parent.parent / "hardhat-dev" / "artifacts" / "contracts"
    
    contracts = {
        'KRMToken': 'tokens/KRMToken.sol/KRMToken.json',
        'ProfileRegistry': 'core/ProfileRegistry.sol/ProfileRegistry.json',
        'SkillSystem': 'core/SkillSystem.sol/SkillSystem.json',
        'TimeRegistry': 'core/TimeRegistry.sol/TimeRegistry.json',
        'P2PMarketplace': 'marketplace/P2PMarketplace.sol/P2PMarketplace.json',
        'IPFSRegistry': 'core/IPFSRegistry.sol/IPFSRegistry.json'
    }
    
    for contract_name, artifact_path in contracts.items():
        try:
            full_path = Path(artifacts_path) / artifact_path
            if full_path.exists():
                with open(full_path, 'r') as f:
                    artifact = json.load(f)
                    CONTRACT_ABIS[contract_name] = artifact['abi']
                print(f"✅ ABI cargado para {contract_name}")
            else:
                print(f"⚠️  Warning: ABI file not found for {contract_name} at {full_path}")
                CONTRACT_ABIS[contract_name] = []
        except Exception as e:
            print(f"❌ Error loading ABI for {contract_name}: {e}")
            CONTRACT_ABIS[contract_name] = []

def get_web3_instance(network: Optional[str] = None) -> Web3:
    """Obtiene una instancia de Web3 para la red especificada"""
    if network is None:
        network = get_active_network()
    
    network_info = get_network_info(network)
    rpc_url = network_info.get('rpc_url')
    
    if not rpc_url:
        raise ValueError(f"RPC URL no configurada para la red {network}")
    
    w3 = Web3(Web3.HTTPProvider(rpc_url))
    
    if not w3.is_connected():
        raise ConnectionError(f"No se pudo conectar a la red {network}")
    
    return w3

def get_contract_instance(contract_name: str, network: Optional[str] = None):
    """Obtiene una instancia del contrato especificado"""
    if contract_name not in CONTRACT_ABIS:
        raise ValueError(f"Contrato no encontrado: {contract_name}")
    
    if network is None:
        network = get_active_network()
    
    addresses = get_contract_addresses(network)
    address = addresses.get(contract_name)
    
    if not address:
        raise ValueError(f"Dirección no configurada para {contract_name} en {network}")
    
    w3 = get_web3_instance(network)
    abi = CONTRACT_ABIS[contract_name]
    
    # Convertir a checksum address
    checksum_address = w3.to_checksum_address(address)
    
    return w3.eth.contract(address=checksum_address, abi=abi)

def get_contract_abi(contract_name: str) -> list:
    """Obtiene el ABI de un contrato específico"""
    if contract_name not in CONTRACT_ABIS:
        raise ValueError(f"ABI no encontrado para: {contract_name}")
    return CONTRACT_ABIS[contract_name]

def get_contract_address(contract_name: str, network: Optional[str] = None) -> str:
    """Obtiene la dirección de un contrato específico"""
    addresses = get_contract_addresses(network)
    address = addresses.get(contract_name)
    
    if not address:
        raise ValueError(f"Dirección no configurada para {contract_name}")
    
    return address

def get_available_contracts() -> list:
    """Obtiene la lista de contratos disponibles"""
    return list(CONTRACT_ABIS.keys())

def get_api_status() -> Dict[str, Any]:
    """Obtiene el estado actual de la API"""
    return {
        'active_network': get_active_network(),
        'network_info': get_network_info(),
        'available_contracts': get_available_contracts(),
        'contract_addresses': get_contract_addresses(),
        'last_sync': API_CONFIG.get('last_sync', 'N/A')
    }

# Cargar configuración al importar el módulo
load_api_config()
load_contract_abis()

