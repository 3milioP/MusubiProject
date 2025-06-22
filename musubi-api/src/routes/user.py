"""
Router para gestión de usuarios con almacenamiento descentralizado
"""
from flask import Blueprint, request, jsonify
from flasgger import swag_from
from typing import Dict, Any, List
import json
from datetime import datetime
import uuid

# Importar la base de datos descentralizada
from config.decentralized_db import decentralized_db

# Importar funciones del contrato IPFSRegistry
from config.contracts import get_contract_address, get_contract_abi

# Blueprint para usuarios
user_bp = Blueprint('user', __name__)

# Almacenamiento temporal en memoria (fallback)
# En producción, esto se reemplazaría completamente por IPFS
_temp_users: Dict[str, Dict[str, Any]] = {}

@user_bp.route('/users', methods=['POST'])
@swag_from({
    'tags': ['Usuarios'],
    'summary': 'Crear un nuevo usuario',
    'description': 'Crea un nuevo usuario y almacena sus datos en IPFS, luego registra el hash en blockchain',
    'parameters': [
        {
            'name': 'body',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                'properties': {
                    'name': {'type': 'string', 'description': 'Nombre del usuario'},
                    'email': {'type': 'string', 'description': 'Email del usuario'},
                    'profile_type': {'type': 'string', 'description': 'Tipo de perfil (professional/company)'},
                    'skills': {'type': 'array', 'items': {'type': 'string'}, 'description': 'Lista de habilidades'},
                    'description': {'type': 'string', 'description': 'Descripción del usuario'}
                },
                'required': ['name', 'email', 'profile_type']
            }
        }
    ],
    'responses': {
        201: {
            'description': 'Usuario creado exitosamente',
            'schema': {
                'type': 'object',
                'properties': {
                    'success': {'type': 'boolean'},
                    'message': {'type': 'string'},
                    'user_id': {'type': 'string'},
                    'ipfs_hash': {'type': 'string'},
                    'blockchain_tx': {'type': 'string'}
                }
            }
        },
        400: {
            'description': 'Datos inválidos',
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
def create_user():
    """Crea un nuevo usuario con almacenamiento descentralizado"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Datos JSON requeridos'
            }), 400
        
        # Validaciones básicas
        required_fields = ['name', 'email', 'profile_type']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({
                    'success': False,
                    'error': f'Campo requerido: {field}'
                }), 400
        
        # Validar tipo de perfil
        if data['profile_type'] not in ['professional', 'company']:
            return jsonify({
                'success': False,
                'error': 'profile_type debe ser "professional" o "company"'
            }), 400
        
        # Generar ID único
        user_id = str(uuid.uuid4())
        
        # Crear objeto de usuario
        user_data = {
            'id': user_id,
            'name': data['name'],
            'email': data['email'],
            'profile_type': data['profile_type'],
            'skills': data.get('skills', []),
            'description': data.get('description', ''),
            'created_at': str(datetime.now()),
            'status': 'active'
        }
        
        # Almacenar en IPFS
        ipfs_hash = decentralized_db.store_data(user_data)
        
        if not ipfs_hash:
            return jsonify({
                'success': False,
                'error': 'Error almacenando datos en IPFS'
            }), 500
        
        # Obtener configuración del contrato IPFSRegistry
        contract_address = get_contract_address('IPFSRegistry')
        contract_abi = get_contract_abi('IPFSRegistry')
        
        blockchain_tx = "no_contract"
        if contract_address and contract_abi:
            # Calcular hash SHA256 de los datos
            import hashlib
            data_str = json.dumps(user_data, sort_keys=True)
            sha256_hash = hashlib.sha256(data_str.encode()).hexdigest()
            
            # Almacenar hash en blockchain
            blockchain_tx = decentralized_db.store_hash_in_blockchain(
                ipfs_hash,
                sha256_hash,
                contract_address,
                contract_abi
            )
        
        # Almacenar en memoria local como respaldo
        _temp_users[user_id] = {
            'data': user_data,
            'ipfs_hash': ipfs_hash,
            'blockchain_tx': blockchain_tx
        }
        
        return jsonify({
            'success': True,
            'message': 'Usuario creado exitosamente',
            'user_id': user_id,
            'ipfs_hash': ipfs_hash,
            'blockchain_tx': blockchain_tx,
            'user_data': user_data
        }), 201
        
    except Exception as e:
        print(f"❌ Error creando usuario: {e}")
        return jsonify({
            'success': False,
            'error': f'Error interno: {str(e)}'
        }), 500

@user_bp.route('/users', methods=['GET'])
@swag_from({
    'tags': ['Usuarios'],
    'summary': 'Obtener todos los usuarios',
    'description': 'Obtiene la lista de todos los usuarios desde la base de datos descentralizada',
    'parameters': [
        {
            'name': 'profile_type',
            'in': 'query',
            'type': 'string',
            'enum': ['professional', 'company'],
            'description': 'Filtrar por tipo de perfil'
        },
        {
            'name': 'limit',
            'in': 'query',
            'type': 'integer',
            'description': 'Número máximo de usuarios a retornar'
        }
    ],
    'responses': {
        200: {
            'description': 'Lista de usuarios',
            'schema': {
                'type': 'object',
                'properties': {
                    'success': {'type': 'boolean'},
                    'users': {
                        'type': 'array',
                        'items': {
                            'type': 'object',
                            'properties': {
                                'id': {'type': 'string'},
                                'name': {'type': 'string'},
                                'email': {'type': 'string'},
                                'wallet_address': {'type': 'string'},
                                'profile_type': {'type': 'string'},
                                'created_at': {'type': 'string'}
                            }
                        }
                    },
                    'total': {'type': 'integer'},
                    'source': {'type': 'string'}
                }
            }
        }
    }
})
def get_users():
    """Obtener todos los usuarios"""
    try:
        # Parámetros de consulta
        profile_type = request.args.get('profile_type')
        limit = request.args.get('limit', type=int)
        
        # Por ahora usamos el almacenamiento temporal
        # En producción, esto consultaría IPFS con indexación
        users = list(_temp_users.values())
        
        # Filtrar por tipo de perfil si se especifica
        if profile_type:
            users = [user for user in users if user.get('profile_type') == profile_type]
        
        # Aplicar límite si se especifica
        if limit:
            users = users[:limit]
        
        # Obtener datos desde IPFS si está disponible
        ipfs_users = []
        if decentralized_db.client:
            try:
                # En una implementación real, aquí consultaríamos un índice
                # Por ahora, intentamos recuperar algunos datos de ejemplo
                print("🔍 Consultando IPFS para usuarios...")
                # Esto es conceptual - en producción necesitarías un índice
                pass
            except Exception as e:
                print(f"⚠️ Error consultando IPFS: {e}")
        
        response = {
            'success': True,
            'users': users,
            'total': len(users),
            'source': 'temporary_storage',  # o 'ipfs' si está disponible
            'note': 'En producción, los datos se recuperarían desde IPFS con indexación'
        }
        
        return jsonify(response), 200
        
    except Exception as e:
        print(f"❌ Error obteniendo usuarios: {e}")
        return jsonify({
            'success': False,
            'error': f'Error interno: {str(e)}'
        }), 500

@user_bp.route('/users/<user_id>', methods=['GET'])
@swag_from({
    'tags': ['Usuarios'],
    'summary': 'Obtener usuario por ID',
    'description': 'Obtiene un usuario específico por su ID',
    'parameters': [
        {
            'name': 'user_id',
            'in': 'path',
            'type': 'string',
            'required': True,
            'description': 'ID del usuario'
        }
    ],
    'responses': {
        200: {
            'description': 'Usuario encontrado',
            'schema': {
                'type': 'object',
                'properties': {
                    'success': {'type': 'boolean'},
                    'user': {'type': 'object'}
                }
            }
        },
        404: {
            'description': 'Usuario no encontrado',
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
def get_user(user_id):
    """Obtener un usuario específico por ID"""
    try:
        # Buscar en almacenamiento temporal
        user = _temp_users.get(user_id)
        
        if not user:
            return jsonify({
                'success': False,
                'error': 'Usuario no encontrado'
            }), 404
        
        return jsonify({
            'success': True,
            'user': user
        }), 200
        
    except Exception as e:
        print(f"❌ Error obteniendo usuario: {e}")
        return jsonify({
            'success': False,
            'error': f'Error interno: {str(e)}'
        }), 500

@user_bp.route('/users/<user_id>', methods=['PUT'])
@swag_from({
    'tags': ['Usuarios'],
    'summary': 'Actualizar usuario',
    'description': 'Actualiza los datos de un usuario existente',
    'parameters': [
        {
            'name': 'user_id',
            'in': 'path',
            'type': 'string',
            'required': True,
            'description': 'ID del usuario'
        },
        {
            'name': 'body',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                'properties': {
                    'name': {'type': 'string'},
                    'email': {'type': 'string'},
                    'bio': {'type': 'string'},
                    'skills': {'type': 'array', 'items': {'type': 'string'}},
                    'metadata': {'type': 'object'}
                }
            }
        }
    ],
    'responses': {
        200: {
            'description': 'Usuario actualizado exitosamente',
            'schema': {
                'type': 'object',
                'properties': {
                    'success': {'type': 'boolean'},
                    'message': {'type': 'string'},
                    'ipfs_hash': {'type': 'string'}
                }
            }
        },
        404: {
            'description': 'Usuario no encontrado'
        }
    }
})
def update_user(user_id):
    """Actualizar un usuario existente"""
    try:
        # Verificar que el usuario existe
        if user_id not in _temp_users:
            return jsonify({
                'success': False,
                'error': 'Usuario no encontrado'
            }), 404
        
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'Datos JSON requeridos'
            }), 400
        
        # Actualizar datos
        user = _temp_users[user_id]
        for field in ['name', 'email', 'bio', 'skills', 'metadata']:
            if field in data:
                user[field] = data[field]
        
        user['updated_at'] = datetime.now().isoformat()
        
        # Almacenar versión actualizada en IPFS
        storage_result = decentralized_db.store_data(user)
        
        return jsonify({
            'success': True,
            'message': 'Usuario actualizado exitosamente',
            'ipfs_hash': storage_result.get('ipfs_hash', 'N/A'),
            'sha256_hash': storage_result.get('sha256_hash', 'N/A')
        }), 200
        
    except Exception as e:
        print(f"❌ Error actualizando usuario: {e}")
        return jsonify({
            'success': False,
            'error': f'Error interno: {str(e)}'
        }), 500

@user_bp.route('/users/<user_id>', methods=['DELETE'])
@swag_from({
    'tags': ['Usuarios'],
    'summary': 'Eliminar usuario',
    'description': 'Elimina un usuario (marca como inactivo)',
    'parameters': [
        {
            'name': 'user_id',
            'in': 'path',
            'type': 'string',
            'required': True,
            'description': 'ID del usuario'
        }
    ],
    'responses': {
        200: {
            'description': 'Usuario eliminado exitosamente',
            'schema': {
                'type': 'object',
                'properties': {
                    'success': {'type': 'boolean'},
                    'message': {'type': 'string'}
                }
            }
        },
        404: {
            'description': 'Usuario no encontrado'
        }
    }
})
def delete_user(user_id):
    """Eliminar un usuario (marcar como inactivo)"""
    try:
        if user_id not in _temp_users:
            return jsonify({
                'success': False,
                'error': 'Usuario no encontrado'
            }), 404
        
        # Marcar como inactivo en lugar de eliminar
        _temp_users[user_id]['status'] = 'inactive'
        _temp_users[user_id]['updated_at'] = datetime.now().isoformat()
        
        return jsonify({
            'success': True,
            'message': 'Usuario marcado como inactivo'
        }), 200
        
    except Exception as e:
        print(f"❌ Error eliminando usuario: {e}")
        return jsonify({
            'success': False,
            'error': f'Error interno: {str(e)}'
        }), 500

@user_bp.route('/users/stats', methods=['GET'])
@swag_from({
    'tags': ['Usuarios'],
    'summary': 'Estadísticas de usuarios',
    'description': 'Obtiene estadísticas generales de usuarios',
    'responses': {
        200: {
            'description': 'Estadísticas de usuarios',
            'schema': {
                'type': 'object',
                'properties': {
                    'success': {'type': 'boolean'},
                    'stats': {
                        'type': 'object',
                        'properties': {
                            'total_users': {'type': 'integer'},
                            'professionals': {'type': 'integer'},
                            'companies': {'type': 'integer'},
                            'active_users': {'type': 'integer'},
                            'storage_type': {'type': 'string'}
                        }
                    }
                }
            }
        }
    }
})
def get_user_stats():
    """Obtener estadísticas de usuarios"""
    try:
        users = list(_temp_users.values())
        
        stats = {
            'total_users': len(users),
            'professionals': len([u for u in users if u.get('profile_type') == 'professional']),
            'companies': len([u for u in users if u.get('profile_type') == 'company']),
            'active_users': len([u for u in users if u.get('status') == 'active']),
            'storage_type': 'decentralized_ipfs' if decentralized_db.client else 'temporary_local'
        }
        
        return jsonify({
            'success': True,
            'stats': stats
        }), 200
        
    except Exception as e:
        print(f"❌ Error obteniendo estadísticas: {e}")
        return jsonify({
            'success': False,
            'error': f'Error interno: {str(e)}'
        }), 500
