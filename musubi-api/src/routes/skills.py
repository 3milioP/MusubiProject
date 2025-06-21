"""
API endpoints para el sistema de habilidades
"""
from flask import Blueprint, jsonify, request
from src.config.contracts import get_contract_instance
from web3 import Web3

skills_bp = Blueprint('skills', __name__)

@skills_bp.route('/user/<address>', methods=['GET'])
def get_user_skills(address):
    """Obtiene las habilidades de un usuario"""
    try:
        network = request.args.get('network', 'local')
        
        if not Web3.is_address(address):
            return jsonify({
                'success': False,
                'error': 'Dirección inválida'
            }), 400
        
        contract = get_contract_instance('SkillSystem', network)
        
        # Obtener habilidades del usuario
        user_skills = contract.functions.getUserSkills(address).call()
        
        # Formatear habilidades
        formatted_skills = []
        for skill_id in user_skills:
            skill_data = contract.functions.getSkill(skill_id).call()
            formatted_skills.append({
                'id': skill_id,
                'name': skill_data[0],
                'category': skill_data[1],
                'is_validated': skill_data[2],
                'validated_by': skill_data[3],
                'validated_at': skill_data[4],
                'declared_at': skill_data[5]
            })
        
        return jsonify({
            'success': True,
            'data': {
                'address': address,
                'skills': formatted_skills,
                'total_skills': len(formatted_skills),
                'network': network
            }
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@skills_bp.route('/<int:skill_id>', methods=['GET'])
def get_skill(skill_id):
    """Obtiene información de una habilidad específica"""
    try:
        network = request.args.get('network', 'local')
        
        contract = get_contract_instance('SkillSystem', network)
        
        # Obtener datos de la habilidad
        skill_data = contract.functions.getSkill(skill_id).call()
        
        return jsonify({
            'success': True,
            'data': {
                'id': skill_id,
                'name': skill_data[0],
                'category': skill_data[1],
                'is_validated': skill_data[2],
                'validated_by': skill_data[3],
                'validated_at': skill_data[4],
                'declared_at': skill_data[5],
                'network': network
            }
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@skills_bp.route('/count', methods=['GET'])
def get_skills_count():
    """Obtiene el número total de habilidades"""
    try:
        network = request.args.get('network', 'local')
        
        contract = get_contract_instance('SkillSystem', network)
        total_skills = contract.functions.totalSkills().call()
        
        return jsonify({
            'success': True,
            'data': {
                'total_skills': total_skills,
                'network': network
            }
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@skills_bp.route('/categories', methods=['GET'])
def get_skill_categories():
    """Obtiene las categorías de habilidades disponibles"""
    try:
        network = request.args.get('network', 'local')
        
        # Categorías predefinidas (podrían venir del contrato en el futuro)
        categories = [
            'Desarrollo Web',
            'Diseño Gráfico',
            'Marketing Digital',
            'Análisis de Datos',
            'Gestión de Proyectos',
            'Consultoría',
            'Traducción',
            'Redacción',
            'Fotografía',
            'Video Edición'
        ]
        
        return jsonify({
            'success': True,
            'data': {
                'categories': categories,
                'network': network
            }
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@skills_bp.route('/events/declared', methods=['GET'])
def get_skill_declared_events():
    """Obtiene eventos de habilidades declaradas"""
    try:
        network = request.args.get('network', 'local')
        from_block = request.args.get('from_block', 'latest')
        to_block = request.args.get('to_block', 'latest')
        user = request.args.get('user')  # Filtrar por usuario específico
        
        contract = get_contract_instance('SkillSystem', network)
        
        # Configurar filtros
        filter_params = {
            'fromBlock': from_block,
            'toBlock': to_block
        }
        
        if user:
            if not Web3.is_address(user):
                return jsonify({
                    'success': False,
                    'error': 'Dirección de usuario inválida'
                }), 400
            filter_params['argument_filters'] = {'user': user}
        
        # Obtener eventos
        skill_filter = contract.events.SkillDeclared.create_filter(**filter_params)
        events = skill_filter.get_all_entries()
        
        # Formatear eventos
        formatted_events = []
        for event in events:
            formatted_events.append({
                'transaction_hash': event.transactionHash.hex(),
                'block_number': event.blockNumber,
                'user': event.args.user,
                'skill_id': event.args.skillId,
                'name': event.args.name,
                'category': event.args.category,
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

@skills_bp.route('/events/validated', methods=['GET'])
def get_skill_validated_events():
    """Obtiene eventos de habilidades validadas"""
    try:
        network = request.args.get('network', 'local')
        from_block = request.args.get('from_block', 'latest')
        to_block = request.args.get('to_block', 'latest')
        
        contract = get_contract_instance('SkillSystem', network)
        
        # Obtener eventos
        filter_params = {
            'fromBlock': from_block,
            'toBlock': to_block
        }
        
        skill_filter = contract.events.SkillValidated.create_filter(**filter_params)
        events = skill_filter.get_all_entries()
        
        # Formatear eventos
        formatted_events = []
        for event in events:
            formatted_events.append({
                'transaction_hash': event.transactionHash.hex(),
                'block_number': event.blockNumber,
                'skill_id': event.args.skillId,
                'validator': event.args.validator,
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

