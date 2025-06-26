"""
API endpoints para el sistema de habilidades
"""
from flask import Blueprint, jsonify, request
from config.contracts import get_contract_instance, get_contract_address, get_contract_abi
from config.decentralized_db import decentralized_db
from web3 import Web3
import json
from datetime import datetime

skills_bp = Blueprint('skills', __name__)

@skills_bp.route('/skills/user/<address>', methods=['GET'])
def get_user_skills(address):
    """Obtiene las habilidades de un usuario con nombre y categoría reales desde IPFS"""
    try:
        network = request.args.get('network', 'local')
        
        if not Web3.is_address(address):
            return jsonify({
                'success': False,
                'error': 'Dirección inválida'
            }), 400
        
        # Convertir a checksum address
        checksum_address = Web3.to_checksum_address(address)
        
        contract = get_contract_instance('SkillSystem', network)
        
        # Obtener habilidades del usuario usando el método correcto
        skill_ids = contract.functions.getProfessionalSkills(checksum_address).call()
        
        # Formatear habilidades
        formatted_skills = []
        for skill_id in skill_ids:
            try:
                # Obtener datos de la habilidad
                skill_data = contract.functions.getSkill(skill_id).call()
                skill_hash = skill_data[1]
                # Obtener datos de la declaración
                declared_skill = contract.functions.getDeclaredSkill(checksum_address, skill_id).call()
                # Leer datos reales desde IPFS
                ipfs_data = None
                try:
                    ipfs_data = decentralized_db.retrieve_data(skill_hash)
                except Exception as e:
                    print(f"Error leyendo IPFS para skill {skill_id}: {e}")
                name = ipfs_data.get('data', {}).get('name') if ipfs_data else f'Skill {skill_id}'
                category = ipfs_data.get('data', {}).get('category') if ipfs_data else 'General'
                formatted_skills.append({
                    'id': skill_id,
                    'name': name,
                    'category': category,
                    'level': declared_skill[3],  # level
                    'is_validated': declared_skill[4],  # isValidated
                    'validated_by': declared_skill[5],  # validatedBy
                    'validated_at': declared_skill[6],  # validatedAt
                    'declared_at': declared_skill[7],  # declaredAt
                    'declaration_hash': declared_skill[2],  # declarationDataHash
                    'skill_hash': skill_hash
                })
            except Exception as e:
                print(f"Error procesando skill {skill_id}: {e}")
                continue
        
        return jsonify({
            'success': True,
            'data': {
                'address': checksum_address,
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

@skills_bp.route('/skills/<int:skill_id>', methods=['GET'])
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

@skills_bp.route('/skills/count', methods=['GET'])
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

@skills_bp.route('/skills/categories', methods=['GET'])
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

@skills_bp.route('/skills/events/declared', methods=['GET'])
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
        
        # Obtener eventos (sin filtro por usuario por ahora)
        skill_filter = contract.events.SkillDeclared.create_filter(**filter_params)
        events = skill_filter.get_all_entries()
        
        # Filtrar por usuario si se especifica
        if user:
            if not Web3.is_address(user):
                return jsonify({
                    'success': False,
                    'error': 'Dirección de usuario inválida'
                }), 400
            events = [event for event in events if event.args.professional.lower() == user.lower()]
        
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

@skills_bp.route('/skills/events/validated', methods=['GET'])
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

@skills_bp.route('/skills/create', methods=['POST'])
def create_skill():
    """Crea una nueva habilidad subiendo datos a IPFS (sin transacción automática)"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Datos JSON requeridos'
            }), 400
        
        # Validaciones
        required_fields = ['name', 'category']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({
                    'success': False,
                    'error': f'Campo requerido: {field}'
                }), 400
        
        # Crear objeto de datos de la habilidad
        skill_data = {
            'name': data['name'],
            'category': data['category'],
            'description': data.get('description', ''),
            'created_at': str(datetime.now()),
            'type': 'skill'
        }
        
        # 1. Subir datos a IPFS
        ipfs_result = decentralized_db.store_data(skill_data)
        
        if not ipfs_result or 'ipfs_hash' not in ipfs_result:
            return jsonify({
                'success': False,
                'error': 'Error almacenando datos en IPFS'
            }), 500
        
        ipfs_hash = ipfs_result['ipfs_hash']
        
        # 2. Registrar hash en IPFSRegistry (sin transacción automática)
        contract_address = get_contract_address('IPFSRegistry')
        contract_abi = get_contract_abi('IPFSRegistry')
        
        if contract_address and contract_abi:
            # Calcular hash SHA256 de los datos
            import hashlib
            data_str = json.dumps(skill_data, sort_keys=True)
            sha256_hash = hashlib.sha256(data_str.encode()).hexdigest()
            
            # Solo registrar en IPFSRegistry, no en SkillSystem
            blockchain_tx = decentralized_db.store_hash_in_blockchain(
                ipfs_hash,
                sha256_hash,
                contract_address,
                contract_abi
            )
            
            return jsonify({
                'success': True,
                'message': 'Datos almacenados en IPFS y IPFSRegistry',
                'ipfs_hash': ipfs_hash,
                'blockchain_tx': blockchain_tx,
                'skill_data': skill_data,
                'note': 'Para completar la creación, use el hash en el contrato SkillSystem'
            }), 201
        
        return jsonify({
            'success': True,
            'message': 'Datos almacenados en IPFS',
            'ipfs_hash': ipfs_hash,
            'skill_data': skill_data,
            'note': 'Para completar la creación, registre el hash en IPFSRegistry y SkillSystem'
        }), 201
        
    except Exception as e:
        print(f"❌ Error creando habilidad: {e}")
        return jsonify({
            'success': False,
            'error': f'Error interno: {str(e)}'
        }), 500

@skills_bp.route('/skills/declare', methods=['POST'])
def declare_skill():
    """Declara una habilidad subiendo datos a IPFS y registrando en blockchain"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Datos JSON requeridos'
            }), 400
        
        # Validaciones
        required_fields = ['skillId', 'level', 'professional']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Campo requerido: {field}'
                }), 400
        
        skill_id = data['skillId']
        level = data['level']
        professional = data['professional']
        
        # Validar dirección
        if not Web3.is_address(professional):
            return jsonify({
                'success': False,
                'error': 'Dirección de profesional inválida'
            }), 400
        
        # Validar nivel
        if not isinstance(level, int) or level < 1 or level > 10:
            return jsonify({
                'success': False,
                'error': 'Nivel debe ser un número entre 1 y 10'
            }), 400
        
        # Crear objeto de datos de la declaración
        declaration_data = {
            'skillId': skill_id,
            'professional': professional,
            'level': level,
            'description': data.get('description', ''),
            'experience': data.get('experience', ''),
            'projects': data.get('projects', []),
            'certifications': data.get('certifications', []),
            'declared_at': str(datetime.now()),
            'type': 'skill_declaration'
        }
        
        # 1. Subir datos de declaración a IPFS
        ipfs_result = decentralized_db.store_data(declaration_data)
        
        if not ipfs_result or 'ipfs_hash' not in ipfs_result:
            return jsonify({
                'success': False,
                'error': 'Error almacenando datos de declaración en IPFS'
            }), 500
        
        declaration_hash = ipfs_result['ipfs_hash']
        
        # 2. Registrar hash en IPFSRegistry
        contract_address = get_contract_address('IPFSRegistry')
        contract_abi = get_contract_abi('IPFSRegistry')
        
        blockchain_tx = "no_contract"
        if contract_address and contract_abi:
            # Calcular hash SHA256 de los datos
            import hashlib
            data_str = json.dumps(declaration_data, sort_keys=True)
            sha256_hash = hashlib.sha256(data_str.encode()).hexdigest()
            
            # Almacenar hash en blockchain
            blockchain_tx = decentralized_db.store_hash_in_blockchain(
                declaration_hash,
                sha256_hash,
                contract_address,
                contract_abi
            )
        
        # 3. Declarar habilidad en SkillSystem
        skill_system_address = get_contract_address('SkillSystem')
        skill_system_abi = get_contract_abi('SkillSystem')
        
        if skill_system_address and skill_system_abi:
            web3 = decentralized_db.web3
            if web3:
                # Obtener la cuenta que va a declarar la habilidad
                accounts = web3.eth.accounts
                if accounts:
                    account = accounts[0]  # Usar la primera cuenta disponible
                    
                    # Crear instancia del contrato
                    contract = web3.eth.contract(
                        address=web3.to_checksum_address(skill_system_address),
                        abi=skill_system_abi
                    )
                    
                    # Declarar la habilidad
                    tx = contract.functions.declareSkill(
                        skill_id,
                        declaration_hash,
                        level
                    ).build_transaction({
                        'from': account,
                        'gas': 500000,
                        'gasPrice': web3.eth.gas_price,
                        'nonce': web3.eth.get_transaction_count(account)
                    })
                    
                    # Firmar y enviar la transacción
                    signed_tx = web3.eth.account.sign_transaction(tx, decentralized_db.PRIVATE_KEY)
                    tx_hash = web3.eth.send_raw_transaction(signed_tx.raw_transaction)
                    
                    return jsonify({
                        'success': True,
                        'message': 'Habilidad declarada exitosamente',
                        'declaration_hash': declaration_hash,
                        'blockchain_tx': tx_hash.hex(),
                        'declaration_data': declaration_data
                    }), 201
        
        return jsonify({
            'success': True,
            'message': 'Datos almacenados en IPFS, pero no se pudo declarar en blockchain',
            'declaration_hash': declaration_hash,
            'blockchain_tx': blockchain_tx,
            'declaration_data': declaration_data
        }), 201
        
    except Exception as e:
        print(f"❌ Error declarando habilidad: {e}")
        return jsonify({
            'success': False,
            'error': f'Error interno: {str(e)}'
        }), 500

@skills_bp.route('/skills/all', methods=['GET'])
def get_all_skills():
    """Obtiene todas las habilidades desde el contrato SkillSystem"""
    try:
        network = request.args.get('network', 'local')
        
        contract = get_contract_instance('SkillSystem', network)
        
        # Obtener el total de skills
        total_skills = contract.functions.totalSkills().call()
        
        skills = []
        for i in range(total_skills):
            try:
                skill = contract.functions.getSkill(i).call()
                skills.append({
                    'id': i,
                    'skillDataHash': skill[1],  # skillDataHash
                    'creator': skill[2],        # creator
                    'isActive': skill[3],       # isActive
                    'totalDeclarations': skill[4], # totalDeclarations
                    'totalValidations': skill[5],  # totalValidations
                    'createdAt': skill[6],      # createdAt
                    'updatedAt': skill[7]       # updatedAt
                })
            except Exception as e:
                print(f"Error obteniendo skill {i}: {e}")
                continue
        
        return jsonify({
            'success': True,
            'data': {
                'skills': skills,
                'total_skills': total_skills,
                'network': network
            }
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

