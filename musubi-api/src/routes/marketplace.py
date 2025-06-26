"""
API endpoints para el marketplace P2P
"""
from flask import Blueprint, jsonify, request
from config.contracts import get_contract_instance, get_web3_instance
from web3 import Web3

marketplace_bp = Blueprint('marketplace', __name__)

@marketplace_bp.route('/marketplace/services', methods=['GET'])
def get_services():
    """Obtiene todos los servicios disponibles en el marketplace"""
    try:
        network = request.args.get('network', 'local')
        
        contract = get_contract_instance('P2PMarketplace', network)
        w3 = get_web3_instance(network)
        
        # Obtener servicios iterando desde 1 hasta un límite razonable
        services = []
        max_services = 100  # Límite para evitar bucles infinitos
        
        for service_id in range(1, max_services + 1):
            try:
                # Intentar obtener el servicio
                service_data = contract.functions.services(service_id).call()
                
                # Si el provider es address(0), el servicio no existe
                if service_data[1] == '0x0000000000000000000000000000000000000000':
                    continue
                
                # Verificar que el servicio esté activo
                if service_data[5] == 0:  # ServiceStatus.Active
                    service = {
                        'id': service_id,
                        'provider': service_data[1],
                        'serviceDataHash': service_data[2],
                        'pricePerHour': service_data[3],
                        'skillIds': service_data[4],
                        'status': 'Active',
                        'createdAt': service_data[6],
                        'updatedAt': service_data[7]
                    }
                    services.append(service)
                    
            except Exception as e:
                # Si hay error al obtener el servicio, continuar con el siguiente
                continue
        
        return jsonify({
            'success': True,
            'data': {
                'services': services,
                'total': len(services)
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error al obtener servicios: {str(e)}'
        }), 500

@marketplace_bp.route('/marketplace/services/<int:service_id>', methods=['GET'])
def get_service(service_id):
    """Obtiene un servicio específico"""
    try:
        network = request.args.get('network', 'local')
        
        contract = get_contract_instance('P2PMarketplace', network)
        w3 = get_web3_instance(network)
        
        # Obtener datos del servicio usando la función correcta
        service_data = contract.functions.services(service_id).call()
        
        # Verificar que el servicio existe
        if service_data[1] == '0x0000000000000000000000000000000000000000':
            return jsonify({
                'success': False,
                'error': 'Servicio no encontrado'
            }), 404
        
        return jsonify({
            'success': True,
            'data': {
                'id': service_id,
                'provider': service_data[1],
                'serviceDataHash': service_data[2],
                'pricePerHour': service_data[3],
                'skillIds': service_data[4],
                'status': service_data[5],  # 0: Active, 1: Inactive, 2: Deleted
                'createdAt': service_data[6],
                'updatedAt': service_data[7],
                'network': network
            }
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error al obtener servicio: {str(e)}'
        }), 500

@marketplace_bp.route('/marketplace/services/provider/<address>', methods=['GET'])
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
        
        # Obtener servicios del proveedor usando la función correcta
        provider_services = contract.functions.providerServices(address).call()
        
        # Formatear servicios
        formatted_services = []
        for service_id in provider_services:
            try:
                service_data = contract.functions.services(service_id).call()
                
                # Verificar que el servicio existe y está activo
                if service_data[1] != '0x0000000000000000000000000000000000000000' and service_data[5] == 0:
                    formatted_services.append({
                        'id': service_id,
                        'provider': service_data[1],
                        'serviceDataHash': service_data[2],
                        'pricePerHour': service_data[3],
                        'skillIds': service_data[4],
                        'status': 'Active',
                        'createdAt': service_data[6],
                        'updatedAt': service_data[7]
                    })
            except Exception as e:
                # Si hay error al obtener el servicio, continuar
                continue
        
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
            'error': f'Error al obtener servicios del proveedor: {str(e)}'
        }), 500

@marketplace_bp.route('/marketplace/orders', methods=['GET'])
def get_all_orders():
    """Obtiene todas las órdenes"""
    try:
        network = request.args.get('network', 'local')
        
        contract = get_contract_instance('P2PMarketplace', network)
        w3 = get_web3_instance(network)
        
        # Obtener órdenes iterando desde 1 hasta un límite razonable
        orders = []
        max_orders = 100  # Límite para evitar bucles infinitos
        
        for order_id in range(1, max_orders + 1):
            try:
                # Intentar obtener la orden
                order_data = contract.functions.orders(order_id).call()
                
                # Si el client es address(0), la orden no existe
                if order_data[2] == '0x0000000000000000000000000000000000000000':
                    continue
                
                # Obtener información del servicio
                service_data = contract.functions.services(order_data[1]).call()
                
                orders.append({
                    'id': order_id,
                    'service_id': order_data[1],
                    'client': order_data[2],
                    'provider': order_data[3],
                    'totalPrice': order_data[4],
                    'numHours': order_data[5],
                    'orderDataHash': order_data[6],
                    'status': order_data[7],  # 0: Created, 1: Accepted, 2: Completed, 3: Cancelled, 4: Disputed
                    'createdAt': order_data[8],
                    'completedAt': order_data[9]
                })
            except Exception as e:
                # Si hay error al obtener la orden, continuar
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
            'error': f'Error al obtener órdenes: {str(e)}'
        }), 500

@marketplace_bp.route('/marketplace/orders/<int:order_id>', methods=['GET'])
def get_order(order_id):
    """Obtiene una orden específica"""
    try:
        network = request.args.get('network', 'local')
        
        contract = get_contract_instance('P2PMarketplace', network)
        w3 = get_web3_instance(network)
        
        # Obtener datos de la orden usando la función correcta
        order_data = contract.functions.orders(order_id).call()
        
        # Verificar que la orden existe
        if order_data[2] == '0x0000000000000000000000000000000000000000':
            return jsonify({
                'success': False,
                'error': 'Orden no encontrada'
            }), 404
        
        # Obtener información del servicio
        service_data = contract.functions.services(order_data[1]).call()
        
        return jsonify({
            'success': True,
            'data': {
                'id': order_id,
                'service_id': order_data[1],
                'client': order_data[2],
                'provider': order_data[3],
                'totalPrice': order_data[4],
                'numHours': order_data[5],
                'orderDataHash': order_data[6],
                'status': order_data[7],  # 0: Created, 1: Accepted, 2: Completed, 3: Cancelled, 4: Disputed
                'createdAt': order_data[8],
                'completedAt': order_data[9],
                'network': network
            }
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error al obtener orden: {str(e)}'
        }), 500

@marketplace_bp.route('/marketplace/orders/user/<address>', methods=['GET'])
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
        
        # Obtener órdenes del usuario iterando sobre los arrays
        all_order_ids = []
        
        # Obtener órdenes como cliente
        try:
            for i in range(100):  # Límite razonable
                try:
                    order_id = contract.functions.clientOrders(address, i).call()
                    if order_id > 0:
                        all_order_ids.append(order_id)
                except:
                    break
        except:
            pass
        
        # Obtener órdenes como proveedor
        try:
            for i in range(100):  # Límite razonable
                try:
                    order_id = contract.functions.providerOrders(address, i).call()
                    if order_id > 0:
                        all_order_ids.append(order_id)
                except:
                    break
        except:
            pass
        
        # Formatear órdenes
        formatted_orders = []
        for order_id in all_order_ids:
            try:
                order_data = contract.functions.orders(order_id).call()
                
                # Verificar que la orden existe
                if order_data[2] == '0x0000000000000000000000000000000000000000':
                    continue
                
                # Obtener información del servicio
                service_data = contract.functions.services(order_data[1]).call()
                
                formatted_orders.append({
                    'id': order_id,
                    'service_id': order_data[1],
                    'client': order_data[2],
                    'provider': order_data[3],
                    'totalPrice': order_data[4],
                    'numHours': order_data[5],
                    'orderDataHash': order_data[6],
                    'status': order_data[7],  # 0: Created, 1: Accepted, 2: Completed, 3: Cancelled, 4: Disputed
                    'createdAt': order_data[8],
                    'completedAt': order_data[9],
                    'user_role': 'client' if order_data[2].lower() == address.lower() else 'provider'
                })
            except Exception as e:
                # Si hay error al obtener la orden, continuar
                continue
        
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
            'error': f'Error al obtener órdenes del usuario: {str(e)}'
        }), 500

@marketplace_bp.route('/marketplace/stats', methods=['GET'])
def get_marketplace_stats():
    """Obtiene estadísticas generales del marketplace"""
    try:
        network = request.args.get('network', 'local')
        
        contract = get_contract_instance('P2PMarketplace', network)
        w3 = get_web3_instance(network)
        
        # Calcular estadísticas iterando sobre servicios y órdenes
        total_services = 0
        active_services = 0
        total_orders = 0
        completed_orders = 0
        total_volume = 0
        
        # Contar servicios
        max_services = 100
        for service_id in range(1, max_services + 1):
            try:
                service_data = contract.functions.services(service_id).call()
                if service_data[1] != '0x0000000000000000000000000000000000000000':
                    total_services += 1
                    if service_data[5] == 0:  # ServiceStatus.Active
                        active_services += 1
            except:
                continue
        
        # Contar órdenes
        max_orders = 100
        for order_id in range(1, max_orders + 1):
            try:
                order_data = contract.functions.orders(order_id).call()
                if order_data[2] != '0x0000000000000000000000000000000000000000':
                    total_orders += 1
                    total_volume += order_data[4]  # totalPrice
                    if order_data[7] == 2:  # OrderStatus.Completed
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
                'total_volume': total_volume,
                'completion_rate': (completed_orders / total_orders * 100) if total_orders > 0 else 0,
                'network': network
            }
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error al obtener estadísticas: {str(e)}'
        }), 500

@marketplace_bp.route('/marketplace/events/service-created', methods=['GET'])
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

