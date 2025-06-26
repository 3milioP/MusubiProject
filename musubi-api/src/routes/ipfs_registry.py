"""
Router para interactuar con el contrato IPFSRegistry
Permite almacenar y consultar hashes de IPFS en la blockchain
"""
from flask import Blueprint, request, jsonify
from flasgger import swag_from
from typing import Dict, Any
import json
from web3 import Web3
from config.contracts import get_contract_abi, get_contract_address
from config.decentralized_db import decentralized_db

# Blueprint para IPFS Registry
ipfs_registry_bp = Blueprint('ipfs_registry', __name__)

@ipfs_registry_bp.route('/ipfs/store', methods=['POST'])
@swag_from({
    'tags': ['IPFS Registry'],
    'summary': 'Almacenar hash de IPFS en blockchain',
    'description': 'Almacena un hash de IPFS en el contrato IPFSRegistry de la blockchain',
    'parameters': [
        {
            'name': 'body',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                'properties': {
                    'ipfs_hash': {'type': 'string', 'description': 'Hash de IPFS'},
                    'sha256_hash': {'type': 'string', 'description': 'Hash SHA256'},
                    'collection': {'type': 'string', 'description': 'Colección'},
                    'data_type': {'type': 'string', 'description': 'Tipo de datos'}
                },
                'required': ['ipfs_hash', 'sha256_hash', 'collection', 'data_type']
            }
        }
    ],
    'responses': {
        200: {
            'description': 'Hash almacenado exitosamente',
            'schema': {
                'type': 'object',
                'properties': {
                    'success': {'type': 'boolean'},
                    'message': {'type': 'string'},
                    'transaction_hash': {'type': 'string'},
                    'record_id': {'type': 'integer'}
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
def store_ipfs_hash():
    """Almacena un hash de IPFS en la blockchain"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Datos JSON requeridos'
            }), 400
        
        # Validaciones
        required_fields = ['ipfs_hash', 'sha256_hash', 'collection', 'data_type']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({
                    'success': False,
                    'error': f'Campo requerido: {field}'
                }), 400
        
        # Obtener configuración del contrato
        contract_address = get_contract_address('IPFSRegistry')
        contract_abi = get_contract_abi('IPFSRegistry')
        
        if not contract_address or not contract_abi:
            return jsonify({
                'success': False,
                'error': 'Contrato IPFSRegistry no configurado'
            }), 500
        
        # Almacenar en blockchain
        tx_hash = decentralized_db.store_hash_in_blockchain(
            data['ipfs_hash'],
            data['sha256_hash'],
            contract_address,
            contract_abi
        )
        
        if tx_hash in ['no_blockchain', 'no_accounts', 'error']:
            return jsonify({
                'success': False,
                'error': f'Error almacenando en blockchain: {tx_hash}'
            }), 500
        
        return jsonify({
            'success': True,
            'message': 'Hash almacenado exitosamente en blockchain',
            'transaction_hash': tx_hash,
            'ipfs_hash': data['ipfs_hash'],
            'sha256_hash': data['sha256_hash'],
            'collection': data['collection'],
            'data_type': data['data_type']
        }), 200
        
    except Exception as e:
        print(f"❌ Error almacenando hash IPFS: {e}")
        return jsonify({
            'success': False,
            'error': f'Error interno: {str(e)}'
        }), 500

@ipfs_registry_bp.route('/ipfs/verify/<ipfs_hash>', methods=['GET'])
@swag_from({
    'tags': ['IPFS Registry'],
    'summary': 'Verificar hash de IPFS en blockchain',
    'description': 'Verifica si un hash de IPFS existe en la blockchain',
    'parameters': [
        {
            'name': 'ipfs_hash',
            'in': 'path',
            'type': 'string',
            'required': True,
            'description': 'Hash de IPFS a verificar'
        }
    ],
    'responses': {
        200: {
            'description': 'Hash verificado',
            'schema': {
                'type': 'object',
                'properties': {
                    'success': {'type': 'boolean'},
                    'exists': {'type': 'boolean'},
                    'record': {'type': 'object'}
                }
            }
        }
    }
})
def verify_ipfs_hash(ipfs_hash):
    """Verifica si un hash de IPFS existe en la blockchain"""
    try:
        # Obtener configuración del contrato
        contract_address = get_contract_address('IPFSRegistry')
        contract_abi = get_contract_abi('IPFSRegistry')
        
        if not contract_address or not contract_abi:
            return jsonify({
                'success': False,
                'error': 'Contrato IPFSRegistry no configurado'
            }), 500
        
        # Verificar en blockchain
        web3 = decentralized_db.web3
        if not web3:
            return jsonify({
                'success': False,
                'error': 'Web3 no configurado'
            }), 500
        
        checksum_address = web3.to_checksum_address(contract_address)
        contract = web3.eth.contract(address=checksum_address, abi=contract_abi)
        
        # Verificar si existe
        exists = contract.functions.hashExists(ipfs_hash).call()
        
        if exists:
            # Obtener el registro completo
            record = contract.functions.getRecordByHash(ipfs_hash).call()
            
            return jsonify({
                'success': True,
                'exists': True,
                'record': {
                    'ipfs_hash': record[0],
                    'sha256_hash': record[1],
                    'collection': record[2],
                    'data_type': record[3],
                    'owner': record[4],
                    'timestamp': record[5],
                    'active': record[6]
                }
            }), 200
        else:
            return jsonify({
                'success': True,
                'exists': False,
                'record': None
            }), 200
        
    except Exception as e:
        print(f"❌ Error verificando hash IPFS: {e}")
        return jsonify({
            'success': False,
            'error': f'Error interno: {str(e)}'
        }), 500

@ipfs_registry_bp.route('/ipfs/collection/<collection>', methods=['GET'])
@swag_from({
    'tags': ['IPFS Registry'],
    'summary': 'Obtener registros por colección',
    'description': 'Obtiene todos los registros de IPFS de una colección específica',
    'parameters': [
        {
            'name': 'collection',
            'in': 'path',
            'type': 'string',
            'required': True,
            'description': 'Nombre de la colección'
        }
    ],
    'responses': {
        200: {
            'description': 'Registros de la colección',
            'schema': {
                'type': 'object',
                'properties': {
                    'success': {'type': 'boolean'},
                    'collection': {'type': 'string'},
                    'records': {'type': 'array'}
                }
            }
        }
    }
})
def get_collection_records(collection):
    """Obtiene todos los registros de una colección"""
    try:
        # Obtener configuración del contrato
        contract_address = get_contract_address('IPFSRegistry')
        contract_abi = get_contract_abi('IPFSRegistry')
        
        if not contract_address or not contract_abi:
            return jsonify({
                'success': False,
                'error': 'Contrato IPFSRegistry no configurado'
            }), 500
        
        # Consultar en blockchain
        web3 = decentralized_db.web3
        if not web3:
            return jsonify({
                'success': False,
                'error': 'Web3 no configurado'
            }), 500
        
        checksum_address = web3.to_checksum_address(contract_address)
        contract = web3.eth.contract(address=checksum_address, abi=contract_abi)
        
        # Obtener IDs de registros de la colección
        record_ids = contract.functions.getRecordsByCollection(collection).call()
        
        # Obtener registros completos
        records = []
        for record_id in record_ids:
            try:
                record = contract.functions.getRecord(record_id).call()
                records.append({
                    'record_id': record_id,
                    'ipfs_hash': record[0],
                    'sha256_hash': record[1],
                    'collection': record[2],
                    'data_type': record[3],
                    'owner': record[4],
                    'timestamp': record[5],
                    'active': record[6]
                })
            except Exception as e:
                print(f"⚠️ Error obteniendo registro {record_id}: {e}")
                continue
        
        return jsonify({
            'success': True,
            'collection': collection,
            'total_records': len(records),
            'records': records
        }), 200
        
    except Exception as e:
        print(f"❌ Error obteniendo registros de colección: {e}")
        return jsonify({
            'success': False,
            'error': f'Error interno: {str(e)}'
        }), 500

@ipfs_registry_bp.route('/ipfs/stats', methods=['GET'])
@swag_from({
    'tags': ['IPFS Registry'],
    'summary': 'Estadísticas del registro IPFS',
    'description': 'Obtiene estadísticas generales del contrato IPFSRegistry',
    'responses': {
        200: {
            'description': 'Estadísticas del registro',
            'schema': {
                'type': 'object',
                'properties': {
                    'success': {'type': 'boolean'},
                    'total_records': {'type': 'integer'},
                    'contract_address': {'type': 'string'}
                }
            }
        }
    }
})
def get_ipfs_stats():
    """Obtiene estadísticas del contrato IPFSRegistry"""
    try:
        # Obtener configuración del contrato
        contract_address = get_contract_address('IPFSRegistry')
        contract_abi = get_contract_abi('IPFSRegistry')
        
        if not contract_address or not contract_abi:
            return jsonify({
                'success': False,
                'error': 'Contrato IPFSRegistry no configurado'
            }), 500
        
        # Consultar en blockchain
        web3 = decentralized_db.web3
        if not web3:
            return jsonify({
                'success': False,
                'error': 'Web3 no configurado'
            }), 500
        
        checksum_address = web3.to_checksum_address(contract_address)
        contract = web3.eth.contract(address=checksum_address, abi=contract_abi)
        
        # Obtener total de registros
        total_records = contract.functions.getTotalRecords().call()
        
        return jsonify({
            'success': True,
            'total_records': total_records,
            'contract_address': contract_address,
            'network': 'local' if web3.eth.chain_id == 31337 else 'mainnet'
        }), 200
        
    except Exception as e:
        print(f"❌ Error obteniendo estadísticas IPFS: {e}")
        return jsonify({
            'success': False,
            'error': f'Error interno: {str(e)}'
        }), 500

@ipfs_registry_bp.route('/ipfs/<ipfs_hash>', methods=['GET'])
@swag_from({
    'tags': ['IPFS Registry'],
    'summary': 'Obtener contenido de IPFS',
    'description': 'Obtiene el contenido de un hash de IPFS',
    'parameters': [
        {
            'name': 'ipfs_hash',
            'in': 'path',
            'type': 'string',
            'required': True,
            'description': 'Hash de IPFS'
        }
    ],
    'responses': {
        200: {
            'description': 'Contenido de IPFS',
            'schema': {
                'type': 'object',
                'properties': {
                    'success': {'type': 'boolean'},
                    'data': {'type': 'object'},
                    'ipfs_hash': {'type': 'string'}
                }
            }
        },
        404: {
            'description': 'Contenido no encontrado',
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
def get_ipfs_content(ipfs_hash):
    """Obtiene el contenido de un hash de IPFS"""
    try:
        import requests
        
        # Intentar obtener desde IPFS público
        ipfs_url = f"https://ipfs.io/ipfs/{ipfs_hash}"
        response = requests.get(ipfs_url, timeout=10)
        
        if response.status_code == 200:
            try:
                data = response.json()
                return jsonify({
                    'success': True,
                    'data': data,
                    'ipfs_hash': ipfs_hash
                }), 200
            except json.JSONDecodeError:
                # Si no es JSON, devolver como texto
                return jsonify({
                    'success': True,
                    'data': response.text,
                    'ipfs_hash': ipfs_hash,
                    'content_type': 'text'
                }), 200
        else:
            return jsonify({
                'success': False,
                'error': f'No se pudo obtener contenido de IPFS: {response.status_code}'
            }), 404
            
    except Exception as e:
        print(f"❌ Error obteniendo contenido de IPFS: {e}")
        return jsonify({
            'success': False,
            'error': f'Error interno: {str(e)}'
        }), 500 