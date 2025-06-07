# Musubi - Tejiendo Lazos de Confianza

## Índice de Documentación

1. [Introducción](#introducción)
2. [Estructura del Proyecto](#estructura-del-proyecto)
3. [Smart Contracts](#smart-contracts)
4. [Frontend](#frontend)
5. [Instalación y Configuración](#instalación-y-configuración)
6. [Uso](#uso)
7. [Roadmap](#roadmap)
8. [Contribución](#contribución)
9. [Licencia](#licencia)

## Introducción

Musubi (結び, "lazo" en japonés) es una plataforma blockchain que revoluciona la validación de habilidades profesionales y el registro horario laboral. En un mundo donde la IA permite falsificar fácilmente credenciales, Musubi crea una red de confianza donde las habilidades son validadas por empresas y academias, generando un sistema de karma que refleja la credibilidad real de cada profesional.

### Características Principales

- **Validación de Habilidades**: Sistema descentralizado donde empresas y academias validan las habilidades de los profesionales.
- **Registro Horario Blockchain**: Cumple con la legislación española sobre registro digital de jornada laboral.
- **Sistema de Karma**: Cuantifica la confianza en cada habilidad basándose en validaciones y tiempo trabajado.
- **Marketplace P2P**: Permite intercambiar servicios utilizando tokens Karma.
- **Perfiles Gamificados**: Visualización atractiva del perfil profesional mediante cartas tipo rol.
- **Tokenómica Sostenible**: El token KRM sustenta todo el ecosistema con utilidad real.

## Estructura del Proyecto

```
MusubiMVP/
├── contracts/                # Smart contracts
│   ├── core/                 # Contratos principales
│   │   ├── ProfileRegistry.sol
│   │   ├── SkillSystem.sol
│   │   └── TimeRegistry.sol
│   ├── marketplace/          # Contratos del marketplace P2P
│   │   └── P2PMarketplace.sol
│   └── tokens/               # Contratos de tokens
│       ├── KRMToken.sol
│       └── ProfileNFT.sol
├── frontend/                 # Aplicación frontend React
│   ├── public/
│   └── src/
│       ├── components/       # Componentes reutilizables
│       ├── pages/            # Páginas principales
│       ├── App.tsx           # Componente principal
│       └── main.tsx          # Punto de entrada
├── scripts/                  # Scripts de despliegue y utilidades
├── test/                     # Tests de smart contracts
└── README.md                 # Documentación principal
```

## Smart Contracts

### ProfileRegistry.sol
Gestiona los perfiles de usuarios, empresas y academias en la plataforma.

### SkillSystem.sol
Implementa el sistema de declaración y validación de habilidades profesionales.

### TimeRegistry.sol
Gestiona el registro horario laboral con validación bidireccional.

### P2PMarketplace.sol
Implementa el marketplace para intercambio de servicios usando tokens Karma.

### KRMToken.sol
Token ERC-20 que representa el Karma en el ecosistema.

### ProfileNFT.sol
Implementa los NFTs que representan los perfiles gamificados de los usuarios.

## Frontend

La interfaz de usuario está desarrollada con React y TypeScript, utilizando Material-UI para los componentes visuales.

### Páginas Principales

- **Dashboard**: Vista general con estadísticas y actividad reciente.
- **Profile**: Gestión del perfil profesional.
- **Skills**: Declaración y gestión de habilidades profesionales.
- **TimeRegistry**: Registro y validación de horas trabajadas.
- **Marketplace**: Exploración y publicación de servicios.
- **Settings**: Configuración de la cuenta y preferencias.

## Instalación y Configuración

### Requisitos Previos

- Node.js >= 16.0.0
- npm >= 8.0.0
- Metamask o wallet compatible con Polygon

### Instalación

1. Clonar el repositorio:
   ```
   git clone https://github.com/3milioP/Musubi.git
   cd Musubi
   ```

2. Instalar dependencias del frontend:
   ```
   cd frontend
   npm install
   ```

3. Instalar dependencias para smart contracts:
   ```
   npm install -g truffle
   npm install @openzeppelin/contracts
   ```

### Configuración

1. Configurar Metamask para conectarse a la red Polygon Mumbai Testnet.
2. Obtener MATIC de testnet desde un faucet.
3. Configurar variables de entorno (crear archivo .env basado en .env.example).

## Uso

### Desarrollo Local

1. Iniciar el servidor de desarrollo:
   ```
   cd frontend
   npm run dev
   ```

2. Compilar y migrar los contratos (en otra terminal):
   ```
   truffle compile
   truffle migrate --network mumbai
   ```

3. Abrir http://localhost:3000 en el navegador.

### Testing

```
truffle test
```

## Roadmap

1. **Fase 1 (Q3 2025)**: MVP con funcionalidades básicas
   - Perfiles de usuario
   - Declaración y validación de habilidades
   - Registro horario básico

2. **Fase 2 (Q4 2025)**: Expansión de funcionalidades
   - Marketplace P2P
   - Integración con plataformas educativas
   - Mejoras en la interfaz gamificada

3. **Fase 3 (Q1 2026)**: Escalabilidad y adopción
   - Herramientas para reclutadores
   - API para integración con sistemas externos
   - Expansión internacional

## Contribución

Las contribuciones son bienvenidas. Por favor, sigue estos pasos:

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add some amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## Licencia

Distribuido bajo la Licencia MIT. Ver `LICENSE` para más información.
