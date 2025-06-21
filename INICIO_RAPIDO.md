# 🚀 Guía de Inicio Rápido - Musubi

## ⚡ Inicio en 5 Minutos

Esta guía te permitirá tener Musubi funcionando completamente en tu máquina local en menos de 5 minutos.

## 📋 Requisitos Previos

- **Node.js** v18 o superior
- **npm** v8 o superior  
- **Git** para clonar el repositorio
- **Python 3** (opcional, para APIs)

## 🔧 Instalación Rápida

### 1. Clonar el Repositorio
```bash
git clone https://github.com/3milioP/MusubiProject.git
cd MusubiProject
```

### 2. Ejecutar el Script Principal
```bash
# Dar permisos de ejecución
chmod +x start-musubi.sh

# Iniciar Musubi
./start-musubi.sh
```

### 3. Seleccionar Despliegue Local
- En el menú, selecciona la opción **1** (Despliegue Local)
- El script automáticamente:
  - ✅ Instalará todas las dependencias
  - ✅ Iniciará el nodo Hardhat local
  - ✅ Ejecutará los tests
  - ✅ Desplegará los contratos
  - ✅ Iniciará el frontend
  - ✅ Iniciará las APIs REST

## 🌐 Acceder a la Aplicación

Una vez completado el despliegue:

- **Frontend**: http://localhost:5173 (o puerto mostrado)
- **APIs REST**: http://localhost:5000
- **Blockchain Local**: http://localhost:8545
- **Chain ID**: 31337

## 🦊 Configurar MetaMask

### Agregar Red Local
1. Abre MetaMask
2. Ve a **Configuración > Redes > Agregar Red**
3. Configura:
   - **Nombre**: Musubi Local
   - **RPC URL**: http://localhost:8545
   - **Chain ID**: 31337
   - **Símbolo**: KRM

### Importar Cuenta de Prueba
1. En MetaMask, ve a **Importar Cuenta**
2. Usa esta clave privada de prueba:
   ```
   0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   ```
3. Esta cuenta tendrá ETH de prueba automáticamente

## 🎯 Primeros Pasos en Musubi

### 1. Completar el Onboarding
- Al abrir la aplicación, verás el tutorial de bienvenida
- Sigue los pasos para entender qué es Musubi
- Aprende a configurar MetaMask si es necesario

### 2. Conectar tu Wallet
- Haz clic en "Conectar Wallet"
- Autoriza la conexión en MetaMask
- Verifica que estés en la red correcta (Chain ID: 31337)

### 3. Crear tu Perfil
- Ve a **Mi Perfil**
- Completa la información básica
- Registra tu perfil en la blockchain

### 4. Declarar Habilidades
- Ve a **Habilidades**
- Declara tus primeras habilidades
- Solicita validación de otros usuarios

### 5. Explorar el Marketplace
- Ve a **Marketplace**
- Explora servicios disponibles
- Publica tu primer servicio

## 🛠️ Comandos Útiles

### Gestión del Sistema
```bash
# Ver estado del sistema
./start-musubi.sh
# Seleccionar opción 7

# Solo frontend
./start-musubi.sh  
# Seleccionar opción 8

# Solo APIs
./start-musubi.sh
# Seleccionar opción 9
```

### Testing
```bash
cd hardhat-dev
./test-runner.sh all local     # Todos los tests
./test-runner.sh unit local    # Solo tests unitarios
./test-runner.sh coverage      # Con análisis de cobertura
```

### Validación de APIs
```bash
./validate-apis.sh full        # Validación completa
./validate-apis.sh krm         # Solo endpoints KRM
./validate-apis.sh marketplace # Solo marketplace
```

## 🔧 Solución de Problemas Comunes

### Error: Puerto en Uso
```bash
# Matar procesos en puertos específicos
sudo lsof -ti:8545 | xargs kill -9  # Hardhat
sudo lsof -ti:5173 | xargs kill -9  # Frontend
sudo lsof -ti:5000 | xargs kill -9  # APIs
```

### Error: Dependencias Faltantes
```bash
# Instalar dependencias manualmente
cd hardhat-dev && npm install
cd ../frontend && npm install
cd ../musubi-api && pip install -r requirements.txt
```

### Error: MetaMask No Conecta
1. Verifica que MetaMask esté instalado
2. Asegúrate de estar en la red correcta (Chain ID: 31337)
3. Refresca la página del frontend
4. Intenta desconectar y reconectar la wallet

### Error: Transacciones Fallan
1. Verifica que tengas ETH de prueba en tu cuenta
2. Asegúrate de que el nodo Hardhat esté ejecutándose
3. Verifica que los contratos estén desplegados correctamente

## 📚 Recursos Adicionales

### Documentación
- **README Principal**: `./README.md`
- **Resumen de Mejoras**: `./RESUMEN_MEJORAS_COMPLETO.md`
- **APIs**: http://localhost:5000/docs (cuando esté ejecutándose)

### Archivos de Configuración
- **Hardhat**: `./hardhat-dev/hardhat.config.js`
- **Frontend**: `./frontend/vite.config.ts`
- **APIs**: `./musubi-api/src/main.py`

### Scripts Principales
- **Despliegue**: `./start-musubi.sh`
- **Tests**: `./hardhat-dev/test-runner.sh`
- **Validación**: `./validate-apis.sh`

## 🎉 ¡Listo para Usar!

Una vez completados estos pasos, tendrás:

- ✅ **Blockchain local** ejecutándose
- ✅ **Contratos desplegados** y funcionales
- ✅ **Frontend** accesible y conectado
- ✅ **APIs REST** disponibles
- ✅ **MetaMask configurado** para desarrollo
- ✅ **Cuenta de prueba** con fondos

¡Ahora puedes explorar todas las funcionalidades de Musubi!

## 🆘 Soporte

Si encuentras algún problema:

1. Revisa los logs en la terminal donde ejecutaste el script
2. Verifica que todos los servicios estén ejecutándose
3. Consulta la documentación completa
4. Usa el comando de estado del sistema para diagnosticar

---

*¡Bienvenido al futuro del trabajo descentralizado con Musubi! 🚀*

