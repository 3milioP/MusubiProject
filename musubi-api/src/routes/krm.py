"""
API endpoints para el token KRM
"""
from flask import Blueprint, jsonify, request
from src.config.contracts import get_contract_instance, get_web3_instance
from web3 import Web3

krm_bp = Blueprint('krm', __name__)

@krm_bp.route('/balance/<address>', methods=['GET'])
def get_balance(address):
    """Obtiene el balance de KRM de una dirección"""
    try:
        network = request.args.get('network', 'local')
        
        # Validar dirección
        if not Web3.is_address(address):
            return jsonify({
                'success': False,
                'error': 'Dirección inválida'
            }), 400
        
        contract = get_contract_instance('KRMToken', network)
        w3 = get_web3_instance(network)
        
        # Obtener balance
        balance_wei = contract.functions.balanceOf(address).call()
        balance_krm = w3.from_wei(balance_wei, 'ether')
        
        return jsonify({
            'success': True,
            'data': {
                'address': address,
                'balance_wei': str(balance_wei),
                'balance_krm': str(balance_krm),
                'network': network
            }
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@krm_bp.route('/total-supply', methods=['GET'])
def get_total_supply():
    """Obtiene el suministro total de KRM"""
    try:
        network = request.args.get('network', 'local')
        
        contract = get_contract_instance('KRMToken', network)
        w3 = get_web3_instance(network)
        
        # Obtener suministro total
        total_supply_wei = contract.functions.totalSupply().call()
        total_supply_krm = w3.from_wei(total_supply_wei, 'ether')
        
        # Obtener suministro máximo
        max_supply_wei = contract.functions.MAX_SUPPLY().call()
        max_supply_krm = w3.from_wei(max_supply_wei, 'ether')
        
        return jsonify({
            'success': True,
            'data': {
                'total_supply_wei': str(total_supply_wei),
                'total_supply_krm': str(total_supply_krm),
                'max_supply_wei': str(max_supply_wei),
                'max_supply_krm': str(max_supply_krm),
                'network': network
            }
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@krm_bp.route('/allowance', methods=['GET'])
def get_allowance():
    """Obtiene la cantidad permitida entre owner y spender"""
    try:
        network = request.args.get('network', 'local')
        owner = request.args.get('owner')
        spender = request.args.get('spender')
        
        if not owner or not spender:
            return jsonify({
                'success': False,
                'error': 'Se requieren parámetros owner y spender'
            }), 400
        
        if not Web3.is_address(owner) or not Web3.is_address(spender):
            return jsonify({
                'success': False,
                'error': 'Direcciones inválidas'
            }), 400
        
        contract = get_contract_instance('KRMToken', network)
        w3 = get_web3_instance(network)
        
        # Obtener allowance
        allowance_wei = contract.functions.allowance(owner, spender).call()
        allowance_krm = w3.from_wei(allowance_wei, 'ether')
        
        return jsonify({
            'success': True,
            'data': {
                'owner': owner,
                'spender': spender,
                'allowance_wei': str(allowance_wei),
                'allowance_krm': str(allowance_krm),
                'network': network
            }
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@krm_bp.route('/info', methods=['GET'])
def get_token_info():
    """Obtiene información general del token KRM"""
    try:
        network = request.args.get('network', 'local')
        
        contract = get_contract_instance('KRMToken', network)
        
        # Obtener información del token
        name = contract.functions.name().call()
        symbol = contract.functions.symbol().call()
        decimals = contract.functions.decimals().call()
        treasury_wallet = contract.functions.treasuryWallet().call()
        reflection_fee = contract.functions.reflectionFee().call()
        
        return jsonify({
            'success': True,
            'data': {
                'name': name,
                'symbol': symbol,
                'decimals': decimals,
                'treasury_wallet': treasury_wallet,
                'reflection_fee': reflection_fee,
                'network': network
            }
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@krm_bp.route('/transfer-events', methods=['GET'])
def get_transfer_events():
    """Obtiene eventos de transferencia recientes"""
    try:
        network = request.args.get('network', 'local')
        from_block = request.args.get('from_block', 'latest')
        to_block = request.args.get('to_block', 'latest')
        address = request.args.get('address')  # Filtrar por dirección específica
        
        contract = get_contract_instance('KRMToken', network)
        w3 = get_web3_instance(network)
        
        # Configurar filtros
        filter_params = {
            'fromBlock': from_block,
            'toBlock': to_block
        }
        
        if address:
            if not Web3.is_address(address):
                return jsonify({
                    'success': False,
                    'error': 'Dirección inválida'
                }), 400
            # Filtrar por from o to
            filter_params['argument_filters'] = {
                'from': address
            }
        
        # Obtener eventos
        transfer_filter = contract.events.Transfer.create_filter(**filter_params)
        events = transfer_filter.get_all_entries()
        
        # Formatear eventos
        formatted_events = []
        for event in events:
            formatted_events.append({
                'transaction_hash': event.transactionHash.hex(),
                'block_number': event.blockNumber,
                'from': event.args['from'],
                'to': event.args.to,
                'value_wei': str(event.args.value),
                'value_krm': str(w3.from_wei(event.args.value, 'ether'))
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

