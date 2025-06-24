"""
Configuración para base de datos descentralizada usando IPFS
En esta implementación:
- Los datos se almacenan en IPFS
- Los hashes de los datos se almacenan en la blockchain
- Esto garantiza inmutabilidad y descentralización
"""
import json
import hashlib
import requests
from datetime import datetime
from typing import Dict, List, Optional, Any, Union
from web3 import Web3

# Importación opcional de IPFS
try:
    import ipfshttpclient
    IPFS_AVAILABLE = True
except ImportError:
    IPFS_AVAILABLE = False
    print("⚠️ ipfshttpclient no disponible. Usando API HTTP directa.")

class DecentralizedDB:
    """
    Base de datos descentralizada usando IPFS
    Los datos se almacenan en IPFS y los hashes en blockchain
    """
    
    # Clave privada de la cuenta 1 de Hardhat para firmar transacciones en local
    PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
    
    def __init__(self, ipfs_node_url: str = "/ip4/127.0.0.1/tcp/5002", web3_instance: Optional[Web3] = None):
        """
        Inicializa la conexión con IPFS
        
        Args:
            ipfs_node_url: URL del nodo IPFS (por defecto local)
            web3_instance: Instancia de Web3 para interactuar con blockchain
        """
        self.ipfs_node_url = ipfs_node_url
        self.web3 = web3_instance
        self.client = None
        self.http_url = None
        self._connect_ipfs()
    
    def _connect_ipfs(self):
        """Conecta con el nodo IPFS"""
        if not IPFS_AVAILABLE:
            print("⚠️ IPFS client no disponible, usando API HTTP directa")
            self._setup_http_connection()
            return
            
        try:
            # Intentar conexión con diferentes configuraciones
            try:
                self.client = ipfshttpclient.connect(self.ipfs_node_url)
                print(f"✅ Conectado a IPFS en {self.ipfs_node_url}")
            except Exception as e:
                print(f"⚠️ Cliente IPFS falló: {e}")
                print("📝 Intentando conexión HTTP directa...")
                self._setup_http_connection()
                    
        except Exception as e:
            print(f"⚠️ Error general conectando a IPFS: {e}")
            print("📝 Usando API HTTP directa")
            self._setup_http_connection()
    
    def _setup_http_connection(self):
        """Configura conexión HTTP directa a IPFS"""
        try:
            # Convertir URL IPFS a HTTP
            if "tcp" in self.ipfs_node_url:
                port = self.ipfs_node_url.split("tcp/")[1]
                self.http_url = f"http://127.0.0.1:{port}"
            else:
                self.http_url = "http://127.0.0.1:5002"
            
            # Verificar conexión
            response = requests.post(f"{self.http_url}/api/v0/version", timeout=5)
            if response.status_code == 200:
                print(f"✅ Conectado a IPFS via HTTP en {self.http_url}")
            else:
                print(f"⚠️ IPFS HTTP no responde: {response.status_code}")
                self.http_url = None
        except Exception as e:
            print(f"⚠️ No se pudo conectar a IPFS HTTP: {e}")
            self.http_url = None
    
    def _calculate_hash(self, data: Dict[str, Any]) -> str:
        """
        Calcula el hash SHA256 de los datos
        
        Args:
            data: Datos a hashear
            
        Returns:
            Hash SHA256 en formato hexadecimal
        """
        data_str = json.dumps(data, sort_keys=True, separators=(',', ':'))
        return hashlib.sha256(data_str.encode()).hexdigest()
    
    def store_data(self, data: Dict[str, Any], collection: str = "default") -> Dict[str, Union[str, Dict[str, Any]]]:
        """
        Almacena datos en IPFS y retorna el hash
        
        Args:
            data: Datos a almacenar
            collection: Colección a la que pertenecen los datos
            
        Returns:
            Diccionario con el hash IPFS y el hash SHA256
        """
        try:
            # Añadir metadatos
            data_with_metadata = {
                "data": data,
                "metadata": {
                    "collection": collection,
                    "timestamp": datetime.now().isoformat(),
                    "version": "1.0"
                }
            }
            
            # Calcular hash SHA256
            sha256_hash = self._calculate_hash(data_with_metadata)
            
            # Intentar almacenar en IPFS
            ipfs_hash = None
            
            if self.client:
                try:
                    # Usar cliente IPFS
                    ipfs_hash = self.client.add_json(data_with_metadata)
                    print(f"📤 Datos almacenados en IPFS (cliente): {ipfs_hash}")
                except Exception as e:
                    print(f"⚠️ Cliente IPFS falló: {e}")
                    ipfs_hash = None
            
            if not ipfs_hash and self.http_url:
                try:
                    # Usar API HTTP directa
                    response = requests.post(
                        f"{self.http_url}/api/v0/add",
                        files={'file': ('data.json', json.dumps(data_with_metadata), 'application/json')},
                        timeout=10
                    )
                    if response.status_code == 200:
                        result = response.json()
                        ipfs_hash = result.get('Hash')
                        print(f"📤 Datos almacenados en IPFS (HTTP): {ipfs_hash}")
                except Exception as e:
                    print(f"⚠️ API HTTP falló: {e}")
            
            if ipfs_hash:
                return {
                    "ipfs_hash": ipfs_hash,
                    "sha256_hash": sha256_hash,
                    "collection": collection,
                    "timestamp": data_with_metadata["metadata"]["timestamp"]
                }
            else:
                # Fallback: almacenamiento local temporal
                print("📝 Usando almacenamiento local temporal")
                return {
                    "ipfs_hash": f"local_{sha256_hash[:16]}",
                    "sha256_hash": sha256_hash,
                    "collection": collection,
                    "timestamp": data_with_metadata["metadata"]["timestamp"],
                    "local_data": data_with_metadata
                }
                
        except Exception as e:
            print(f"❌ Error almacenando datos: {e}")
            raise
    
    def retrieve_data(self, ipfs_hash: str) -> Optional[Dict[str, Any]]:
        """
        Recupera datos desde IPFS usando el hash
        
        Args:
            ipfs_hash: Hash IPFS de los datos
            
        Returns:
            Datos recuperados o None si no se encuentran
        """
        try:
            if ipfs_hash.startswith("local_"):
                # Fallback: datos locales (en una implementación real, esto sería persistente)
                print("📝 Datos locales no implementados completamente")
                return None
            
            # Intentar recuperar con cliente IPFS
            if self.client:
                try:
                    data = self.client.cat(ipfs_hash)
                    return json.loads(data.decode())
                except Exception as e:
                    print(f"⚠️ Cliente IPFS falló al recuperar: {e}")
            
            # Intentar recuperar con API HTTP
            if self.http_url:
                try:
                    response = requests.post(
                        f"{self.http_url}/api/v0/cat",
                        params={'arg': ipfs_hash},
                        timeout=10
                    )
                    if response.status_code == 200:
                        return json.loads(response.text)
                except Exception as e:
                    print(f"⚠️ API HTTP falló al recuperar: {e}")
            
            return None
                
        except Exception as e:
            print(f"❌ Error recuperando datos: {e}")
            return None
    
    def verify_data_integrity(self, data: Dict[str, Any], stored_hash: str) -> bool:
        """
        Verifica la integridad de los datos comparando con el hash almacenado
        
        Args:
            data: Datos a verificar
            stored_hash: Hash almacenado para comparar
            
        Returns:
            True si los datos son íntegros, False en caso contrario
        """
        try:
            current_hash = self._calculate_hash(data)
            return current_hash == stored_hash
        except Exception as e:
            print(f"❌ Error verificando integridad: {e}")
            return False
    
    def store_hash_in_blockchain(self, ipfs_hash: str, sha256_hash: str, contract_address: str, abi: list) -> str:
        """
        Almacena el hash en la blockchain usando el contrato IPFSRegistry
        """
        if not self.web3:
            print("⚠️ Web3 no configurado, hash no almacenado en blockchain")
            return "no_blockchain"
        try:
            # Derivar la dirección desde la clave privada
            sender_account = self.web3.eth.account.from_key(self.PRIVATE_KEY).address
            print(f"🟢 Usando cuenta para firmar: {sender_account}")
            
            # Convertir dirección a ChecksumAddress
            checksum_address = self.web3.to_checksum_address(contract_address)
            # Crear instancia del contrato
            contract = self.web3.eth.contract(address=checksum_address, abi=abi)
            # Preparar la transacción
            transaction = contract.functions.storeRecord(
                ipfs_hash,
                sha256_hash,
                "users",  # collection
                "user_data"  # dataType
            ).build_transaction({
                'from': sender_account,
                'gas': 2000000,
                'gasPrice': self.web3.eth.gas_price,
                'nonce': self.web3.eth.get_transaction_count(sender_account),
            })
            # Firmar y enviar la transacción usando la clave privada
            signed_txn = self.web3.eth.account.sign_transaction(transaction, private_key=self.PRIVATE_KEY)
            tx_hash = self.web3.eth.send_raw_transaction(signed_txn.raw_transaction)
            # Esperar a que se confirme
            tx_receipt = self.web3.eth.wait_for_transaction_receipt(tx_hash)
            print(f"🔗 Hash almacenado en blockchain:")
            print(f"   IPFS Hash: {ipfs_hash}")
            print(f"   SHA256 Hash: {sha256_hash}")
            print(f"   Contract: {contract_address}")
            print(f"   Transaction: {tx_hash.hex()}")
            print(f"   Block: {tx_receipt['blockNumber']}")
            return tx_hash.hex()
        except Exception as e:
            print(f"❌ Error almacenando hash en blockchain: {e}")
            return "error"
    
    def get_collection_data(self, collection: str) -> List[Dict[str, Any]]:
        """
        Obtiene todos los datos de una colección específica
        (En una implementación real, esto requeriría indexación)
        
        Args:
            collection: Nombre de la colección
            
        Returns:
            Lista de datos de la colección
        """
        # En una implementación real, esto requeriría un índice
        # Por ahora retornamos una lista vacía
        print(f"📋 Obteniendo datos de colección: {collection}")
        return []

# Instancia global
decentralized_db = DecentralizedDB(ipfs_node_url="/ip4/127.0.0.1/tcp/5002")

# Funciones de conveniencia
def store_user_data(user_data: Dict[str, Any]) -> Dict[str, Union[str, Dict[str, Any]]]:
    """Almacena datos de usuario en la base de datos descentralizada"""
    return decentralized_db.store_data(user_data, "users")

def store_profile_data(profile_data: Dict[str, Any]) -> Dict[str, Union[str, Dict[str, Any]]]:
    """Almacena datos de perfil en la base de datos descentralizada"""
    return decentralized_db.store_data(profile_data, "profiles")

def store_skill_data(skill_data: Dict[str, Any]) -> Dict[str, Union[str, Dict[str, Any]]]:
    """Almacena datos de habilidades en la base de datos descentralizada"""
    return decentralized_db.store_data(skill_data, "skills")

def store_marketplace_data(marketplace_data: Dict[str, Any]) -> Dict[str, Union[str, Dict[str, Any]]]:
    """Almacena datos del marketplace en la base de datos descentralizada"""
    return decentralized_db.store_data(marketplace_data, "marketplace")

def store_time_registry_data(time_data: Dict[str, Any]) -> Dict[str, Union[str, Dict[str, Any]]]:
    """Almacena datos de registro de tiempo en la base de datos descentralizada"""
    return decentralized_db.store_data(time_data, "time_registry") 