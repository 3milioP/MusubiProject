from flask import Flask, jsonify
from flask_cors import CORS
from flasgger import Swagger
import json
import os
from web3 import Web3

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
from config.contracts import get_api_status, get_contract_abi, get_available_contracts
from config.decentralized_db import decentralized_db

app = Flask(__name__)
CORS(app)

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

if __name__ == '__main__':
    setup_app()
    app.run(debug=True, host='0.0.0.0', port=5001)

