"""
API endpoints para el registro de tiempo
"""
from flask import Blueprint, jsonify, request
from config.contracts import get_contract_instance, get_web3_instance
from web3 import Web3

timeregistry_bp = Blueprint('timeregistry', __name__)

@timeregistry_bp.route('/timeregistry/user/<address>', methods=['GET'])
def get_user_time_records(address):
    """Obtiene los registros de tiempo de un usuario"""
    try:
        network = request.args.get('network', 'local')
        
        if not Web3.is_address(address):
            return jsonify({
                'success': False,
                'error': 'Dirección inválida'
            }), 400
        
        contract = get_contract_instance('TimeRegistry', network)
        w3 = get_web3_instance(network)
        
        # Obtener registros del usuario
        user_records = contract.functions.getProfessionalEntries(address).call()
        
        # Formatear registros
        formatted_records = []
        for record_id in user_records:
            record_data = contract.functions.getTimeEntry(record_id).call()
            formatted_records.append({
                'id': record_id,
                'professional': record_data[0],
                'skillId': record_data[1],
                'timeDataHash': record_data[2],
                'hoursWorked': record_data[3],
                'hourlyRate': record_data[4],
                'totalAmount': record_data[5],
                'isValidated': record_data[6],
                'validatedBy': record_data[7],
                'createdAt': record_data[8],
                'validatedAt': record_data[9],
                'updatedAt': record_data[10]
            })
        
        return jsonify({
            'success': True,
            'data': {
                'address': address,
                'records': formatted_records,
                'total_records': len(formatted_records),
                'network': network
            }
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@timeregistry_bp.route('/timeregistry/<int:record_id>', methods=['GET'])
def get_time_record(record_id):
    """Obtiene un registro de tiempo específico"""
    try:
        network = request.args.get('network', 'local')
        
        contract = get_contract_instance('TimeRegistry', network)
        
        # Obtener datos del registro
        record_data = contract.functions.getTimeEntry(record_id).call()
        
        return jsonify({
            'success': True,
            'data': {
                'id': record_id,
                'professional': record_data[0],
                'skillId': record_data[1],
                'timeDataHash': record_data[2],
                'hoursWorked': record_data[3],
                'hourlyRate': record_data[4],
                'totalAmount': record_data[5],
                'isValidated': record_data[6],
                'validatedBy': record_data[7],
                'createdAt': record_data[8],
                'validatedAt': record_data[9],
                'updatedAt': record_data[10],
                'network': network
            }
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@timeregistry_bp.route('/timeregistry/company/<address>', methods=['GET'])
def get_company_time_records(address):
    """Obtiene los registros de tiempo para una empresa"""
    try:
        network = request.args.get('network', 'local')
        
        if not Web3.is_address(address):
            return jsonify({
                'success': False,
                'error': 'Dirección inválida'
            }), 400
        
        contract = get_contract_instance('TimeRegistry', network)
        
        # Obtener registros de la empresa
        company_records = contract.functions.getCompanyTimeRecords(address).call()
        
        # Formatear registros
        formatted_records = []
        for record_id in company_records:
            record_data = contract.functions.getTimeRecord(record_id).call()
            formatted_records.append({
                'id': record_id,
                'worker': record_data[0],
                'company': record_data[1],
                'description': record_data[2],
                'duration': record_data[3],
                'is_validated': record_data[4],
                'validated_by': record_data[5],
                'created_at': record_data[6],
                'validated_at': record_data[7],
                'duration_hours': round(record_data[3] / 3600, 2)
            })
        
        return jsonify({
            'success': True,
            'data': {
                'company': address,
                'records': formatted_records,
                'total_records': len(formatted_records),
                'network': network
            }
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@timeregistry_bp.route('/timeregistry/count', methods=['GET'])
def get_time_records_count():
    """Obtiene el número total de registros de tiempo"""
    try:
        network = request.args.get('network', 'local')
        
        contract = get_contract_instance('TimeRegistry', network)
        total_records = contract.functions.getTotalEntries().call()
        
        return jsonify({
            'success': True,
            'data': {
                'total_records': total_records,
                'network': network
            }
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@timeregistry_bp.route('/timeregistry/stats/<address>', methods=['GET'])
def get_user_stats(address):
    """Obtiene estadísticas de tiempo de un usuario"""
    try:
        network = request.args.get('network', 'local')
        
        if not Web3.is_address(address):
            return jsonify({
                'success': False,
                'error': 'Dirección inválida'
            }), 400
        
        contract = get_contract_instance('TimeRegistry', network)
        
        # Obtener registros del usuario
        user_records = contract.functions.getProfessionalEntries(address).call()
        
        total_hours = 0
        validated_hours = 0
        pending_hours = 0
        total_records = len(user_records)
        validated_records = 0
        
        for record_id in user_records:
            record_data = contract.functions.getTimeRecord(record_id).call()
            duration_hours = record_data[3] / 3600  # Convertir a horas
            total_hours += duration_hours
            
            if record_data[4]:  # is_validated
                validated_hours += duration_hours
                validated_records += 1
            else:
                pending_hours += duration_hours
        
        return jsonify({
            'success': True,
            'data': {
                'address': address,
                'total_records': total_records,
                'validated_records': validated_records,
                'pending_records': total_records - validated_records,
                'total_hours': round(total_hours, 2),
                'validated_hours': round(validated_hours, 2),
                'pending_hours': round(pending_hours, 2),
                'network': network
            }
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@timeregistry_bp.route('/timeregistry/events/created', methods=['GET'])
def get_time_record_created_events():
    """Obtiene eventos de registros de tiempo creados"""
    try:
        network = request.args.get('network', 'local')
        from_block = request.args.get('from_block', 'latest')
        to_block = request.args.get('to_block', 'latest')
        worker = request.args.get('worker')  # Filtrar por trabajador específico
        
        contract = get_contract_instance('TimeRegistry', network)
        
        # Configurar filtros
        filter_params = {
            'fromBlock': from_block,
            'toBlock': to_block
        }
        
        if worker:
            if not Web3.is_address(worker):
                return jsonify({
                    'success': False,
                    'error': 'Dirección de trabajador inválida'
                }), 400
            filter_params['argument_filters'] = {'worker': worker}
        
        # Obtener eventos
        time_filter = contract.events.TimeRecordCreated.create_filter(**filter_params)
        events = time_filter.get_all_entries()
        
        # Formatear eventos
        formatted_events = []
        for event in events:
            formatted_events.append({
                'transaction_hash': event.transactionHash.hex(),
                'block_number': event.blockNumber,
                'record_id': event.args.recordId,
                'worker': event.args.worker,
                'company': event.args.company,
                'duration': event.args.duration,
                'duration_hours': round(event.args.duration / 3600, 2),
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

