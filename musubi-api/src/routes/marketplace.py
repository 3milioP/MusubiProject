"""
API endpoints para el marketplace P2P
"""
from flask import Blueprint, jsonify, request
from config.contracts import get_contract_instance, get_web3_instance
from web3 import Web3

marketplace_bp = Blueprint('marketplace', __name__)

@marketplace_bp.route('/services', methods=['GET'])
def get_all_services():
    """Obtiene todos los servicios disponibles"""
    try:
        network = request.args.get('network', 'local')
        
        contract = get_contract_instance('P2PMarketplace', network)
        w3 = get_web3_instance(network)
        
        # Obtener número total de servicios
        total_services = contract.functions.totalServices().call()
        
        # Obtener todos los servicios
        services = []
        for service_id in range(1, total_services + 1):
            try:
                service_data = contract.functions.getService(service_id).call()
                services.append({
                    'id': service_id,
                    'provider': service_data[0],
                    'title': service_data[1],
                    'description': service_data[2],
                    'price_per_hour_wei': str(service_data[3]),
                    'price_per_hour_krm': str(w3.from_wei(service_data[3], 'ether')),
                    'category': service_data[4],
                    'is_active': service_data[5],
                    'created_at': service_data[6]
                })
            except:
                # Servicio no existe o fue eliminado
                continue
        
        return jsonify({
            'success': True,
            'data': {
                'services': services,
                'total_services': len(services),
                'network': network
            }
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@marketplace_bp.route('/services/<int:service_id>', methods=['GET'])
def get_service(service_id):
    """Obtiene un servicio específico"""
    try:
        network = request.args.get('network', 'local')
        
        contract = get_contract_instance('P2PMarketplace', network)
        w3 = get_web3_instance(network)
        
        # Obtener datos del servicio
        service_data = contract.functions.getService(service_id).call()
        
        return jsonify({
            'success': True,
            'data': {
                'id': service_id,
                'provider': service_data[0],
                'title': service_data[1],
                'description': service_data[2],
                'price_per_hour_wei': str(service_data[3]),
                'price_per_hour_krm': str(w3.from_wei(service_data[3], 'ether')),
                'category': service_data[4],
                'is_active': service_data[5],
                'created_at': service_data[6],
                'network': network
            }
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@marketplace_bp.route('/services/provider/<address>', methods=['GET'])
def get_provider_services(address):
    """Obtiene los servicios de un proveedor específico"""
    try:
        network = request.args.get('network', 'local')
        
        if not Web3.is_address(address):
            return jsonify({
                'success': False,
                'error': 'Dirección inválida'
            }), 400
        
        contract = get_contract_instance('P2PMarketplace', network)
        w3 = get_web3_instance(network)
        
        # Obtener servicios del proveedor
        provider_services = contract.functions.getProviderServices(address).call()
        
        # Formatear servicios
        formatted_services = []
        for service_id in provider_services:
            service_data = contract.functions.getService(service_id).call()
            formatted_services.append({
                'id': service_id,
                'provider': service_data[0],
                'title': service_data[1],
                'description': service_data[2],
                'price_per_hour_wei': str(service_data[3]),
                'price_per_hour_krm': str(w3.from_wei(service_data[3], 'ether')),
                'category': service_data[4],
                'is_active': service_data[5],
                'created_at': service_data[6]
            })
        
        return jsonify({
            'success': True,
            'data': {
                'provider': address,
                'services': formatted_services,
                'total_services': len(formatted_services),
                'network': network
            }
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@marketplace_bp.route('/orders', methods=['GET'])
def get_all_orders():
    """Obtiene todas las órdenes"""
    try:
        network = request.args.get('network', 'local')
        
        contract = get_contract_instance('P2PMarketplace', network)
        w3 = get_web3_instance(network)
        
        # Obtener número total de órdenes
        total_orders = contract.functions.totalOrders().call()
        
        # Obtener todas las órdenes
        orders = []
        for order_id in range(1, total_orders + 1):
            try:
                order_data = contract.functions.getOrder(order_id).call()
                
                # Obtener información del servicio
                service_data = contract.functions.getService(order_data[1]).call()
                
                orders.append({
                    'id': order_id,
                    'service_id': order_data[1],
                    'service_title': service_data[1],
                    'client': order_data[2],
                    'provider': order_data[3],
                    'total_amount_wei': str(order_data[4]),
                    'total_amount_krm': str(w3.from_wei(order_data[4], 'ether')),
                    'status': order_data[5],  # 0: Created, 1: Accepted, 2: Completed, 3: Cancelled
                    'created_at': order_data[6],
                    'completed_at': order_data[7]
                })
            except:
                # Orden no existe
                continue
        
        return jsonify({
            'success': True,
            'data': {
                'orders': orders,
                'total_orders': len(orders),
                'network': network
            }
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@marketplace_bp.route('/orders/<int:order_id>', methods=['GET'])
def get_order(order_id):
    """Obtiene una orden específica"""
    try:
        network = request.args.get('network', 'local')
        
        contract = get_contract_instance('P2PMarketplace', network)
        w3 = get_web3_instance(network)
        
        # Obtener datos de la orden
        order_data = contract.functions.getOrder(order_id).call()
        
        # Obtener información del servicio
        service_data = contract.functions.getService(order_data[1]).call()
        
        return jsonify({
            'success': True,
            'data': {
                'id': order_id,
                'service_id': order_data[1],
                'service_title': service_data[1],
                'client': order_data[2],
                'provider': order_data[3],
                'total_amount_wei': str(order_data[4]),
                'total_amount_krm': str(w3.from_wei(order_data[4], 'ether')),
                'status': order_data[5],
                'created_at': order_data[6],
                'completed_at': order_data[7],
                'network': network
            }
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@marketplace_bp.route('/orders/user/<address>', methods=['GET'])
def get_user_orders(address):
    """Obtiene las órdenes de un usuario (como cliente o proveedor)"""
    try:
        network = request.args.get('network', 'local')
        
        if not Web3.is_address(address):
            return jsonify({
                'success': False,
                'error': 'Dirección inválida'
            }), 400
        
        contract = get_contract_instance('P2PMarketplace', network)
        w3 = get_web3_instance(network)
        
        # Obtener órdenes del usuario
        user_orders = contract.functions.getUserOrders(address).call()
        
        # Formatear órdenes
        formatted_orders = []
        for order_id in user_orders:
            order_data = contract.functions.getOrder(order_id).call()
            
            # Obtener información del servicio
            service_data = contract.functions.getService(order_data[1]).call()
            
            formatted_orders.append({
                'id': order_id,
                'service_id': order_data[1],
                'service_title': service_data[1],
                'client': order_data[2],
                'provider': order_data[3],
                'total_amount_wei': str(order_data[4]),
                'total_amount_krm': str(w3.from_wei(order_data[4], 'ether')),
                'status': order_data[5],
                'created_at': order_data[6],
                'completed_at': order_data[7],
                'user_role': 'client' if order_data[2].lower() == address.lower() else 'provider'
            })
        
        return jsonify({
            'success': True,
            'data': {
                'user': address,
                'orders': formatted_orders,
                'total_orders': len(formatted_orders),
                'network': network
            }
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@marketplace_bp.route('/stats', methods=['GET'])
def get_marketplace_stats():
    """Obtiene estadísticas generales del marketplace"""
    try:
        network = request.args.get('network', 'local')
        
        contract = get_contract_instance('P2PMarketplace', network)
        w3 = get_web3_instance(network)
        
        # Obtener estadísticas básicas
        total_services = contract.functions.totalServices().call()
        total_orders = contract.functions.totalOrders().call()
        
        # Calcular estadísticas adicionales
        active_services = 0
        total_volume_wei = 0
        completed_orders = 0
        
        # Contar servicios activos
        for service_id in range(1, total_services + 1):
            try:
                service_data = contract.functions.getService(service_id).call()
                if service_data[5]:  # is_active
                    active_services += 1
            except:
                continue
        
        # Calcular volumen y órdenes completadas
        for order_id in range(1, total_orders + 1):
            try:
                order_data = contract.functions.getOrder(order_id).call()
                total_volume_wei += order_data[4]  # total_amount
                if order_data[5] == 2:  # status == Completed
                    completed_orders += 1
            except:
                continue
        
        return jsonify({
            'success': True,
            'data': {
                'total_services': total_services,
                'active_services': active_services,
                'total_orders': total_orders,
                'completed_orders': completed_orders,
                'pending_orders': total_orders - completed_orders,
                'total_volume_wei': str(total_volume_wei),
                'total_volume_krm': str(w3.from_wei(total_volume_wei, 'ether')),
                'network': network
            }
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@marketplace_bp.route('/events/service-created', methods=['GET'])
def get_service_created_events():
    """Obtiene eventos de servicios creados"""
    try:
        network = request.args.get('network', 'local')
        from_block = request.args.get('from_block', 'latest')
        to_block = request.args.get('to_block', 'latest')
        
        contract = get_contract_instance('P2PMarketplace', network)
        w3 = get_web3_instance(network)
        
        # Obtener eventos
        filter_params = {
            'fromBlock': from_block,
            'toBlock': to_block
        }
        
        service_filter = contract.events.ServiceCreated.create_filter(**filter_params)
        events = service_filter.get_all_entries()
        
        # Formatear eventos
        formatted_events = []
        for event in events:
            formatted_events.append({
                'transaction_hash': event.transactionHash.hex(),
                'block_number': event.blockNumber,
                'service_id': event.args.serviceId,
                'provider': event.args.provider,
                'title': event.args.title,
                'price_per_hour_wei': str(event.args.pricePerHour),
                'price_per_hour_krm': str(w3.from_wei(event.args.pricePerHour, 'ether')),
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

