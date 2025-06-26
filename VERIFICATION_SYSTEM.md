# Sistema de Verificación y Alineación Dinámica de Musubi

## Descripción

El Sistema de Verificación y Alineación Dinámica es una herramienta automatizada que detecta cambios en los contratos desplegados y sincroniza automáticamente todos los componentes del sistema (API, Frontend, ABIs) para mantener la coherencia del ecosistema Musubi.

## Características Principales

### 🔍 Detección Automática de Cambios
- **Hash de Contratos**: Calcula un hash MD5 del archivo de despliegue para detectar cambios
- **Comparación Inteligente**: Compara con el hash anterior almacenado en `.contract_hash`
- **Sincronización Automática**: Ejecuta sincronización solo cuando detecta cambios

### 🔄 Sincronización Inteligente
- **API**: Sincroniza direcciones de contratos con `musubi-api/src/config/api_config.json`
- **Frontend**: Sincroniza direcciones con `frontend/src/config.ts`
- **ABIs**: Verifica que todos los ABIs estén disponibles
- **Fallback**: Si falla la verificación automática, usa sincronización manual

### 🌐 Verificación de Servicios
- **Blockchain**: Verifica que Hardhat esté corriendo en puerto 8545
- **IPFS**: Verifica conectividad y estado del daemon IPFS
- **Alineación**: Verifica que las direcciones estén sincronizadas entre componentes

## Arquitectura

```
start-musubi.sh
    ↓
scripts/run-verification.sh (Wrapper)
    ↓
scripts/verify-and-align.sh (Script Principal)
    ↓
├── detect_contract_changes()     # Detecta cambios en contratos
├── verify_abis()                 # Verifica ABIs disponibles
├── sync_api()                    # Sincroniza API
├── sync_frontend()               # Sincroniza Frontend
├── verify_ipfs()                 # Verifica IPFS
├── verify_blockchain()           # Verifica Blockchain
└── verify_address_alignment()    # Verifica alineación
```

## Integración con start-musubi

El sistema se integra automáticamente en el flujo de despliegue local:

```bash
# En deploy_local() de start-musubi.sh
deploy_contracts "local" || return 1

# Ejecutar verificación y alineación dinámica
if [[ -f "$PROJECT_DIR/scripts/run-verification.sh" ]]; then
    bash "$PROJECT_DIR/scripts/run-verification.sh" || {
        # Fallback a sincronización manual si falla
        sync_contract_addresses "local"
        sync_frontend_addresses "local"
    }
fi
```

## Archivos del Sistema

### Scripts Principales
- `scripts/verify-and-align.sh`: Script principal de verificación
- `scripts/run-verification.sh`: Wrapper para integración con start-musubi

### Archivos de Control
- `.contract_hash`: Almacena el hash del último despliegue
- `hardhat-dev/ignition/deployments/chain-31337/deployed_addresses.json`: Fuente de direcciones

### Archivos de Configuración
- `musubi-api/src/config/api_config.json`: Configuración de la API
- `frontend/src/config.ts`: Configuración del Frontend

## Flujo de Ejecución

### 1. Detección de Cambios
```bash
# Calcula hash del archivo de despliegue
deployment_hash=$(md5sum deployed_addresses.json | cut -d' ' -f1)

# Compara con hash anterior
if [ "$deployment_hash" != "$previous_hash" ]; then
    # Hay cambios - iniciar sincronización
fi
```

### 2. Sincronización Automática
```bash
# Sincroniza API
cd musubi-api
python3 sync_contract_addresses.py

# Sincroniza Frontend
cd hardhat-dev
node sync_frontend_addresses.js
```

### 3. Verificación de Alineación
```bash
# Verifica que las direcciones coincidan
verify_address_alignment()
```

## Uso Manual

### Ejecutar Verificación Completa
```bash
bash scripts/verify-and-align.sh
```

### Solo Verificar Servicios
```bash
# Verificar blockchain
curl -s -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  http://localhost:8545

# Verificar IPFS
curl -s http://localhost:5001/api/v0/version
```

### Forzar Sincronización
```bash
# Limpiar hash para forzar sincronización
rm .contract_hash

# Ejecutar verificación
bash scripts/verify-and-align.sh
```

## Estados del Sistema

### ✅ Sistema Alineado
- Blockchain: Conectado
- IPFS: Conectado
- ABIs: Disponibles
- Direcciones: Alineadas

### ⚠️ Sistema Necesita Configuración
- Al menos un servicio no está disponible
- Se muestra resumen de estado

### ❌ Errores Críticos
- Scripts de sincronización no encontrados
- Errores en la sincronización

## Ventajas del Sistema

### 🚀 Automatización
- **Sin Intervención Manual**: Detecta y sincroniza automáticamente
- **Consistencia**: Garantiza que todos los componentes usen las mismas direcciones
- **Confiabilidad**: Reduce errores de configuración manual

### 🔧 Flexibilidad
- **Fallback Inteligente**: Si falla la verificación, usa sincronización manual
- **Compatibilidad**: Funciona con el sistema existente
- **Extensibilidad**: Fácil agregar nuevas verificaciones

### 📊 Visibilidad
- **Estado en Tiempo Real**: Muestra el estado de todos los servicios
- **Logs Detallados**: Información clara sobre cada paso
- **Resumen Visual**: Estado general del sistema

## Troubleshooting

### Problema: "Script de verificación no encontrado"
**Solución**: Verificar que los scripts estén en `scripts/` y sean ejecutables
```bash
chmod +x scripts/verify-and-align.sh
chmod +x scripts/run-verification.sh
```

### Problema: "Blockchain no responde"
**Solución**: Asegurar que Hardhat esté corriendo
```bash
cd hardhat-dev
npx hardhat node
```

### Problema: "IPFS no responde"
**Solución**: Iniciar IPFS
```bash
bash setup-ipfs-dev.sh
```

### Problema: "ABIs faltantes"
**Solución**: Compilar contratos
```bash
cd hardhat-dev
npx hardhat compile
```

## Configuración Avanzada

### Personalizar Verificaciones
Editar `scripts/verify-and-align.sh` para agregar nuevas verificaciones:

```bash
# Agregar nueva verificación
verify_custom_service() {
    print_status "Verificando servicio personalizado..."
    # Lógica de verificación
}
```

### Modificar Umbrales
Ajustar la sensibilidad de detección de cambios:

```bash
# En detect_contract_changes()
# Cambiar algoritmo de hash o agregar más archivos
```

## Contribución

Para contribuir al sistema de verificación:

1. **Fork** el repositorio
2. **Crear** rama para nueva funcionalidad
3. **Implementar** cambios en scripts
4. **Probar** con diferentes escenarios
5. **Documentar** cambios en este archivo
6. **Pull Request** con descripción detallada

## Changelog

### v1.0.0 (Actual)
- ✅ Detección automática de cambios en contratos
- ✅ Sincronización automática de API y Frontend
- ✅ Verificación de servicios (Blockchain, IPFS)
- ✅ Integración con start-musubi
- ✅ Sistema de fallback robusto
- ✅ Documentación completa

---

**Nota**: Este sistema está diseñado para funcionar con la arquitectura actual de Musubi y se integra perfectamente con el flujo de despliegue existente. 