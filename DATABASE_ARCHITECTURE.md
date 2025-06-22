# 🗄️ Arquitectura de Base de Datos Descentralizada - Musubi

## 📋 Resumen

Musubi utiliza una **arquitectura de base de datos descentralizada** que combina **IPFS** para almacenamiento de datos y **blockchain** para almacenamiento de hashes, garantizando inmutabilidad, transparencia y descentralización total.

## 🏗️ Arquitectura General

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Musubi    │    │   IPFS Node     │
│   (React)       │◄──►│   (Flask)       │◄──►│   (Local/Cloud) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Blockchain    │
                       │   (Ethereum)    │
                       │   (Hashes)      │
                       └─────────────────┘
```

## 🔄 Flujo de Datos

### 1. **Almacenamiento de Datos**
```
Usuario → API → IPFS → Hash IPFS → Blockchain
```

1. **Usuario envía datos** a través del frontend
2. **API procesa** y valida los datos
3. **IPFS almacena** los datos y retorna un hash único
4. **Blockchain guarda** el hash IPFS para verificación
5. **Usuario recibe** confirmación con hashes

### 2. **Recuperación de Datos**
```
Usuario → API → Blockchain → Hash → IPFS → Datos
```

1. **Usuario solicita** datos
2. **API consulta** blockchain para obtener hash
3. **IPFS recupera** datos usando el hash
4. **API verifica** integridad comparando hashes
5. **Usuario recibe** datos verificados

## 📊 Estructura de Datos

### Colecciones IPFS

```
/users/          # Datos de usuarios
/profiles/       # Perfiles profesionales y empresas
/skills/         # Habilidades y validaciones
/marketplace/    # Órdenes y transacciones
/time_registry/  # Registros de tiempo
```

### Metadatos de IPFS

```json
{
  "data": {
    // Datos reales del usuario/perfil/etc.
  },
  "metadata": {
    "collection": "users",
    "timestamp": "2024-01-15T10:30:00Z",
    "version": "1.0",
    "blockchain_tx": "0x1234...",
    "sha256_hash": "abc123..."
  }
}
```

## 🔐 Seguridad e Integridad

### Verificación de Integridad
- **Hash SHA256** de los datos completos
- **Hash IPFS** para localización
- **Hash en blockchain** para inmutabilidad
- **Verificación cruzada** de hashes

### Inmutabilidad
- Los datos en IPFS son **inmutables**
- Los hashes en blockchain son **permanentes**
- **Versionado** para actualizaciones
- **Audit trail** completo

## 🛠️ Implementación Técnica

### Dependencias
```python
# Base de datos descentralizada
ipfshttpclient==0.8.0  # Cliente IPFS
web3==7.12.0          # Interacción blockchain
```

### Configuración IPFS
```python
# Conexión a IPFS
ipfs_node_url = "/ip4/127.0.0.1/tcp/5001"  # Local
# ipfs_node_url = "https://ipfs.infura.io:5001"  # Cloud
```

### Funciones Principales

```python
# Almacenamiento
def store_data(data: Dict, collection: str) -> Dict:
    # Almacena en IPFS y retorna hashes

# Recuperación
def retrieve_data(ipfs_hash: str) -> Dict:
    # Recupera datos desde IPFS

# Verificación
def verify_data_integrity(data: Dict, hash: str) -> bool:
    # Verifica integridad de datos
```

## 🌐 Opciones de Despliegue

### 1. **IPFS Local** (Desarrollo)
```bash
# Instalar IPFS
./setup-ipfs.sh

# Iniciar nodo local
ipfs daemon
```

### 2. **IPFS Cloud** (Producción)
- **Infura IPFS**: `https://ipfs.infura.io:5001`
- **Pinata**: `https://api.pinata.cloud`
- **Web3.Storage**: `https://api.web3.storage`

### 3. **IPFS Público** (Pruebas)
- **IPFS Gateway**: `https://gateway.ipfs.io`
- **Cloudflare**: `https://cloudflare-ipfs.com`

## 📈 Ventajas de la Arquitectura

### ✅ **Descentralización**
- Sin punto único de fallo
- Resistente a censura
- Control total de datos

### ✅ **Inmutabilidad**
- Datos verificables
- Historial completo
- Sin manipulación posible

### ✅ **Transparencia**
- Hashes públicos en blockchain
- Verificación independiente
- Auditoría completa

### ✅ **Escalabilidad**
- IPFS distribuye carga
- Sin límites de almacenamiento
- Redundancia automática

## 🔧 Configuración del Proyecto

### 1. **Instalar IPFS**
```bash
# Ejecutar script de configuración
./setup-ipfs.sh
```

### 2. **Iniciar IPFS**
```bash
# En una terminal separada
ipfs daemon
```

### 3. **Verificar Conexión**
```bash
# Verificar que IPFS está funcionando
curl http://localhost:5001/api/v0/version
```

### 4. **Desplegar Musubi**
```bash
# Desplegar con base de datos descentralizada
./start-musubi.sh
```

## 🧪 Pruebas y Verificación

### Endpoints de Prueba
```bash
# Crear usuario
curl -X POST http://localhost:5001/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@musubi.com",
    "wallet_address": "0x1234...",
    "profile_type": "professional"
  }'

# Verificar almacenamiento IPFS
curl http://localhost:5001/users/stats
```

### Verificación de Hashes
```bash
# Verificar hash en IPFS
ipfs cat <hash_ipfs>

# Verificar hash en blockchain
# (Implementar según contrato específico)
```

## 🚀 Próximos Pasos

### Fase 1: Implementación Básica ✅
- [x] Cliente IPFS integrado
- [x] Almacenamiento de usuarios
- [x] Verificación de hashes
- [x] Documentación Swagger

### Fase 2: Integración Blockchain
- [ ] Contratos para almacenar hashes
- [ ] Verificación on-chain
- [ ] Eventos de blockchain

### Fase 3: Optimización
- [ ] Indexación IPFS
- [ ] Cache local
- [ ] Compresión de datos
- [ ] Backup automático

### Fase 4: Producción
- [ ] Nodos IPFS distribuidos
- [ ] Monitoreo y métricas
- [ ] Recuperación de desastres
- [ ] Auditoría de seguridad

## 📚 Recursos Adicionales

- **IPFS Documentation**: https://ipfs.io/docs/
- **Web3.py**: https://web3py.readthedocs.io/
- **IPFS HTTP Client**: https://ipfshttpclient.readthedocs.io/
- **Ethereum Development**: https://ethereum.org/developers/

## 🤝 Contribución

Para contribuir a la base de datos descentralizada:

1. **Fork** el repositorio
2. **Crea** una rama para tu feature
3. **Implementa** y **prueba** los cambios
4. **Documenta** las modificaciones
5. **Envía** un pull request

---

**🎯 Musubi: Blockchain + IPFS = Descentralización Total** 