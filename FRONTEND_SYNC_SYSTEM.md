# Sistema de Sincronización Automática de Direcciones del Frontend

## Descripción

Se ha implementado un sistema completo para sincronizar automáticamente las direcciones de contratos entre el despliegue de Hardhat Ignition y el frontend React, evitando errores de direcciones desactualizadas.

## Componentes del Sistema

### 1. Script de Sincronización (`hardhat-dev/sync_frontend_addresses.js`)

**Funcionalidades:**
- Lee automáticamente las direcciones desde `hardhat-dev/ignition/deployments/chain-*/deployed_addresses.json`
- Mapea los nombres de contratos desde el formato Ignition (`MusubiDeployment#KRMToken`) al formato del frontend (`KRMToken`)
- Genera automáticamente el archivo `frontend/src/config.ts` con las direcciones actualizadas
- Soporta múltiples redes (local, sepolia, polygon_amoy, polygon)
- Incluye configuración completa de redes y metadatos

**Uso manual:**
```bash
node hardhat-dev/sync_frontend_addresses.js
```

### 2. Integración en el Proceso de Despliegue

**Sincronización automática:**
- Se ejecuta automáticamente después de cada despliegue de contratos
- Se integra en todas las redes: local, sepolia, polygon-amoy, polygon
- Manejo de errores robusto (continúa el despliegue aunque falle la sincronización)

**Ubicación en el código:**
```bash
# En start-musubi.sh, después de deploy_contracts
sync_frontend_addresses "local" || {
    echo -e "${YELLOW}⚠️  Sincronización del Frontend falló, continuando sin ella${NC}"
}
```

### 3. Archivo de Configuración Generado (`frontend/src/config.ts`)

**Estructura:**
```typescript
// Configuración automáticamente generada por sync_frontend_addresses.js
// Última sincronización: 2025-06-24T21:01:01.688Z
// Red activa: local

export const CONTRACT_ADDRESSES = {
  KRMToken: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  ProfileRegistry: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
  SkillSystem: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
  TimeRegistry: "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853",
  P2PMarketplace: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
  ProfileNFT: "0x0165878A594ca255338adfa4d48449f69242Eb8F",
  IPFSRegistry: "0x5FbDB2315678afecb367f032d93F642f64180aa3"
};

export const CHAIN_ID = 31337;
export const RPC_URL = "http://localhost:8545";

// Configuración completa para referencia
export const NETWORK_CONFIG = { /* ... */ };
```

## Flujo de Trabajo

### 1. Despliegue Automático
1. Usuario ejecuta `./start-musubi.sh` y selecciona una red
2. Se despliegan los contratos con Hardhat Ignition
3. **Automáticamente** se ejecuta `sync_frontend_addresses.js`
4. Se actualiza `frontend/src/config.ts` con las nuevas direcciones
5. El frontend usa las direcciones correctas al reiniciarse

### 2. Despliegue Manual
1. Desplegar contratos manualmente: `cd hardhat-dev && npx hardhat ignition deploy ignition/modules/deploy.js`
2. Sincronizar frontend: `node hardhat-dev/sync_frontend_addresses.js`
3. Reiniciar frontend para usar las nuevas direcciones

## Ventajas del Sistema

### ✅ Automatización Completa
- No más errores de direcciones desactualizadas
- Sincronización automática en cada despliegue
- Configuración consistente entre blockchain y frontend

### ✅ Flexibilidad
- Soporte para múltiples redes
- Configuración por defecto si no hay despliegues
- Manejo robusto de errores

### ✅ Transparencia
- Archivo de configuración auto-documentado
- Timestamp de última sincronización
- Metadatos completos de la configuración

### ✅ Mantenibilidad
- Script reutilizable y modular
- Fácil de extender para nuevas redes
- Logs detallados del proceso

## Redes Soportadas

| Red | Chain ID | Estado |
|-----|----------|--------|
| Local (Hardhat) | 31337 | ✅ Implementado |
| Sepolia Testnet | 11155111 | ✅ Implementado |
| Polygon Amoy | 80002 | ✅ Implementado |
| Polygon Mainnet | 137 | ✅ Implementado |

## Contratos Soportados

- `KRMToken` - Token nativo de la plataforma
- `ProfileRegistry` - Registro de perfiles de usuario
- `SkillSystem` - Sistema de habilidades
- `TimeRegistry` - Registro de tiempo intercambiado
- `P2PMarketplace` - Marketplace peer-to-peer
- `ProfileNFT` - NFTs de perfiles
- `IPFSRegistry` - Registro de contenido IPFS

## Troubleshooting

### Error: "Script de sincronización no encontrado"
```bash
# Verificar que el archivo existe
ls -la hardhat-dev/sync_frontend_addresses.js

# Si no existe, recrear el script
# (El script se incluye en el repositorio)
```

### Error: "No se encontraron redes desplegadas"
```bash
# Verificar que hay despliegues
ls -la hardhat-dev/ignition/deployments/

# Si no hay despliegues, ejecutar uno primero
./start-musubi.sh  # Opción 1: Despliegue Local
```

### Direcciones incorrectas en el frontend
```bash
# Sincronizar manualmente
node hardhat-dev/sync_frontend_addresses.js

# Verificar las direcciones
cat frontend/src/config.ts
```

## Próximas Mejoras

1. **Interfaz Web**: Añadir opción en el menú principal para sincronización manual
2. **Notificaciones**: Alertas cuando las direcciones están desactualizadas
3. **Validación**: Verificar que las direcciones son válidas antes de actualizar
4. **Backup**: Crear respaldos automáticos de la configuración anterior
5. **Hot Reload**: Recargar automáticamente el frontend después de la sincronización

## Conclusión

Este sistema resuelve completamente el problema de direcciones desactualizadas entre el despliegue de contratos y el frontend, proporcionando:

- **Automatización completa** en el proceso de despliegue
- **Flexibilidad** para diferentes redes y configuraciones
- **Robustez** con manejo de errores apropiado
- **Transparencia** con logs y metadatos detallados

El frontend ahora siempre usará las direcciones correctas de los contratos desplegados, eliminando errores de conexión y mejorando la experiencia del usuario. 