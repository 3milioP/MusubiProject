"""
API endpoints para información general de contratos
"""
from flask import Blueprint, jsonify, request
from flasgger import swag_from
from config.contracts import (
    get_web3_instance, 
    get_network_info, 
    get_contract_addresses,
    get_networks
)

contracts_bp = Blueprint('contracts', __name__)

@contracts_bp.route('/networks', methods=['GET'])
@swag_from({
    'tags': ['Contracts'],
    'summary': 'Obtiene la lista de redes disponibles',
    'description': 'Retorna todas las redes blockchain configuradas en el sistema',
    'responses': {
        200: {
            'description': 'Lista de redes disponibles',
            'schema': {
                'type': 'object',
                'properties': {
                    'success': {'type': 'boolean'},
                    'data': {
                        'type': 'object',
                        'properties': {
                            'networks': {
                                'type': 'array',
                                'items': {
                                    'type': 'object',
                                    'properties': {
                                        'name': {'type': 'string'},
                                        'chain_id': {'type': 'integer'},
                                        'rpc_url': {'type': 'string'},
                                        'active': {'type': 'boolean'}
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        500: {
            'description': 'Error interno del servidor',
            'schema': {
                'type': 'object',
                'properties': {
                    'success': {'type': 'boolean'},
                    'error': {'type': 'string'}
                }
            }
        }
    }
})
def get_networks_endpoint():
    """Obtiene la lista de redes disponibles"""
    try:
        networks = get_networks()
        return jsonify({
            'success': True,
            'data': networks
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@contracts_bp.route('/network/<network>/info', methods=['GET'])
@swag_from({
    'tags': ['Contracts'],
    'summary': 'Obtiene información de una red específica',
    'description': 'Retorna información detallada de una red blockchain incluyendo el último bloque',
    'parameters': [
        {
            'name': 'network',
            'in': 'path',
            'required': True,
            'type': 'string',
            'description': 'Nombre de la red (local, sepolia, polygon_amoy, polygon)'
        }
    ],
    'responses': {
        200: {
            'description': 'Información de la red',
            'schema': {
                'type': 'object',
                'properties': {
                    'success': {'type': 'boolean'},
                    'data': {
                        'type': 'object',
                        'properties': {
                            'network': {'type': 'object'},
                            'connected': {'type': 'boolean'},
                            'latest_block': {
                                'type': 'object',
                                'properties': {
                                    'number': {'type': 'integer'},
                                    'timestamp': {'type': 'integer'},
                                    'hash': {'type': 'string'}
                                }
                            }
                        }
                    }
                }
            }
        },
        500: {
            'description': 'Error interno del servidor',
            'schema': {
                'type': 'object',
                'properties': {
                    'success': {'type': 'boolean'},
                    'error': {'type': 'string'}
                }
            }
        }
    }
})
def get_network_information(network):
    """Obtiene información de una red específica"""
    try:
        network_info = get_network_info(network)
        w3 = get_web3_instance(network)
        
        # Obtener información adicional de la blockchain
        latest_block = w3.eth.get_block('latest')
        
        return jsonify({
            'success': True,
            'data': {
                'network': network_info,
                'connected': w3.is_connected(),
                'latest_block': {
                    'number': latest_block.get('number', 0),
                    'timestamp': latest_block.get('timestamp', 0),
                    'hash': latest_block.get('hash', b'').hex() if latest_block.get('hash') else ''
                }
            }
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@contracts_bp.route('/network/<network>/addresses', methods=['GET'])
@swag_from({
    'tags': ['Contracts'],
    'summary': 'Obtiene las direcciones de contratos para una red',
    'description': 'Retorna todas las direcciones de contratos desplegados en la red especificada',
    'parameters': [
        {
            'name': 'network',
            'in': 'path',
            'required': True,
            'type': 'string',
            'description': 'Nombre de la red (local, sepolia, polygon_amoy, polygon)'
        }
    ],
    'responses': {
        200: {
            'description': 'Direcciones de contratos',
            'schema': {
                'type': 'object',
                'properties': {
                    'success': {'type': 'boolean'},
                    'data': {
                        'type': 'object',
                        'properties': {
                            'KRMToken': {'type': 'string', 'example': '0x5FbDB2315678afecb367f032d93F642f64180aa3'},
                            'ProfileRegistry': {'type': 'string'},
                            'SkillSystem': {'type': 'string'},
                            'TimeRegistry': {'type': 'string'},
                            'P2PMarketplace': {'type': 'string'},
                            'ProfileNFT': {'type': 'string'}
                        }
                    }
                }
            }
        },
        500: {
            'description': 'Error interno del servidor',
            'schema': {
                'type': 'object',
                'properties': {
                    'success': {'type': 'boolean'},
                    'error': {'type': 'string'}
                }
            }
        }
    }
})
def get_addresses(network):
    """Obtiene las direcciones de contratos para una red"""
    try:
        addresses = get_contract_addresses(network)
        return jsonify({
            'success': True,
            'data': addresses
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@contracts_bp.route('/network/<network>/gas-price', methods=['GET'])
@swag_from({
    'tags': ['Contracts'],
    'summary': 'Obtiene el precio actual del gas',
    'description': 'Retorna el precio actual del gas en la red especificada en Wei y Gwei',
    'parameters': [
        {
            'name': 'network',
            'in': 'path',
            'required': True,
            'type': 'string',
            'description': 'Nombre de la red (local, sepolia, polygon_amoy, polygon)'
        }
    ],
    'responses': {
        200: {
            'description': 'Precio del gas',
            'schema': {
                'type': 'object',
                'properties': {
                    'success': {'type': 'boolean'},
                    'data': {
                        'type': 'object',
                        'properties': {
                            'gas_price_wei': {'type': 'string'},
                            'gas_price_gwei': {'type': 'string'}
                        }
                    }
                }
            }
        },
        500: {
            'description': 'Error interno del servidor',
            'schema': {
                'type': 'object',
                'properties': {
                    'success': {'type': 'boolean'},
                    'error': {'type': 'string'}
                }
            }
        }
    }
})
def get_gas_price(network):
    """Obtiene el precio actual del gas"""
    try:
        w3 = get_web3_instance(network)
        gas_price = w3.eth.gas_price
        
        return jsonify({
            'success': True,
            'data': {
                'gas_price_wei': str(gas_price),
                'gas_price_gwei': str(w3.from_wei(gas_price, 'gwei'))
            }
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

