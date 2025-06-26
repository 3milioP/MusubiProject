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
                    'wallet_address': {'type': 'string', 'description': 'Dirección de wallet del usuario'},
                    'profile_type': {'type': 'string', 'description': 'Tipo de perfil (professional/company)'},
                    'skills': {'type': 'array', 'items': {'type': 'string'}, 'description': 'Lista de habilidades'},
                    'description': {'type': 'string', 'description': 'Descripción del usuario'}
                },
                'required': ['name', 'email', 'wallet_address', 'profile_type']
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
        required_fields = ['name', 'email', 'wallet_address', 'profile_type']
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
            'wallet_address': data['wallet_address'],
            'profile_type': data['profile_type'],
            'skills': data.get('skills', []),
            'description': data.get('description', ''),
            'created_at': str(datetime.now()),
            'status': 'active'
        }
        
        # Almacenar en IPFS
        ipfs_result = decentralized_db.store_data(user_data)
        
        if not ipfs_result or 'ipfs_hash' not in ipfs_result:
            return jsonify({
                'success': False,
                'error': 'Error almacenando datos en IPFS'
            }), 500
        
        ipfs_hash = ipfs_result['ipfs_hash']
        
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
        profile_type = request.args.get('profile_type')
        limit = request.args.get('limit', type=int)
        users = list(_temp_users.values())
        # Extraer solo los datos de usuario (user_data)
        users = [u['data'] for u in users if 'data' in u]
        if profile_type:
            users = [user for user in users if user.get('profile_type') == profile_type]
        if limit:
            users = users[:limit]
        response = {
            'success': True,
            'users': users,
            'total': len(users),
            'source': 'temporary_storage',
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
            'user': user['data']
        }), 200
        
    except Exception as e:
        print(f"❌ Error obteniendo usuario: {e}")
        return jsonify({
            'success': False,
            'error': f'Error interno: {str(e)}'
        }), 500

@user_bp.route('/users/wallet/<wallet_address>', methods=['GET'])
@swag_from({
    'tags': ['Usuarios'],
    'summary': 'Obtener usuario por dirección de wallet',
    'description': 'Obtiene un usuario específico por su dirección de wallet',
    'parameters': [
        {
            'name': 'wallet_address',
            'in': 'path',
            'type': 'string',
            'required': True,
            'description': 'Dirección de wallet del usuario'
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
def get_user_by_wallet(wallet_address):
    """Obtener un usuario específico por dirección de wallet"""
    try:
        # Buscar en almacenamiento temporal por dirección de wallet
        user_found = None
        for user_id, user_data in _temp_users.items():
            if user_data.get('data', {}).get('wallet_address') == wallet_address:
                user_found = user_data
                break
        
        if not user_found:
            return jsonify({
                'success': False,
                'error': 'Usuario no encontrado'
            }), 404
        
        return jsonify({
            'success': True,
            'user': user_found['data']
        }), 200
        
    except Exception as e:
        print(f"❌ Error obteniendo usuario por wallet: {e}")
        return jsonify({
            'success': False,
            'error': f'Error interno: {str(e)}'
        }), 500

@user_bp.route('/users/wallet/<wallet_address>', methods=['PUT'])
@swag_from({
    'tags': ['Usuarios'],
    'summary': 'Actualizar usuario por dirección de wallet',
    'description': 'Actualiza los datos de un usuario existente por su dirección de wallet',
    'parameters': [
        {
            'name': 'wallet_address',
            'in': 'path',
            'type': 'string',
            'required': True,
            'description': 'Dirección de wallet del usuario'
        },
        {
            'name': 'body',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                'properties': {
                    'name': {'type': 'string'},
                    'description': {'type': 'string'},
                    'skills': {'type': 'array', 'items': {'type': 'string'}},
                    'location': {'type': 'string'},
                    'website': {'type': 'string'},
                    'timestamp': {'type': 'string'}
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
def update_user_by_wallet(wallet_address):
    """Actualizar un usuario existente por dirección de wallet"""
    try:
        # Buscar usuario por dirección de wallet
        user_found = None
        user_id = None
        for uid, user_data in _temp_users.items():
            if user_data.get('data', {}).get('wallet_address') == wallet_address:
                user_found = user_data
                user_id = uid
                break
        
        if not user_found:
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
        
        # Actualizar datos del usuario
        user_data = user_found['data']
        for field in ['name', 'description', 'skills', 'location', 'website']:
            if field in data and data[field] is not None:
                user_data[field] = data[field]
        
        user_data['updated_at'] = str(datetime.now())
        
        # Almacenar versión actualizada en IPFS
        storage_result = decentralized_db.store_data(user_data)
        
        if not storage_result or 'ipfs_hash' not in storage_result:
            return jsonify({
                'success': False,
                'error': 'Error almacenando datos actualizados en IPFS'
            }), 500
        
        # Actualizar el hash en el almacenamiento temporal
        if user_id is not None:
            _temp_users[user_id]['data'] = user_data
            _temp_users[user_id]['ipfs_hash'] = storage_result['ipfs_hash']
        
        return jsonify({
            'success': True,
            'message': 'Usuario actualizado exitosamente',
            'ipfs_hash': storage_result['ipfs_hash'],
            'user_data': user_data
        }), 200
        
    except Exception as e:
        print(f"❌ Error actualizando usuario por wallet: {e}")
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
