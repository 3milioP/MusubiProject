"""
API endpoints para información general de contratos
"""
from flask import Blueprint, jsonify, request
from src.config.contracts import (
    get_web3_instance, 
    get_network_info, 
    get_contract_addresses,
    NETWORKS
)

contracts_bp = Blueprint('contracts', __name__)

@contracts_bp.route('/networks', methods=['GET'])
def get_networks():
    """Obtiene la lista de redes disponibles"""
    try:
        return jsonify({
            'success': True,
            'data': NETWORKS
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@contracts_bp.route('/network/<network>/info', methods=['GET'])
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
                    'number': latest_block.number,
                    'timestamp': latest_block.timestamp,
                    'hash': latest_block.hash.hex()
                }
            }
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@contracts_bp.route('/network/<network>/addresses', methods=['GET'])
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

