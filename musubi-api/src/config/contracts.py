"""
Configuración de contratos inteligentes para Musubi API
"""
import os
import json
from web3 import Web3
from typing import Dict, Any

# Configuración de redes
NETWORKS = {
    'local': {
        'KRMToken': '0x9A676e781A523b5d0C0e43731313A708CB607508',
        'ProfileRegistry': '0x0B306BF915C4d645ff596e518fAf3F9669b97016',
        'SkillSystem': '0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1',
        'TimeRegistry': '0x9A9f2CCfdE556A7E9Ff0848998Aa4a0CFD8863AE',
        'P2PMarketplace': '0x68B1D87F95878fE05B998F19b66F4baba5De1aed'
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
CONTRACT_ADDRESSES = {
    'local': {
        'KRMToken': '0x9A676e781A523b5d0C0e43731313A708CB607508',
        'ProfileRegistry': '0x0B306BF915C4d645ff596e518fAf3F9669b97016',
        'SkillSystem': '0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1',
        'TimeRegistry': '0x9A9f2CCfdE556A7E9Ff0848998Aa4a0CFD8863AE',
        'P2PMarketplace': '0x68B1D87F95878fE05B998F19b66F4baba5De1aed'
    },
    'sepolia': {
        'KRMToken': '',
        'ProfileRegistry': '',
        'SkillSystem': '',
        'TimeRegistry': '',
        'P2PMarketplace': ''
    },
    'polygon_amoy': {
        'KRMToken': '',
        'ProfileRegistry': '',
        'SkillSystem': '',
        'TimeRegistry': '',
        'P2PMarketplace': ''
    },
    'polygon': {
        'KRMToken': '',
        'ProfileRegistry': '',
        'SkillSystem': '',
        'TimeRegistry': '',
        'P2PMarketplace': ''
    }
}

# ABIs de contratos (se cargarán desde archivos)
CONTRACT_ABIS = {}

def load_contract_abis():
    """Carga los ABIs de los contratos desde los archivos de artifacts"""
    global CONTRACT_ABIS
    
    artifacts_path = os.path.join(os.path.dirname(__file__), '../../hardhat-dev/artifacts/contracts')
    
    contracts = {
        'KRMToken': 'tokens/KRMToken.sol/KRMToken.json',
        'ProfileRegistry': 'core/ProfileRegistry.sol/ProfileRegistry.json',
        'SkillSystem': 'core/SkillSystem.sol/SkillSystem.json',
        'TimeRegistry': 'core/TimeRegistry.sol/TimeRegistry.json',
        'P2PMarketplace': 'marketplace/P2PMarketplace.sol/P2PMarketplace.json'
    }
    
    for contract_name, artifact_path in contracts.items():
        try:
            full_path = os.path.join(artifacts_path, artifact_path)
            if os.path.exists(full_path):
                with open(full_path, 'r') as f:
                    artifact = json.load(f)
                    CONTRACT_ABIS[contract_name] = artifact['abi']
            else:
                print(f"Warning: ABI file not found for {contract_name} at {full_path}")
                CONTRACT_ABIS[contract_name] = []
        except Exception as e:
            print(f"Error loading ABI for {contract_name}: {e}")
            CONTRACT_ABIS[contract_name] = []

def get_web3_instance(network: str = 'local') -> Web3:
    """Obtiene una instancia de Web3 para la red especificada"""
    if network not in NETWORKS:
        raise ValueError(f"Red no soportada: {network}")
    
    network_config = NETWORKS[network]
    w3 = Web3(Web3.HTTPProvider(network_config['rpc_url']))
    
    if not w3.is_connected():
        raise ConnectionError(f"No se pudo conectar a la red {network}")
    
    return w3

def get_contract_instance(contract_name: str, network: str = 'local'):
    """Obtiene una instancia del contrato especificado"""
    if contract_name not in CONTRACT_ABIS:
        raise ValueError(f"Contrato no encontrado: {contract_name}")
    
    if network not in CONTRACT_ADDRESSES:
        raise ValueError(f"Red no soportada: {network}")
    
    address = CONTRACT_ADDRESSES[network].get(contract_name)
    if not address:
        raise ValueError(f"Dirección no configurada para {contract_name} en {network}")
    
    w3 = get_web3_instance(network)
    abi = CONTRACT_ABIS[contract_name]
    
    return w3.eth.contract(address=address, abi=abi)

def get_network_info(network: str = 'local') -> Dict[str, Any]:
    """Obtiene información de la red especificada"""
    if network not in NETWORKS:
        raise ValueError(f"Red no soportada: {network}")
    
    return NETWORKS[network]

def get_contract_addresses(network: str = 'local') -> Dict[str, str]:
    """Obtiene las direcciones de contratos para la red especificada"""
    if network not in CONTRACT_ADDRESSES:
        raise ValueError(f"Red no soportada: {network}")
    
    return CONTRACT_ADDRESSES[network]

# Cargar ABIs al importar el módulo
load_contract_abis()

