# Reformulación de Contratos - Arquitectura IPFS

## Resumen de Cambios

Se han reformulado todos los contratos de Musubi para eliminar el almacenamiento de datos personales en la blockchain y usar exclusivamente hashes de IPFS para referenciar los datos.

## Contratos Reformulados

### 1. ProfileRegistry
**Cambios principales:**
- Eliminado: `name`, `description`, `metadataURI`
- Agregado: `profileDataHash` (hash de IPFS con datos del perfil)
- Integración con `IPFSRegistry` para verificar existencia de hashes
- Nuevo enum `ProfileStatus` para mejor gestión de estados

**Funciones actualizadas:**
- `registerProfile(profileDataHash, profileType)` - Registra perfil con hash de IPFS
- `updateProfile(newProfileDataHash)` - Actualiza datos con nuevo hash
- `getProfileDataHash(user)` - Obtiene hash de datos del perfil

### 2. SkillSystem
**Cambios principales:**
- Eliminado: `name`, `category` de Skill
- Agregado: `skillDataHash` (hash de IPFS con datos de la habilidad)
- Agregado: `declarationDataHash` (hash de IPFS con datos de declaración)
- Integración con `IPFSRegistry` para verificar hashes
- Nuevo rol `VALIDATOR_ROLE` para validadores

**Funciones actualizadas:**
- `createSkill(skillDataHash)` - Crea habilidad con hash de IPFS
- `declareSkill(skillId, declarationDataHash, level)` - Declara habilidad con hash
- `getSkillDataHash(skillId)` - Obtiene hash de datos de habilidad
- `getDeclaredSkillDataHash(professional, skillId)` - Obtiene hash de declaración

### 3. TimeRegistry
**Cambios principales:**
- Eliminado: `description` de TimeRecord
- Agregado: `timeDataHash` (hash de IPFS con datos del registro)
- Agregado: `hourlyRate` y `totalAmount` para cálculos
- Nuevo enum `OrderStatus` y funciones de validación
- Integración con `IPFSRegistry`

**Funciones actualizadas:**
- `registerTime(skillId, timeDataHash, hoursWorked, hourlyRate)` - Registra tiempo con hash
- `updateTimeEntry(entryId, newTimeDataHash, newHoursWorked, newHourlyRate)` - Actualiza entrada
- `getTimeEntryDataHash(entryId)` - Obtiene hash de datos de entrada

### 4. P2PMarketplace
**Cambios principales:**
- Eliminado: `title`, `description` de Service
- Eliminado: `details` de Order
- Agregado: `serviceDataHash` (hash de IPFS con datos del servicio)
- Agregado: `orderDataHash` (hash de IPFS con datos de la orden)
- Integración con `IPFSRegistry`

**Funciones actualizadas:**
- `createService(serviceDataHash, pricePerHour, skillIds)` - Crea servicio con hash
- `updateService(serviceId, newServiceDataHash, pricePerHour, skillIds)` - Actualiza servicio
- `createOrder(serviceId, numHours, orderDataHash)` - Crea orden con hash
- `getServiceDataHash(serviceId)` - Obtiene hash de datos del servicio
- `getOrderDataHash(orderId)` - Obtiene hash de datos de la orden

### 5. IPFSRegistry
**Sin cambios** - Ya estaba correctamente diseñado para almacenar solo hashes.

### 6. KRMToken
**Sin cambios** - No almacena datos personales.

### 7. ProfileNFT
**Sin cambios** - Ya usaba `metadataURI` correctamente.

## Script de Despliegue Actualizado

El script `ignition/modules/deploy.js` ha sido actualizado para:
1. Desplegar `IPFSRegistry` primero como base
2. Configurar dependencias correctas en todos los contratos
3. Incluir `IPFSRegistry` en la configuración del `P2PMarketplace`

## Ventajas de la Nueva Arquitectura

### Privacidad y GDPR
- Los datos personales no se almacenan en la blockchain
- Los usuarios mantienen control total sobre sus datos
- Cumplimiento con regulaciones de privacidad

### Escalabilidad
- Reducción significativa del costo de gas
- La blockchain solo almacena referencias (hashes)
- Los datos pueden crecer sin límites en IPFS

### Flexibilidad
- Los datos pueden actualizarse sin modificar la blockchain
- Mejor gestión de versiones de datos
- Posibilidad de agregar nuevos campos sin migrar contratos

### Seguridad
- Verificación de integridad mediante hashes SHA256
- Los datos en IPFS son inmutables por hash
- Trazabilidad completa de cambios

## Flujo de Datos

1. **Escritura**: Los datos se suben a IPFS → Se obtiene hash → Se registra hash en blockchain
2. **Lectura**: Se obtiene hash de blockchain → Se consulta IPFS con hash → Se recuperan datos
3. **Actualización**: Se suben nuevos datos a IPFS → Se obtiene nuevo hash → Se actualiza hash en blockchain

## Consideraciones para el Frontend

El frontend debe ser actualizado para:
1. Subir datos a IPFS antes de llamar a funciones de contratos
2. Obtener hashes de IPFS para todas las operaciones
3. Leer datos desde IPFS usando hashes obtenidos de la blockchain
4. Manejar errores de IPFS y fallbacks

## Próximos Pasos

1. Actualizar scripts de configuración para usar la nueva arquitectura
2. Modificar el frontend para integrar IPFS
3. Actualizar documentación de API
4. Crear tests para la nueva funcionalidad
5. Implementar sistema de cache para datos de IPFS 