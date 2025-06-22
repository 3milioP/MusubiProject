# Musubi Project

Musubi es una plataforma blockchain para gestión de perfiles profesionales, skills validadas como NFTs, registro de tiempo, marketplace P2P y token KRM con reflexión. Incluye smart contracts, frontend moderno y APIs.

---

## 🚀 Guía Rápida de Inicio

1. Clona el repositorio y accede a la carpeta:
   ```bash
   git clone https://github.com/3milioP/MusubiProject.git
   cd MusubiProject
   ```

2. Da permisos y ejecuta el script principal:
   ```bash
   chmod +x start-musubi.sh
   ./start-musubi.sh
   ```

3. Selecciona "Despliegue Local" en el menú y sigue las instrucciones.

4. Accede a:
   - Frontend: http://localhost:5173
   - APIs: http://localhost:5000

5. Configura MetaMask con:
   - RPC: http://localhost:8545
   - Chain ID: 31337
   - Símbolo: KRM
   - Cuenta de prueba: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

---

## 🧪 Sistema de Pruebas UX

El proyecto incluye un sistema profesional de pruebas de experiencia de usuario (UX):

- **Pruebas manuales**: `./hardhat-dev/scripts/test-user-experience.sh manual`
- **Pruebas automatizadas**: `node ./hardhat-dev/scripts/test-automated-ux.js`
- **Pruebas de optimización**: `./hardhat-dev/scripts/test-frontend-optimization.sh`

**Escenarios cubiertos:**
- Onboarding y registro de perfil (usuario nuevo y experto)
- Validación de campos y feedback
- Declaración de habilidades y registro de tiempo
- Navegación, estados de carga y responsive design

**Criterios de éxito:** Onboarding claro, feedback inmediato, interfaz moderna, sin errores críticos.

Más detalles en los scripts y en los comentarios del código.

---

## 🧹 Organización y Mantenimiento

- El repositorio ha sido limpiado y optimizado: solo se mantienen archivos y scripts esenciales.
- Toda la gestión y despliegue se realiza desde `start-musubi.sh`.
- La documentación y los scripts de pruebas están centralizados en `hardhat-dev/scripts/`.

---

## 📚 Recursos y Soporte

- **Contratos:** `contracts/`
- **Frontend:** `frontend/`
- **APIs:** `musubi-api/`
- **Scripts y pruebas:** `hardhat-dev/scripts/`
- **Script principal:** `start-musubi.sh`

Si tienes dudas, revisa los mensajes del script principal o los comentarios en los scripts de pruebas.

---

*¡Bienvenido al futuro del trabajo descentralizado con Musubi! 🚀*
