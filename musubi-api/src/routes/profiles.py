"""
API endpoints para perfiles de usuario
"""
from flask import Blueprint, jsonify, request
from config.contracts import get_contract_instance
from web3 import Web3

profiles_bp = Blueprint('profiles', __name__)

@profiles_bp.route('/<address>', methods=['GET'])
def get_profile(address):
    """Obtiene el perfil de un usuario"""
    try:
        network = request.args.get('network', 'local')
        
        if not Web3.is_address(address):
            return jsonify({
                'success': False,
                'error': 'Dirección inválida'
            }), 400
        
        contract = get_contract_instance('ProfileRegistry', network)
        
        # Verificar si el perfil existe
        has_profile = contract.functions.hasProfile(address).call()
        
        if not has_profile:
            return jsonify({
                'success': False,
                'error': 'Perfil no encontrado'
            }), 404
        
        # Obtener datos del perfil
        profile_data = contract.functions.getProfile(address).call()
        
        return jsonify({
            'success': True,
            'data': {
                'address': address,
                'name': profile_data[0],
                'email': profile_data[1],
                'bio': profile_data[2],
                'avatar_url': profile_data[3],
                'is_company': profile_data[4],
                'created_at': profile_data[5],
                'updated_at': profile_data[6],
                'network': network
            }
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@profiles_bp.route('/exists/<address>', methods=['GET'])
def check_profile_exists(address):
    """Verifica si un perfil existe"""
    try:
        network = request.args.get('network', 'local')
        
        if not Web3.is_address(address):
            return jsonify({
                'success': False,
                'error': 'Dirección inválida'
            }), 400
        
        contract = get_contract_instance('ProfileRegistry', network)
        has_profile = contract.functions.hasProfile(address).call()
        
        return jsonify({
            'success': True,
            'data': {
                'address': address,
                'exists': has_profile,
                'network': network
            }
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@profiles_bp.route('/count', methods=['GET'])
def get_profile_count():
    """Obtiene el número total de perfiles registrados"""
    try:
        network = request.args.get('network', 'local')
        
        contract = get_contract_instance('ProfileRegistry', network)
        total_profiles = contract.functions.totalProfiles().call()
        
        return jsonify({
            'success': True,
            'data': {
                'total_profiles': total_profiles,
                'network': network
            }
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@profiles_bp.route('/events/created', methods=['GET'])
def get_profile_created_events():
    """Obtiene eventos de perfiles creados"""
    try:
        network = request.args.get('network', 'local')
        from_block = request.args.get('from_block', 'latest')
        to_block = request.args.get('to_block', 'latest')
        
        contract = get_contract_instance('ProfileRegistry', network)
        
        # Obtener eventos
        filter_params = {
            'fromBlock': from_block,
            'toBlock': to_block
        }
        
        profile_filter = contract.events.ProfileCreated.create_filter(**filter_params)
        events = profile_filter.get_all_entries()
        
        # Formatear eventos
        formatted_events = []
        for event in events:
            formatted_events.append({
                'transaction_hash': event.transactionHash.hex(),
                'block_number': event.blockNumber,
                'user': event.args.user,
                'name': event.args.name,
                'is_company': event.args.isCompany,
                'timestamp': event.args.timestamp
            })
        
        return jsonify({
            'success': True,
            'data': {
                'events': formatted_events,
                'count': len(formatted_events),
                'network': network
            }
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

