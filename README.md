# 🎭 Musubi - Plataforma Descentralizada de Intercambio de Tiempo y Habilidades

Musubi es una plataforma blockchain que permite el intercambio descentralizado de tiempo y habilidades entre profesionales y empresas, utilizando tokens KRM (Karma) y contratos inteligentes en Ethereum.

## 🌟 Características Principales

### 🔗 Integración IPFS
- **Almacenamiento Descentralizado**: Los perfiles y metadatos se almacenan en IPFS para mayor eficiencia y descentralización
- **Hashes en Blockchain**: Solo los hashes de IPFS se almacenan en la blockchain, reduciendo costos de gas
- **Datos Enriquecidos**: Información completa de perfiles incluyendo ubicación, habilidades, tarifas, idiomas, etc.
- **Fallback Automático**: Si la API local no está disponible, intenta obtener datos desde IPFS público

### 👥 Sistema de Roles y Validación
- **KARMA_ROLE Universal**: Todos los usuarios tienen el rol de validador para facilitar las pruebas
- **Validación Cruzada**: Los usuarios pueden validar las habilidades de otros (excepto a sí mismos)
- **Gestión de Karma**: Sistema de puntos basado en validaciones y registros de tiempo
- **Retiro de Roles**: Los roles pueden ser revocados en caso de comportamiento fraudulento

### 💰 Token KRM (Karma)
- **Distribución Inicial**: 1000 KRM para cada usuario de prueba
- **Earned Through**: Validaciones, registros de tiempo, y participación en el marketplace
- **Utility**: Pago de servicios, validaciones premium, y gobernanza futura

## 🏗️ Arquitectura del Sistema

Para una descripción técnica detallada de la arquitectura, consulta el archivo [ARCHITECTURE.md](./ARCHITECTURE.md).

### Contratos Inteligentes
- **ProfileRegistry**: Gestión de perfiles con integración IPFS
- **SkillSystem**: Sistema de habilidades con validación cruzada
- **TimeRegistry**: Registro y validación de tiempo trabajado
- **P2PMarketplace**: Marketplace descentralizado para servicios
- **KRMToken**: Token ERC-20 para el sistema de karma
- **IPFSRegistry**: Registro de hashes IPFS y metadatos

### Frontend (React + TypeScript)
- **Lectura IPFS**: Obtiene datos completos desde IPFS usando hashes de la blockchain
- **UI Enriquecida**: Muestra información completa de perfiles y habilidades
- **Gestión de Estados**: Contextos para Web3, notificaciones y onboarding
- **Responsive Design**: Interfaz moderna y accesible
- **Developer Tools**: Página dedicada para testing y monitorización del sistema

### API (Python + Flask)
- **Endpoints IPFS**: Servicio de contenido IPFS para el frontend
- **Integración Blockchain**: Llamadas a contratos inteligentes
- **Gestión de Usuarios**: Registro y autenticación basada en wallet
- **Swagger Documentation**: API documentada en `/docs`

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 18+
- Python 3.8+
- Hardhat
- MetaMask o wallet compatible

### 1. Clonar y Configurar
```bash
git clone <repository-url>
cd MusubiProject
npm install
cd frontend && npm install
cd ../musubi-api && pip install -r requirements.txt
```

### 2. Configurar Variables de Entorno
```bash
# En hardhat-dev/
cp .env.example .env
# Configurar variables de red y claves privadas
```

### 3. Desplegar Contratos
```bash
cd hardhat-dev
npx hardhat compile
npx hardhat run scripts/deploy.js --network localhost
```

### 4. Configurar Juego de Roles con IPFS
```bash
# Ejecutar el script de configuración completo
npx hardhat run scripts/setup-test-roles-ipfs.js --network localhost
```

Este script configura:
- ✅ Perfiles con datos en IPFS
- ✅ Roles KARMA_ROLE para todos los usuarios
- ✅ Skills con metadatos en IPFS
- ✅ Validaciones cruzadas de habilidades
- ✅ Distribución de 1000 KRM por usuario
- ✅ Configuración del marketplace

### 5. Levantar el Proyecto
```bash
# Terminal 1: Blockchain local
cd hardhat-dev
npx hardhat node

# Terminal 2: API
cd musubi-api
python src/main.py

# Terminal 3: Frontend
cd frontend
npm run dev
```

## 🎯 Flujos de Usuario

### 1. Registro de Perfil con IPFS
1. Usuario conecta wallet
2. Completa formulario de perfil
3. Datos se almacenan en IPFS
4. Hash IPFS se registra en blockchain
5. Perfil queda activo con datos enriquecidos

### 2. Sistema de Habilidades
1. Usuario declara habilidades con nivel
2. Otros usuarios validan las declaraciones
3. Metadatos de skills se almacenan en IPFS
4. Sistema de karma se actualiza automáticamente

### 3. Registro de Tiempo
1. Profesional registra tiempo trabajado
2. Datos se suben a IPFS mediante API
3. Hash IPFS se registra en blockchain
4. Empresa valida el registro
5. Karma se distribuye según validación

### 4. Marketplace P2P
1. Proveedor crea servicio con precio en KRM
2. Cliente compra servicio con tokens
3. Transacción se ejecuta en smart contract
4. Karma se transfiere automáticamente

## 🔧 Gestión de Roles

### KARMA_ROLE Universal
- **Propósito**: Facilitar pruebas y validaciones
- **Asignación**: Todos los usuarios tienen este rol
- **Funcionalidad**: Permite validar habilidades y registros de tiempo
- **Seguridad**: Puede ser revocado por admin en caso de abuso

### Retiro de Roles
```javascript
// Ejemplo de retiro de rol (solo admin)
await skillSystem.revokeRole(karmaRole, userAddress);
```

### Validación Cruzada
- Los usuarios pueden validar a otros
- No pueden validarse a sí mismos
- Sistema de karma basado en validaciones recibidas
- Historial inmutable de validaciones

## 🌐 Integración IPFS

### Estructura de Datos
```json
{
  "name": "Juan Profesional",
  "description": "Desarrollador Full Stack...",
  "profileType": "professional",
  "walletAddress": "0x...",
  "location": "Madrid, España",
  "website": "https://juan-professional.dev",
  "github": "juan-professional",
  "linkedin": "juan-professional",
  "skills": ["React", "Node.js", "Solidity"],
  "hourlyRate": 50,
  "languages": ["Español", "Inglés"],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Flujo de Lectura
1. Frontend obtiene hash IPFS desde blockchain
2. Intenta obtener datos desde API local
3. Fallback a IPFS público si es necesario
4. Combina datos de blockchain con metadatos IPFS
5. Muestra información enriquecida al usuario

## 🧪 Testing y Developer Tools

### Página de Developer Tools
- **Estado del Sistema**: Verificación de blockchain, IPFS, API y frontend
- **Tests Interactivos**: Pruebas individuales de cada funcionalidad
- **Tests en Lote**: Ejecución de múltiples tests simultáneamente
- **Resultados Detallados**: Tabla con resultados y logs de cada test
- **Monitoreo en Tiempo Real**: Estado actualizado de todos los servicios

### Scripts de Prueba
```bash
# Pruebas de interoperabilidad
npx hardhat run scripts/test-contract-interoperability.js

# Pruebas de experiencia de usuario
npx hardhat run scripts/test-user-experience.sh

# Validación de APIs
npx hardhat run scripts/validate-apis.sh

# Test de registro de tiempo
npx hardhat run scripts/test-time-registration.js
```

### Cuentas de Prueba
- **Usuario Profesional**: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
- **Empresa**: `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`
- **Proveedor Marketplace**: `0x90F79bf6EB2c4f870365E785982E1f101E93b906`
- **Cliente Marketplace**: `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65`

## 🔒 Seguridad y Consideraciones

### Medidas de Seguridad
- **Validación de Roles**: Solo usuarios con KARMA_ROLE pueden validar
- **Prevención de Auto-validación**: Los usuarios no pueden validarse a sí mismos
- **Retiro de Roles**: Sistema para revocar roles en caso de abuso
- **Validación de Datos**: Verificación de integridad de datos IPFS

### Limitaciones del Prototipo
- **Red Local**: Contratos desplegados en Hardhat Network
- **IPFS Simulado**: Hashes IPFS simulados para desarrollo
- **Roles Universales**: KARMA_ROLE asignado a todos para facilitar pruebas
- **Sin Persistencia**: Datos se pierden al reiniciar Hardhat

## 📈 Roadmap

### Fase 1 (Actual) ✅
- [x] Contratos básicos desplegados
- [x] Integración IPFS implementada
- [x] Sistema de roles configurado
- [x] Frontend con lectura IPFS
- [x] Scripts de configuración
- [x] Developer Tools implementadas
- [x] Sistema de registro de tiempo con IPFS
- [x] Validación cruzada de habilidades

### Fase 2 (Próxima)
- [ ] Despliegue en testnet (Sepolia/Goerli)
- [ ] IPFS real con pinning service
- [ ] Sistema de reputación avanzado
- [ ] Marketplace con más funcionalidades
- [ ] Notificaciones push
- [ ] Exportación de datos

### Fase 3 (Futura)
- [ ] Despliegue en mainnet
- [ ] Gobernanza descentralizada
- [ ] Integración con otras blockchains
- [ ] Mobile app
- [ ] Analytics de uso

## 🚧 Problemas Conocidos y Soluciones

### Errores Comunes
1. **`this.contract.recordTime is not a function`**
   - **Causa**: El método correcto es `registerTime`, no `recordTime`
   - **Solución**: Usar `registerTime(skillId, timeDataHash, hoursWorked, hourlyRate)`

2. **Errores 404 en API de usuarios**
   - **Causa**: Usuario no tiene perfil registrado
   - **Solución**: Registrar perfil antes de consultar

3. **Skeleton loading infinito**
   - **Causa**: Lógica de carga incorrecta
   - **Solución**: Mostrar valores reales (0 cuando no hay datos)

### Debugging
- **Frontend**: Console del navegador
- **API**: Terminal donde corre Python
- **Blockchain**: Terminal de Hardhat
- **Developer Tools**: Página dedicada para testing

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🆘 Soporte

Para soporte técnico o preguntas:
- Abre un issue en GitHub
- Consulta la documentación de contratos en `hardhat-dev/ANALISIS_CONTRATOS.md`
- Usa la página de Developer Tools para debugging

## 📊 Estado del Proyecto

- **Frontend**: 95% completo
- **Backend**: 90% completo
- **Contratos**: 85% completo
- **Testing**: 80% completo
- **Documentación**: 85% completo

**Última actualización**: 26 de Junio 2025

---

**🎭 Musubi** - Donde el tiempo y las habilidades encuentran su valor real en la blockchain.
