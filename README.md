# 🎌 Musubi Project

**Plataforma blockchain descentralizada** para gestión de perfiles profesionales, habilidades validadas como NFTs, registro de tiempo, marketplace P2P y token KRM con reflexión. Incluye smart contracts, frontend moderno, APIs REST con documentación Swagger y almacenamiento descentralizado en IPFS.

---

## 🌟 Características Principales

### 🔗 **Blockchain & Smart Contracts**
- **7 contratos inteligentes** desplegados con Hardhat Ignition
- **Sistema de roles** granular (Admin, Verifier, Karma, Minter, Evolver)
- **Tokens KRM** con reflexión automática (1% fee)
- **NFTs evolutivos** para perfiles profesionales
- **Marketplace P2P** con validación de habilidades
- **Registro de tiempo** con disputas y validación

### 🌐 **Frontend Moderno**
- **React + TypeScript** con Vite
- **Web3 integration** con MetaMask
- **Onboarding flow** completo para nuevos usuarios
- **Interfaz responsive** y moderna
- **Tutoriales integrados** para MetaMask y Musubi

### 🔌 **APIs REST**
- **FastAPI** con documentación Swagger automática
- **138 tests** de contratos inteligentes
- **Sincronización automática** de direcciones de contratos
- **Soporte multi-red** (local, testnet, mainnet)
- **Base de datos descentralizada** con IPFS

### 📦 **Almacenamiento Descentralizado**
- **IPFS** para datos de usuarios y perfiles
- **Registro de hashes** en blockchain
- **Almacenamiento local** como fallback
- **Transparencia total** para el usuario

---

## 🚀 Guía Rápida de Inicio

### 1. **Clonar y Preparar**
```bash
git clone https://github.com/3milioP/MusubiProject.git
cd MusubiProject
chmod +x start-musubi.sh
```

### 2. **Despliegue Automático**
```bash
./start-musubi.sh
# Selecciona "1. Despliegue Local" en el menú
```

### 3. **Acceso a Servicios**
- **Frontend**: http://localhost:5173
- **APIs**: http://localhost:5001
- **Documentación Swagger**: http://localhost:5001/docs
- **Blockchain**: http://localhost:8545

### 4. **Configurar MetaMask**
```
Nombre: Musubi Local
RPC URL: http://localhost:8545
Chain ID: 31337
Símbolo: KRM
```

### 5. **Cuenta de Prueba**
```
Dirección: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Clave: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

---

## 🏗️ Arquitectura del Sistema

### **Contratos Inteligentes**
```
hardhat-dev/contracts/
├── core/
│   ├── ProfileRegistry.sol    # Registro de perfiles profesionales
│   ├── SkillSystem.sol        # Sistema de habilidades y validación
│   ├── TimeRegistry.sol       # Registro de tiempo trabajado
│   └── IPFSRegistry.sol       # Registro de hashes IPFS en blockchain
├── marketplace/
│   └── P2PMarketplace.sol     # Marketplace P2P con validación
└── tokens/
    ├── KRMToken.sol           # Token KRM con reflexión
    └── ProfileNFT.sol         # NFTs evolutivos de perfiles
```

### **Frontend React**
```
frontend/src/
├── components/                # Componentes React
│   ├── onboarding/           # Flujo de onboarding
│   ├── tutorial/             # Tutoriales integrados
│   ├── Navbar.tsx           # Navegación principal
│   └── Sidebar.tsx          # Barra lateral
├── pages/                    # Páginas de la aplicación
├── contexts/                 # Contextos de React
├── hooks/                    # Hooks personalizados
├── services/                 # Servicios y ABIs
└── utils/                    # Utilidades blockchain
```

### **API REST**
```
musubi-api/src/
├── routes/                   # Endpoints de la API
│   ├── contracts.py         # Endpoints de contratos
│   ├── profiles.py          # Gestión de perfiles
│   ├── skills.py            # Sistema de habilidades
│   ├── marketplace.py       # Marketplace P2P
│   ├── timeregistry.py      # Registro de tiempo
│   ├── krm.py              # Token KRM
│   ├── ipfs_registry.py    # Registro IPFS
│   └── user.py             # Gestión de usuarios
├── config/                  # Configuración
│   ├── contracts.py        # Configuración de contratos
│   ├── decentralized_db.py # Base de datos descentralizada
│   └── api_config.json    # Configuración de redes
└── models/                  # Modelos de datos
```

---

## 🔧 Funcionalidades Principales

### **👤 Gestión de Perfiles**
- Registro de perfiles profesionales y empresas
- Verificación de perfiles por validadores autorizados
- Sistema de karma y reputación
- NFTs evolutivos que crecen con las habilidades

### **🎯 Sistema de Habilidades**
- Declaración de habilidades por profesionales
- Validación por empresas y validadores
- Niveles de habilidad (1-10)
- Solicitudes de validación con recompensas

### **⏰ Registro de Tiempo**
- Registro de horas trabajadas por profesionales
- Validación por empresas
- Sistema de disputas
- Estados: Pending, Validated, Disputed

### **🛒 Marketplace P2P**
- Creación de servicios por profesionales
- Búsqueda y contratación de servicios
- Pagos con tokens KRM
- Comisión de plataforma (1%)
- Validación de habilidades requeridas

### **💰 Token KRM**
- Suministro máximo: 1,000,000,000 KRM
- Reflexión automática (1% en transferencias)
- Minting controlado por roles
- Integración completa con marketplace

### **📦 Almacenamiento IPFS**
- Datos de usuarios almacenados en IPFS
- Hashes registrados en blockchain
- Transparencia y descentralización
- Fallback a almacenamiento local

---

## 🧪 Testing y Calidad

### **Tests de Contratos (138 tests)**
```bash
cd hardhat-dev
npm test
```

**Cobertura de tests:**
- ✅ ProfileRegistry (25 tests)
- ✅ SkillSystem (15 tests)
- ✅ TimeRegistry (20 tests)
- ✅ P2PMarketplace (25 tests)
- ✅ KRMToken (15 tests)
- ✅ ProfileNFT (20 tests)
- ✅ Integration (18 tests)

### **Tests de UX**
```bash
# Tests manuales de experiencia de usuario
./hardhat-dev/scripts/test-user-experience.sh manual

# Tests automatizados
node ./hardhat-dev/scripts/test-automated-ux.js

# Tests de optimización
./hardhat-dev/scripts/test-frontend-optimization.sh
```

---

## 📚 Documentación

### **APIs REST**
- **Swagger UI**: http://localhost:5001/docs
- **Endpoints disponibles**: 40+ endpoints
- **Documentación automática** con Flasgger
- **Tests interactivos** incluidos

### **Arquitectura de Base de Datos**
- **DATABASE_ARCHITECTURE.md**: Documentación completa
- **Almacenamiento descentralizado** con IPFS
- **Registro de hashes** en blockchain
- **Transparencia total** para usuarios

### **Scripts y Herramientas**
- **start-musubi.sh**: Script principal de despliegue
- **setup-ipfs.sh**: Configuración de IPFS
- **sync_contract_addresses.py**: Sincronización de direcciones
- **test-runner.sh**: Ejecutor de tests

---

## 🔄 Flujo de Trabajo

### **Para Desarrolladores**
1. **Desarrollo**: Trabaja en `hardhat-dev/contracts/`
2. **Testing**: Ejecuta `npm test` en `hardhat-dev/`
3. **Despliegue**: Usa `./start-musubi.sh`
4. **Documentación**: Actualiza Swagger automáticamente

### **Para Usuarios**
1. **Onboarding**: Tutorial integrado en el frontend
2. **Registro**: Crea tu perfil profesional
3. **Habilidades**: Declara y valida tus habilidades
4. **Trabajo**: Registra tiempo y participa en el marketplace
5. **Evolución**: Tu NFT crece con tus logros

---

## 🛠️ Tecnologías Utilizadas

### **Blockchain**
- **Solidity** ^0.8.20
- **Hardhat** con Ignition
- **OpenZeppelin** Contracts
- **MetaMask** Integration

### **Frontend**
- **React** 18
- **TypeScript**
- **Vite**
- **Ethers.js**
- **Tailwind CSS**

### **Backend**
- **Python** 3.11+
- **FastAPI**
- **Flasgger** (Swagger)
- **IPFS** HTTP Client

### **Testing**
- **Mocha** + **Chai**
- **Hardhat Testing**
- **Playwright** (UX tests)

---

## 📊 Estado del Proyecto

### **✅ Completado**
- [x] 7 contratos inteligentes desplegados
- [x] Frontend React con onboarding
- [x] API REST con documentación Swagger
- [x] Sistema de testing completo (138 tests)
- [x] Integración IPFS + blockchain
- [x] Marketplace P2P funcional
- [x] Sistema de roles y permisos
- [x] Scripts de despliegue automatizado

### **🚧 En Desarrollo**
- [ ] Integración con redes testnet
- [ ] Optimizaciones de gas
- [ ] Auditoría de seguridad
- [ ] Dashboard de analytics

---

## 🤝 Contribuir

1. **Fork** el repositorio
2. **Crea** una rama para tu feature
3. **Desarrolla** siguiendo los estándares del proyecto
4. **Ejecuta** los tests: `npm test`
5. **Documenta** tus cambios
6. **Pull Request** con descripción detallada

---

## 📞 Soporte

- **Issues**: GitHub Issues
- **Documentación**: README.md y archivos .md
- **APIs**: http://localhost:5001/docs
- **Tests**: `./hardhat-dev/scripts/`

---

*¡Bienvenido al futuro del trabajo descentralizado con Musubi! 🚀*

**🎯 Objetivo**: Democratizar el acceso al trabajo profesional a través de blockchain, validación de habilidades y marketplace descentralizado.
