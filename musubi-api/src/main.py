from flask import Flask, jsonify, request
from flask_cors import CORS
from flasgger import Swagger
import json
import os
import logging
from web3 import Web3
import requests
from datetime import datetime

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('api.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Importar routers
from routes.contracts import contracts_bp
from routes.krm import krm_bp
from routes.marketplace import marketplace_bp
from routes.profiles import profiles_bp
from routes.skills import skills_bp
from routes.timeregistry import timeregistry_bp
from routes.user import user_bp
from routes.ipfs_registry import ipfs_registry_bp

# Importar configuración
from config.contracts import get_api_status, get_contract_abi, get_available_contracts, get_contract_addresses
from config.decentralized_db import decentralized_db

app = Flask(__name__)
CORS(app)

# Middleware para logging de requests
@app.before_request
def log_request():
    """Log de cada request"""
    logger.info(f"Request: {request.method} {request.path} - {request.remote_addr}")

@app.after_request
def log_response(response):
    """Log de cada response"""
    logger.info(f"Response: {response.status_code} - {request.method} {request.path}")
    return response

def validate_network(f):
    """Decorator para validar que la red esté activa"""
    from functools import wraps
    
    @wraps(f)
    def decorated_function(*args, **kwargs):
        network = request.args.get('network', 'local')
        
        # Verificar si la red está disponible
        try:
            from config.contracts import get_web3_instance
            w3 = get_web3_instance(network)
            if not w3.is_connected():
                return jsonify({
                    'success': False,
                    'error': f'Red {network} no disponible'
                }), 503
        except Exception as e:
            logger.warning(f"Error validando red {network}: {e}")
            return jsonify({
                'success': False,
                'error': f'Error conectando a red {network}'
            }), 503
        
        return f(*args, **kwargs)
    return decorated_function

# Configurar Web3 para la base de datos descentralizada
def setup_web3():
    """Configura Web3 para la base de datos descentralizada"""
    try:
        # Intentar conectar a Hardhat local
        web3 = Web3(Web3.HTTPProvider('http://localhost:8545'))
        if web3.is_connected():
            print("✅ Conectado a Hardhat local")
            decentralized_db.web3 = web3
            return web3
        else:
            print("⚠️ No se pudo conectar a Hardhat local")
            return None
    except Exception as e:
        print(f"⚠️ Error conectando a Web3: {e}")
        return None

# Configurar aplicación
def setup_app():
    """Configura la aplicación"""
    print("🚀 Iniciando Musubi API...")
    
    # Configurar Web3
    setup_web3()
    
    print("✅ Musubi API configurada y lista")

# Configurar Swagger
swagger_config = {
    "headers": [],
    "specs": [
        {
            "endpoint": 'apispec_1',
            "route": '/apispec_1.json',
            "rule_filter": lambda rule: True,
            "model_filter": lambda tag: True,
        }
    ],
    "static_url_path": "/flasgger_static",
    "swagger_ui": True,
    "specs_route": "/docs"
}

swagger_template = {
    "swagger": "2.0",
    "info": {
        "title": "Musubi API",
        "description": "API para el ecosistema Musubi - Blockchain + IPFS",
        "version": "1.0.0",
        "contact": {
            "name": "Musubi Team",
            "email": "info@musubi.com"
        }
    },
    "host": "localhost:5003",
    "basePath": "/api",
    "schemes": ["http", "https"],
    "consumes": ["application/json"],
    "produces": ["application/json"],
    "tags": [
        {
            "name": "Contratos",
            "description": "Endpoints para interactuar con contratos inteligentes"
        },
        {
            "name": "KRM",
            "description": "Endpoints para el token KRM"
        },
        {
            "name": "Marketplace",
            "description": "Endpoints para el marketplace P2P"
        },
        {
            "name": "Perfiles",
            "description": "Endpoints para gestión de perfiles"
        },
        {
            "name": "Habilidades",
            "description": "Endpoints para gestión de habilidades"
        },
        {
            "name": "Registro de Tiempo",
            "description": "Endpoints para registro y validación de tiempo"
        },
        {
            "name": "Usuarios",
            "description": "Endpoints para gestión de usuarios con IPFS"
        },
        {
            "name": "IPFS Registry",
            "description": "Endpoints para interactuar con el registro IPFS en blockchain"
        }
    ]
}

swagger = Swagger(app, config=swagger_config, template=swagger_template)

# Registrar blueprints
app.register_blueprint(contracts_bp, url_prefix='/api')
app.register_blueprint(krm_bp, url_prefix='/api')
app.register_blueprint(marketplace_bp, url_prefix='/api')
app.register_blueprint(profiles_bp, url_prefix='/api')
app.register_blueprint(skills_bp, url_prefix='/api')
app.register_blueprint(timeregistry_bp, url_prefix='/api')
app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(ipfs_registry_bp, url_prefix='/api')

@app.route('/')
def index():
    """Página principal de la API"""
    return jsonify({
        'message': '🎯 Musubi API - Blockchain + IPFS',
        'version': '1.0.0',
        'description': 'API para el ecosistema Musubi con base de datos descentralizada',
        'endpoints': {
            'documentation': '/docs',
            'contracts': '/api/contracts',
            'users': '/api/users',
            'ipfs_registry': '/api/ipfs',
            'krm': '/api/krm',
            'marketplace': '/api/marketplace',
            'profiles': '/api/profiles',
            'skills': '/api/skills',
            'timeregistry': '/api/timeregistry'
        },
        'architecture': {
            'blockchain': 'Ethereum (Hardhat)',
            'storage': 'IPFS (Descentralizado)',
            'api': 'Flask + Swagger',
            'frontend': 'React + Web3'
        }
    })

@app.route('/health')
def health():
    """Endpoint de salud de la API"""
    web3_status = "connected" if decentralized_db.web3 and decentralized_db.web3.is_connected() else "disconnected"
    ipfs_status = "connected" if decentralized_db.http_url else "disconnected"
    
    return jsonify({
        'status': 'healthy',
        'services': {
            'blockchain': web3_status,
            'ipfs': ipfs_status,
            'api': 'running'
        }
    })

@app.route('/health/detailed')
def detailed_health():
    """Health check detallado con estado de todos los servicios"""
    try:
        # Verificar blockchain
        blockchain_status = "disconnected"
        blockchain_info = {}
        if decentralized_db.web3:
            try:
                if decentralized_db.web3.is_connected():
                    blockchain_status = "connected"
                    blockchain_info = {
                        'chain_id': decentralized_db.web3.eth.chain_id,
                        'latest_block': decentralized_db.web3.eth.block_number,
                        'gas_price': str(decentralized_db.web3.eth.gas_price)
                    }
            except Exception as e:
                blockchain_info = {'error': str(e)}
        
        # Verificar IPFS
        ipfs_status = "disconnected"
        ipfs_info = {}
        if decentralized_db.http_url:
            try:
                response = requests.get(f"{decentralized_db.http_url}/api/v0/version", timeout=5)
                if response.status_code == 200:
                    ipfs_status = "connected"
                    ipfs_info = response.json()
            except Exception as e:
                ipfs_info = {'error': str(e)}
        
        # Verificar contratos
        contracts_status = "unknown"
        contracts_info = {}
        try:
            available_contracts = get_available_contracts()
            contract_addresses = get_contract_addresses()
            contracts_status = "available" if available_contracts else "unavailable"
            contracts_info = {
                'available_contracts': available_contracts,
                'total_addresses': len(contract_addresses)
            }
        except Exception as e:
            contracts_info = {'error': str(e)}
        
        return jsonify({
            'status': 'healthy',
            'timestamp': str(datetime.now()),
            'services': {
                'blockchain': {
                    'status': blockchain_status,
                    'info': blockchain_info
                },
                'ipfs': {
                    'status': ipfs_status,
                    'info': ipfs_info
                },
                'contracts': {
                    'status': contracts_status,
                    'info': contracts_info
                },
                'api': {
                    'status': 'running',
                    'version': '1.0.0'
                }
            }
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e),
            'timestamp': str(datetime.now())
        }), 500

if __name__ == '__main__':
    setup_app()
    app.run(debug=True, host='0.0.0.0', port=5003)

