#!/bin/bash

# =============================================================================
# MUSUBI - Sistema de Despliegue Centralizado
# Autor: Musubi Team
# Descripción: Script centralizado para desplegar en múltiples redes
# =============================================================================

# Colores para mejor legibilidad
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Variables globales
PROJECT_DIR=$(pwd)
HARDHAT_PID=""
FRONTEND_PID=""
API_PID=""
IPFS_PID=""

# =============================================================================
# FUNCIONES UTILITARIAS
# =============================================================================

# Banner del sistema
show_banner() {
    clear
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                                                                              ║${NC}"
    echo -e "${CYAN}║  ${BOLD}${BLUE}███╗   ███╗██╗   ██╗███████╗██╗   ██╗██████╗ ██╗${NC}${CYAN}                           ║${NC}"
    echo -e "${CYAN}║  ${BOLD}${BLUE}████╗ ████║██║   ██║██╔════╝██║   ██║██╔══██╗██║${NC}${CYAN}                           ║${NC}"
    echo -e "${CYAN}║  ${BOLD}${BLUE}██╔████╔██║██║   ██║███████╗██║   ██║██████╔╝██║${NC}${CYAN}                           ║${NC}"
    echo -e "${CYAN}║  ${BOLD}${BLUE}██║╚██╔╝██║██║   ██║╚════██║██║   ██║██╔══██╗██║${NC}${CYAN}                           ║${NC}"
    echo -e "${CYAN}║  ${BOLD}${BLUE}██║ ╚═╝ ██║╚██████╔╝███████║╚██████╔╝██████╔╝██║${NC}${CYAN}                           ║${NC}"
    echo -e "${CYAN}║  ${BOLD}${BLUE}╚═╝     ╚═╝ ╚═════╝ ╚══════╝ ╚═════╝ ╚═════╝ ╚═╝${NC}${CYAN}                           ║${NC}"
    echo -e "${CYAN}║                                                                              ║${NC}"
    echo -e "${CYAN}║  ${BOLD}${YELLOW}Sistema de Despliegue Centralizado v2.0${NC}${CYAN}                                   ║${NC}"
    echo -e "${CYAN}║  ${PURPLE}Plataforma Descentralizada de Intercambio de Tiempo y Habilidades${NC}${CYAN}        ║${NC}"
    echo -e "${CYAN}║                                                                              ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Función para limpiar procesos al salir
cleanup() {
    echo -e "\n${YELLOW}🧹 Deteniendo servicios...${NC}"
    [[ -n "$HARDHAT_PID" ]] && kill "$HARDHAT_PID" &>/dev/null && echo -e "${GREEN}  ✓ Nodo Hardhat detenido${NC}"
    [[ -n "$FRONTEND_PID" ]] && kill "$FRONTEND_PID" &>/dev/null && echo -e "${GREEN}  ✓ Frontend detenido${NC}"
    [[ -n "$API_PID" ]] && kill "$API_PID" &>/dev/null && echo -e "${GREEN}  ✓ API detenida${NC}"
    [[ -n "$IPFS_PID" ]] && kill "$IPFS_PID" &>/dev/null && echo -e "${GREEN}  ✓ IPFS detenido${NC}"
    
    # Limpiar puertos
    pkill -f "hardhat node" &>/dev/null
    pkill -f "vite" &>/dev/null
    pkill -f "python.*main.py" &>/dev/null
    pkill -f "ipfs daemon" &>/dev/null
    
    echo -e "${GREEN}✨ Limpieza completada${NC}"
    exit 0
}
trap cleanup SIGINT SIGTERM ERR EXIT

# Función para limpiar completamente el sistema antes del despliegue
clean_system() {
    echo -e "${YELLOW}🧹 Limpiando sistema antes del despliegue...${NC}"
    
    # Detener todos los procesos relacionados con Musubi
    echo -e "${BLUE}  🔄 Deteniendo procesos anteriores...${NC}"
    
    # Hardhat
    pkill -f "hardhat node" &>/dev/null
    pkill -f "npx hardhat" &>/dev/null
    
    # Frontend
    pkill -f "vite" &>/dev/null
    pkill -f "npm run dev" &>/dev/null
    
    # API
    pkill -f "python.*main.py" &>/dev/null
    pkill -f "flask" &>/dev/null
    
    # IPFS
    pkill -f "ipfs daemon" &>/dev/null
    
    # Esperar a que los procesos se detengan
    sleep 2
    
    # Verificar que los puertos estén libres
    echo -e "${BLUE}  🔍 Verificando puertos...${NC}"
    
    # Puerto 8545 (Hardhat)
    if lsof -Pi :8545 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}  ⚠️  Puerto 8545 aún ocupado, forzando liberación...${NC}"
        sudo lsof -ti:8545 | xargs kill -9 &>/dev/null || true
    fi
    
    # Puerto 5173 (Frontend)
    if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}  ⚠️  Puerto 5173 aún ocupado, forzando liberación...${NC}"
        sudo lsof -ti:5173 | xargs kill -9 &>/dev/null || true
    fi
    
    # Puerto 5001 (API)
    if lsof -Pi :5001 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}  ⚠️  Puerto 5001 aún ocupado, forzando liberación...${NC}"
        sudo lsof -ti:5001 | xargs kill -9 &>/dev/null || true
    fi
    
    # Puerto 5002 (IPFS)
    if lsof -Pi :5002 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}  ⚠️  Puerto 5002 aún ocupado, forzando liberación...${NC}"
        sudo lsof -ti:5002 | xargs kill -9 &>/dev/null || true
    fi
    
    # Limpiar archivos de log temporales
    echo -e "${BLUE}  🗑️  Limpiando archivos temporales...${NC}"
    rm -f "$PROJECT_DIR/hardhat-dev/hardhat-node.log" &>/dev/null
    rm -f "$PROJECT_DIR/frontend/frontend.log" &>/dev/null
    rm -f "$PROJECT_DIR/musubi-api/api.log" &>/dev/null
    
    echo -e "${GREEN}  ✅ Sistema limpio${NC}\n"
}

# Verificar requisitos del sistema
check_requirements() {
    echo -e "${YELLOW}🔍 Verificando requisitos del sistema...${NC}"
    
    # Verificar Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js no está instalado. Instala Node.js v18 o superior.${NC}"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        echo -e "${RED}❌ Se requiere Node.js v18 o superior. Versión actual: $(node -v)${NC}"
        exit 1
    fi
    echo -e "${GREEN}  ✓ Node.js $(node -v)${NC}"
    
    # Verificar npm
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm no está instalado${NC}"
        exit 1
    fi
    echo -e "${GREEN}  ✓ npm $(npm -v)${NC}"
    
    # Verificar Python (para APIs)
    if ! command -v python3 &> /dev/null; then
        echo -e "${YELLOW}⚠️  Python3 no encontrado - APIs no estarán disponibles${NC}"
    else
        echo -e "${GREEN}  ✓ Python $(python3 --version)${NC}"
    fi
    
    # Verificar Git
    if ! command -v git &> /dev/null; then
        echo -e "${YELLOW}⚠️  Git no encontrado${NC}"
    else
        echo -e "${GREEN}  ✓ Git $(git --version | cut -d' ' -f3)${NC}"
    fi
    
    echo -e "${GREEN}✅ Verificación de requisitos completada${NC}\n"
}

# Verificar y crear archivos de configuración faltantes
check_configuration_files() {
    echo -e "${YELLOW}🔧 Verificando archivos de configuración...${NC}"
    
    local first_run=false
    
    # Verificar .env
    if [[ ! -f "$PROJECT_DIR/.env" ]]; then
        echo -e "${BLUE}  📝 Creando archivo .env de ejemplo...${NC}"
        cat > "$PROJECT_DIR/.env" << 'EOF'
# =============================================================================
# MUSUBI - Variables de Entorno
# =============================================================================

# Clave privada del deployer (sin 0x)
# PRIVATE_KEY=tu_clave_privada_aqui

# Infura Project ID (para redes Ethereum)
# INFURA_PROJECT_ID=tu_infura_project_id_aqui

# Alchemy API Key (alternativa a Infura)
# ALCHEMY_API_KEY=tu_alchemy_api_key_aqui

# Etherscan API Key (para verificación de contratos)
# ETHERSCAN_API_KEY=tu_etherscan_api_key_aqui

# Polygonscan API Key (para verificación en Polygon)
# POLYGONSCAN_API_KEY=tu_polygonscan_api_key_aqui

# Configuración de red
NETWORK=local
CHAIN_ID=31337

# Configuración de gas
GAS_LIMIT=3000000
GAS_PRICE=20000000000

# Configuración de desarrollo
DEBUG=true
LOG_LEVEL=info
EOF
        echo -e "${GREEN}  ✓ Archivo .env creado${NC}"
        first_run=true
    else
        echo -e "${GREEN}  ✓ Archivo .env encontrado${NC}"
    fi
    
    # Verificar .env.example
    if [[ ! -f "$PROJECT_DIR/.env.example" ]]; then
        echo -e "${BLUE}  📝 Creando archivo .env.example...${NC}"
        cp "$PROJECT_DIR/.env" "$PROJECT_DIR/.env.example" 2>/dev/null || {
            cat > "$PROJECT_DIR/.env.example" << 'EOF'
# =============================================================================
# MUSUBI - Variables de Entorno de Ejemplo
# =============================================================================

# Clave privada del deployer (sin 0x)
PRIVATE_KEY=tu_clave_privada_aqui

# Infura Project ID (para redes Ethereum)
INFURA_PROJECT_ID=tu_infura_project_id_aqui

# Alchemy API Key (alternativa a Infura)
ALCHEMY_API_KEY=tu_alchemy_api_key_aqui

# Etherscan API Key (para verificación de contratos)
ETHERSCAN_API_KEY=tu_etherscan_api_key_aqui

# Polygonscan API Key (para verificación en Polygon)
POLYGONSCAN_API_KEY=tu_polygonscan_api_key_aqui

# Configuración de red
NETWORK=local
CHAIN_ID=31337

# Configuración de gas
GAS_LIMIT=3000000
GAS_PRICE=20000000000

# Configuración de desarrollo
DEBUG=true
LOG_LEVEL=info
EOF
        }
        echo -e "${GREEN}  ✓ Archivo .env.example creado${NC}"
        first_run=true
    else
        echo -e "${GREEN}  ✓ Archivo .env.example encontrado${NC}"
    fi
    
    # Verificar archivos de configuración de Hardhat
    if [[ ! -f "$PROJECT_DIR/hardhat-dev/hardhat.config.js" ]]; then
        echo -e "${RED}  ✗ hardhat.config.js no encontrado${NC}"
    else
        echo -e "${GREEN}  ✓ hardhat.config.js encontrado${NC}"
    fi
    
    # Verificar package.json del frontend
    if [[ ! -f "$PROJECT_DIR/frontend/package.json" ]]; then
        echo -e "${RED}  ✗ package.json del frontend no encontrado${NC}"
    else
        echo -e "${GREEN}  ✓ package.json del frontend encontrado${NC}"
    fi
    
    # Verificar requirements.txt de la API
    if [[ ! -f "$PROJECT_DIR/musubi-api/requirements.txt" ]]; then
        echo -e "${YELLOW}  ⚠️  requirements.txt no encontrado (APIs opcionales)${NC}"
    else
        echo -e "${GREEN}  ✓ requirements.txt encontrado${NC}"
    fi
    
    echo -e "${GREEN}✅ Verificación de archivos de configuración completada${NC}\n"
    
    # Retornar si es la primera ejecución
    echo "$first_run"
}

# Verificar si las dependencias están instaladas
check_dependencies_installed() {
    local missing_deps=false
    
    # Verificar Hardhat
    if [[ ! -d "$PROJECT_DIR/hardhat-dev/node_modules" ]]; then
        missing_deps=true
    fi
    
    # Verificar Frontend
    if [[ ! -d "$PROJECT_DIR/frontend/node_modules" ]]; then
        missing_deps=true
    fi
    
    # Verificar API (opcional)
    if command -v python3 &> /dev/null && [[ -f "$PROJECT_DIR/musubi-api/requirements.txt" ]]; then
        # Verificar dependencias específicas de Flask y Web3
        if ! python3 -c "import flask, web3, flasgger" 2>/dev/null; then
            missing_deps=true
        fi
    fi
    
    echo "$missing_deps"
}

# Instalación automática de dependencias si es necesario
auto_install_if_needed() {
    local first_run=$1
    local missing_deps=$2
    
    if [[ "$first_run" == "true" || "$missing_deps" == "true" ]]; then
        echo -e "${YELLOW}🚀 Primera ejecución detectada - Instalando dependencias automáticamente...${NC}"
        echo ""
        
        # Instalar dependencias
        install_dependencies "all" || {
            echo -e "${RED}❌ Error en la instalación automática${NC}"
            echo -e "${YELLOW}💡 Ejecuta manualmente: ./install-musubi.sh${NC}"
            return 1
        }
        
        # Generar ABIs iniciales
        echo -e "${YELLOW}📄 Generando ABIs iniciales...${NC}"
        if [[ -d "$PROJECT_DIR/hardhat-dev" ]]; then
            cd "$PROJECT_DIR/hardhat-dev" || return 1
            
            # Compilar contratos
            echo -e "${BLUE}  📦 Compilando contratos...${NC}"
            npx hardhat compile --force || {
                echo -e "${YELLOW}⚠️  Error en la compilación inicial${NC}"
                echo -e "${YELLOW}  💡 Los ABIs se generarán automáticamente al ejecutar el proyecto${NC}"
                cd "$PROJECT_DIR"
            }
            
            # Generar ABIs
            if [[ -f "./scripts/generate-abis.js" ]]; then
                echo -e "${BLUE}  📄 Generando ABIs...${NC}"
                node ./scripts/generate-abis.js || {
                    echo -e "${YELLOW}⚠️  Error generando ABIs iniciales${NC}"
                    echo -e "${YELLOW}  💡 Los ABIs se generarán automáticamente al ejecutar el proyecto${NC}"
                }
            else
                echo -e "${YELLOW}⚠️  Script generate-abis.js no encontrado${NC}"
                echo -e "${YELLOW}  💡 Los ABIs se generarán automáticamente al ejecutar el proyecto${NC}"
            fi
            
            cd "$PROJECT_DIR"
        fi
        
        echo -e "${GREEN}✅ Instalación automática completada${NC}"
        echo -e "${BLUE}🎉 ¡Musubi está listo para usar!${NC}"
        echo ""
    fi
}

# Verificar variables de entorno para redes externas
check_env_vars() {
    local network=$1
    case $network in
        "sepolia"|"polygon-amoy"|"polygon")
            if [[ -z "$PRIVATE_KEY" ]]; then
                echo -e "${RED}❌ PRIVATE_KEY no configurada para red $network${NC}"
                echo -e "${YELLOW}💡 Configura las variables de entorno primero (opción 6)${NC}"
                return 1
            fi
            
            if [[ -z "$INFURA_PROJECT_ID" && -z "$ALCHEMY_API_KEY" ]]; then
                echo -e "${RED}❌ Necesitas INFURA_PROJECT_ID o ALCHEMY_API_KEY para $network${NC}"
                echo -e "${YELLOW}💡 Configura las variables de entorno primero (opción 6)${NC}"
                return 1
            fi
            ;;
    esac
    return 0
}

# Instalar dependencias
install_dependencies() {
    local component=$1
    echo -e "${YELLOW}📦 Instalando dependencias de $component...${NC}"
    
    case $component in
        "hardhat")
            cd "$PROJECT_DIR/hardhat-dev" || exit 1
            if [[ ! -f "package.json" ]]; then
                echo -e "${RED}❌ package.json no encontrado en hardhat-dev${NC}"
                exit 1
            fi
            
            # Verificar si node_modules ya existe
            if [[ -d "node_modules" ]]; then
                echo -e "${BLUE}  📁 node_modules encontrado, verificando dependencias...${NC}"
                # Verificar si hay dependencias faltantes
                if npm ls --depth=0 >/dev/null 2>&1; then
                    echo -e "${GREEN}  ✓ Dependencias de Hardhat ya instaladas${NC}"
                    cd "$PROJECT_DIR"
                    return 0
                else
                    echo -e "${YELLOW}  ⚠️  Dependencias incompletas, reinstalando...${NC}"
                fi
            fi
            
            echo -e "${BLUE}  📦 Instalando dependencias...${NC}"
            npm install --silent || { 
                echo -e "${RED}❌ Error instalando dependencias de Hardhat${NC}"
                echo -e "${YELLOW}💡 Intenta ejecutar 'npm install' manualmente en hardhat-dev${NC}"
                cd "$PROJECT_DIR"
                exit 1
            }
            echo -e "${GREEN}  ✓ Dependencias de Hardhat instaladas${NC}"
            ;;
        "frontend")
            cd "$PROJECT_DIR/frontend" || exit 1
            if [[ ! -f "package.json" ]]; then
                echo -e "${RED}❌ package.json no encontrado en frontend${NC}"
                exit 1
            fi
            
            # Verificar si node_modules ya existe
            if [[ -d "node_modules" ]]; then
                echo -e "${BLUE}  📁 node_modules encontrado, verificando dependencias...${NC}"
                # Verificar si hay dependencias faltantes
                if npm ls --depth=0 >/dev/null 2>&1; then
                    echo -e "${GREEN}  ✓ Dependencias del frontend ya instaladas${NC}"
                    cd "$PROJECT_DIR"
                    return 0
                else
                    echo -e "${YELLOW}  ⚠️  Dependencias incompletas, reinstalando...${NC}"
                fi
            fi
            
            echo -e "${BLUE}  📦 Instalando dependencias...${NC}"
            npm install --silent || { 
                echo -e "${RED}❌ Error instalando dependencias del frontend${NC}"
                echo -e "${YELLOW}💡 Intenta ejecutar 'npm install' manualmente en frontend${NC}"
                cd "$PROJECT_DIR"
                exit 1
            }
            echo -e "${GREEN}  ✓ Dependencias del frontend instaladas${NC}"
            ;;
        "api")
            if ! command -v python3 &> /dev/null; then
                echo -e "${YELLOW}⚠️  Python3 no disponible, saltando APIs${NC}"
                return 0
            fi
            
            if [[ ! -f "$PROJECT_DIR/musubi-api/requirements.txt" ]]; then
                echo -e "${YELLOW}⚠️  requirements.txt no encontrado, saltando APIs${NC}"
                return 0
            fi
            
            cd "$PROJECT_DIR/musubi-api" || return 1
            
            # Verificar si ya hay un entorno virtual
            if [[ -d ".venv" ]] || [[ -d "venv" ]] || [[ -d "env" ]]; then
                echo -e "${BLUE}  📁 Entorno virtual encontrado, verificando dependencias...${NC}"
                # Activar entorno virtual si existe
                if [[ -d ".venv" ]]; then
                    source .venv/bin/activate 2>/dev/null || true
                elif [[ -d "venv" ]]; then
                    source venv/bin/activate 2>/dev/null || true
                elif [[ -d "env" ]]; then
                    source env/bin/activate 2>/dev/null || true
                fi
                
                # Verificar si las dependencias están instaladas
                if python3 -c "import flask, web3" 2>/dev/null; then
                    echo -e "${GREEN}  ✓ Dependencias de la API ya instaladas${NC}"
                    cd "$PROJECT_DIR"
                    return 0
                else
                    echo -e "${YELLOW}  ⚠️  Dependencias incompletas, reinstalando...${NC}"
                fi
            fi
            
            # Actualizar pip primero
            echo -e "${BLUE}  📦 Actualizando pip...${NC}"
            python3 -m pip install --upgrade pip --quiet || {
                echo -e "${YELLOW}⚠️  No se pudo actualizar pip, continuando...${NC}"
            }
            
            # Instalar dependencias con manejo de errores mejorado
            echo -e "${BLUE}  📦 Instalando dependencias de Python...${NC}"
            
            # Intentar instalar dependencias una por una para mejor manejo de errores
            while IFS= read -r package; do
                # Ignorar líneas vacías y comentarios
                [[ -z "$package" || "$package" =~ ^[[:space:]]*# ]] && continue
                
                # Extraer nombre del paquete (antes del ==)
                package_name=$(echo "$package" | cut -d'=' -f1 | cut -d'<' -f1 | cut -d'>' -f1 | xargs)
                
                echo -e "${BLUE}    📦 Instalando $package_name...${NC}"
                python3 -m pip install "$package" --quiet || {
                    echo -e "${YELLOW}    ⚠️  Error instalando $package_name, intentando versión más flexible...${NC}"
                    # Intentar instalar sin versión específica
                    python3 -m pip install "$package_name" --quiet || {
                        echo -e "${YELLOW}    ⚠️  No se pudo instalar $package_name, continuando...${NC}"
                    }
                }
            done < requirements.txt
            
            # Verificar instalación final
            if python3 -c "import flask, web3" 2>/dev/null; then
                echo -e "${GREEN}  ✓ Dependencias de la API instaladas${NC}"
            else
                echo -e "${YELLOW}⚠️  Algunas dependencias de la API no se instalaron correctamente${NC}"
                echo -e "${YELLOW}💡 Intenta ejecutar 'pip install -r requirements.txt' manualmente${NC}"
                cd "$PROJECT_DIR"
                return 1
            fi
            ;;
        "ipfs")
            echo -e "${BLUE}  🌐 Verificando IPFS...${NC}"
            
            # Verificar si IPFS ya está instalado
            if command -v ipfs &> /dev/null; then
                echo -e "${GREEN}  ✓ IPFS ya está instalado: $(ipfs --version | head -n1)${NC}"
                return 0
            fi
            
            # Detectar sistema operativo
            if [[ "$OSTYPE" == "darwin"* ]]; then
                echo -e "${BLUE}  📦 Instalando IPFS en macOS...${NC}"
                if command -v brew &> /dev/null; then
                    brew install ipfs || {
                        echo -e "${YELLOW}⚠️  Error instalando IPFS con Homebrew${NC}"
                        echo -e "${YELLOW}💡 Intenta ejecutar 'brew install ipfs' manualmente${NC}"
                        return 1
                    }
                else
                    echo -e "${YELLOW}⚠️  Homebrew no encontrado, no se puede instalar IPFS automáticamente${NC}"
                    echo -e "${YELLOW}💡 Instala Homebrew o IPFS manualmente desde https://ipfs.io/docs/install/${NC}"
                    return 1
                fi
            elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
                echo -e "${BLUE}  📦 Instalando IPFS en Linux...${NC}"
                # Descargar e instalar IPFS
                curl -L https://dist.ipfs.io/go-ipfs/v0.35.0/go-ipfs_v0.35.0_linux-amd64.tar.gz | tar -xz
                cd go-ipfs
                sudo bash install.sh
                cd ..
                rm -rf go-ipfs
            else
                echo -e "${YELLOW}⚠️  Sistema operativo no soportado para instalación automática de IPFS${NC}"
                echo -e "${YELLOW}💡 Instala IPFS manualmente desde https://ipfs.io/docs/install/${NC}"
                return 1
            fi
            
            echo -e "${GREEN}  ✓ IPFS instalado exitosamente${NC}"
            ;;
        "all")
            echo -e "${YELLOW}📦 Instalando todas las dependencias...${NC}"
            install_dependencies "hardhat"
            install_dependencies "frontend"
            install_dependencies "api"
            install_dependencies "ipfs"
            echo -e "${GREEN}✅ Todas las dependencias instaladas${NC}"
            ;;
        *)
            echo -e "${RED}❌ Componente no reconocido: $component${NC}"
            return 1
            ;;
    esac
    cd "$PROJECT_DIR"
}

# Ejecutar tests
run_tests() {
    local network=$1
    local test_type=${2:-"all"}
    
    echo -e "${YELLOW}🧪 Ejecutando tests para red $network (tipo: $test_type)...${NC}"
    
    cd "$PROJECT_DIR/hardhat-dev" || exit 1
    
    # Función para ejecutar comando con timeout usando bash
    run_with_timeout() {
        local timeout_duration=$1
        shift
        local cmd="$@"
        
        # Verificar si timeout está disponible
        if command -v timeout >/dev/null 2>&1; then
            timeout $timeout_duration $cmd
        else
            # Alternativa sin timeout - ejecutar directamente
            echo -e "${YELLOW}  ⚠️  Comando timeout no disponible, ejecutando sin límite de tiempo...${NC}"
            $cmd
        fi
    }
    
    # Configurar timeout según la red
    local timeout_duration=300  # 5 minutos por defecto
    case $network in
        "local") timeout_duration=180 ;;      # 3 minutos para local
        "sepolia"|"polygon-amoy") timeout_duration=600 ;;  # 10 minutos para testnet
        "polygon") timeout_duration=900 ;;    # 15 minutos para mainnet
    esac
    
    # Ejecutar tests según el tipo
    case $test_type in
        "unit")
            echo -e "${BLUE}  🔬 Ejecutando tests unitarios...${NC}"
            run_with_timeout $timeout_duration npx hardhat test --grep "Unit" || return 1
            ;;
        "integration")
            echo -e "${BLUE}  🔗 Ejecutando tests de integración...${NC}"
            run_with_timeout $timeout_duration npx hardhat test --grep "Integration" || return 1
            ;;
        "smoke")
            echo -e "${BLUE}  💨 Ejecutando smoke tests...${NC}"
            run_with_timeout $timeout_duration npx hardhat test --grep "Smoke" || return 1
            ;;
        "all"|*)
            echo -e "${BLUE}  🧪 Ejecutando todos los tests...${NC}"
            run_with_timeout $timeout_duration npx hardhat test || return 1
            ;;
    esac
    
    echo -e "${GREEN}✅ Tests completados exitosamente${NC}"
    cd "$PROJECT_DIR"
}

# Desplegar contratos
deploy_contracts() {
    local network=$1
    echo -e "${YELLOW}🚀 Desplegando contratos en red $network...${NC}"
    
    cd "$PROJECT_DIR/hardhat-dev" || exit 1
    
    # Limpiar despliegues anteriores para la red
    if [[ -d "./ignition/deployments/chain-31337" && "$network" == "local" ]]; then
        rm -rf ./ignition/deployments/chain-31337
        echo -e "${BLUE}  🧹 Limpiando despliegues anteriores...${NC}"
    fi
    
    # Configurar red para el despliegue
    local hardhat_network=""
    case $network in
        "local") hardhat_network="localhost" ;;
        "sepolia") hardhat_network="sepolia" ;;
        "polygon-amoy") hardhat_network="polygonAmoy" ;;
        "polygon") hardhat_network="polygon" ;;
        *) echo -e "${RED}❌ Red no soportada: $network${NC}"; return 1 ;;
    esac
    
    # Desplegar usando Ignition
    if [[ -f "./ignition/modules/deploy.js" ]]; then
        npx hardhat ignition deploy ./ignition/modules/deploy.js --network $hardhat_network || {
            echo -e "${RED}❌ Error en el despliegue${NC}"
            return 1
        }
    else
        echo -e "${RED}❌ Archivo de despliegue no encontrado: ./ignition/modules/deploy.js${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ Contratos desplegados exitosamente en $network${NC}"
    cd "$PROJECT_DIR"
}

# Función para sincronizar direcciones de contratos con la API
sync_contract_addresses() {
    local network=$1
    echo -e "${YELLOW}🔄 Sincronizando direcciones de contratos con la API...${NC}"
    
    if [ ! -f "$PROJECT_DIR/musubi-api/sync_contract_addresses.py" ]; then
        echo -e "${YELLOW}⚠️  Script de sincronización no encontrado, saltando${NC}"
        return 0
    fi
    
    cd "$PROJECT_DIR/musubi-api" || return 1
    
    # Ejecutar script de sincronización
    if python3 sync_contract_addresses.py; then
        echo -e "${GREEN}✅ Direcciones sincronizadas para red: $network${NC}"
        cd "$PROJECT_DIR"
        return 0
    else
        echo -e "${RED}❌ Error sincronizando direcciones${NC}"
        cd "$PROJECT_DIR"
        return 1
    fi
}

# Iniciar nodo local
start_hardhat_node() {
    echo -e "${YELLOW}🌐 Iniciando nodo Hardhat local...${NC}"
    
    cd "$PROJECT_DIR/hardhat-dev" || exit 1
    
    # Verificar si ya hay un nodo ejecutándose
    if lsof -Pi :8545 -sTCP:LISTEN -t >/dev/null; then
        echo -e "${YELLOW}⚠️  Puerto 8545 en uso, deteniendo proceso anterior...${NC}"
        pkill -f "hardhat node" &>/dev/null
        sleep 2
    fi
    
    # Iniciar nodo en background
    npx hardhat node > hardhat-node.log 2>&1 &
    HARDHAT_PID=$!
    
    # Esperar a que el nodo esté listo
    echo -e "${BLUE}  ⏳ Esperando a que el nodo esté listo...${NC}"
    for i in {1..30}; do
        if curl -s -X POST -H "Content-Type: application/json" \
           --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
           http://localhost:8545 >/dev/null 2>&1; then
            echo -e "${GREEN}  ✓ Nodo Hardhat listo (PID: $HARDHAT_PID)${NC}"
            cd "$PROJECT_DIR"
            return 0
        fi
        sleep 1
        echo -n "."
    done
    
    echo -e "\n${RED}❌ Timeout esperando el nodo Hardhat${NC}"
    if [[ -f "hardhat-node.log" ]]; then
        echo -e "${RED}Log de error:${NC}"
        tail -n 10 hardhat-node.log
    fi
    return 1
}

# Iniciar frontend
start_frontend() {
    echo -e "${YELLOW}🎨 Iniciando frontend...${NC}"
    
    cd "$PROJECT_DIR/frontend" || exit 1
    
    # Verificar si ya hay un frontend ejecutándose
    if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null || lsof -Pi :5174 -sTCP:LISTEN -t >/dev/null || lsof -Pi :5175 -sTCP:LISTEN -t >/dev/null; then
        echo -e "${YELLOW}⚠️  Puerto de frontend en uso, deteniendo proceso anterior...${NC}"
        pkill -f "vite" &>/dev/null
        sleep 2
    fi
    
    # Iniciar frontend en background
    npm run dev > frontend.log 2>&1 &
    FRONTEND_PID=$!
    
    # Esperar a que el frontend esté listo
    echo -e "${BLUE}  ⏳ Esperando a que el frontend esté listo...${NC}"
    for i in {1..60}; do
        if grep -q "Local:" frontend.log 2>/dev/null; then
            local port_line=$(grep "Local:" frontend.log | head -1)
            echo -e "${GREEN}  ✓ Frontend listo (PID: $FRONTEND_PID)${NC}"
            echo -e "${GREEN}  🌐 $port_line${NC}"
            cd "$PROJECT_DIR"
            return 0
        fi
        sleep 1
        if (( i % 10 == 0 )); then
            echo -n "."
        fi
    done
    
    echo -e "\n${RED}❌ Timeout esperando el frontend${NC}"
    if [[ -f "frontend.log" ]]; then
        echo -e "${RED}Log de error:${NC}"
        tail -n 10 frontend.log
    fi
    return 1
}

# Iniciar APIs
start_apis() {
    echo -e "${YELLOW}🔌 Iniciando APIs REST...${NC}"
    
    if ! command -v python3 &> /dev/null; then
        echo -e "${YELLOW}⚠️  Python3 no disponible, saltando APIs${NC}"
        return 0
    fi
    
    if [[ ! -f "$PROJECT_DIR/musubi-api/src/main.py" ]]; then
        echo -e "${YELLOW}⚠️  APIs no encontradas, saltando${NC}"
        return 0
    fi
    
    cd "$PROJECT_DIR/musubi-api/src"
    python3 main.py > ../api.log 2>&1 &
    API_PID=$!
    echo -e "${GREEN}  ✓ API lanzada en segundo plano (PID $API_PID)${NC}"
    cd "$PROJECT_DIR"
    
    # Esperar a que la API esté disponible
    sleep 5
    
    # Ejecutar tests automáticos de la API
    if [[ -d "$PROJECT_DIR/musubi-api/src/tests" ]]; then
      echo -e "${YELLOW}🧪 Ejecutando tests automáticos de la API (pytest)...${NC}"
      python3 -m pytest $PROJECT_DIR/musubi-api/src/tests/ | tee $PROJECT_DIR/musubi-api/api-tests.log
      if [[ $? -ne 0 ]]; then
        echo -e "${RED}❌ Algunos tests de la API han fallado. ¿Deseas continuar con el despliegue? (y/N)${NC}"
        read -r continuar
        if [[ ! $continuar =~ ^[Yy]$ ]]; then
          echo -e "${RED}Despliegue abortado por fallo en tests de la API.${NC}"
          cleanup
          exit 1
        fi
      else
        echo -e "${GREEN}✅ Todos los tests de la API pasaron correctamente.${NC}"
      fi
    fi
    
    # Esperar a que las APIs estén listas (más tiempo para Python)
    echo -e "${BLUE}  ⏳ Esperando a que las APIs estén listas...${NC}"
    for i in {1..60}; do
        if curl -s http://localhost:5001/health >/dev/null 2>&1; then
            echo -e "${GREEN}  ✓ APIs listas (PID: $API_PID)${NC}"
            echo -e "${GREEN}  🌐 APIs disponibles en http://localhost:5001${NC}"
            echo -e "${BLUE}  📚 Documentación Swagger: http://localhost:5001/docs${NC}"
            cd "$PROJECT_DIR"
            return 0
        fi
        
        # Verificar si el proceso sigue vivo
        if ! kill -0 $API_PID 2>/dev/null; then
            echo -e "\n${RED}❌ La API se detuvo inesperadamente${NC}"
            if [[ -f "api.log" ]]; then
                echo -e "${RED}Log de error:${NC}"
                tail -n 20 api.log
            fi
            cd "$PROJECT_DIR"
            return 1
        fi
        
        sleep 1
        if (( i % 10 == 0 )); then
            echo -n "."
        fi
    done
    
    echo -e "\n${YELLOW}⚠️  APIs no respondieron después de 60 segundos${NC}"
    if [[ -f "api.log" ]]; then
        echo -e "${YELLOW}Últimas líneas del log:${NC}"
        tail -n 10 api.log
    fi
    
    # Intentar matar el proceso si no responde
    kill $API_PID &>/dev/null
    
    cd "$PROJECT_DIR"
    return 0
}

# Mostrar información de conexión
show_connection_info() {
    local network=$1
    
    echo -e "\n${CYAN}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                        🎉 ${BOLD}MUSUBI DESPLEGADO EXITOSAMENTE${NC}${CYAN} 🎉                        ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
    
    case $network in
        "local")
            echo -e "\n${YELLOW}🌐 Información de Conexión:${NC}"
            if [[ -f "$PROJECT_DIR/frontend/frontend.log" ]]; then
                local frontend_url=$(grep -o 'http://localhost:[0-9]*' "$PROJECT_DIR/frontend/frontend.log" | head -1)
                echo -e "${GREEN}  Frontend: $frontend_url${NC}"
            fi
            echo -e "${GREEN}  Blockchain: http://localhost:8545${NC}"
            echo -e "${GREEN}  Chain ID: 31337${NC}"
            echo -e "${GREEN}  APIs: http://localhost:5001${NC}"
            
            echo -e "\n${YELLOW}🦊 Configuración de MetaMask:${NC}"
            echo -e "  ${BLUE}Nombre:${NC} Musubi Local"
            echo -e "  ${BLUE}RPC URL:${NC} http://localhost:8545"
            echo -e "  ${BLUE}Chain ID:${NC} 31337"
            echo -e "  ${BLUE}Símbolo:${NC} KRM"
            
            echo -e "\n${YELLOW}🔑 Cuentas de Prueba:${NC}"
            echo -e "  ${BLUE}Cuenta 1:${NC} 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
            echo -e "  ${BLUE}Clave:${NC} 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
            ;;
        "sepolia")
            echo -e "\n${YELLOW}🌐 Red Sepolia Testnet:${NC}"
            echo -e "${GREEN}  Chain ID: 11155111${NC}"
            echo -e "${GREEN}  Explorer: https://sepolia.etherscan.io${NC}"
            ;;
        "polygon-amoy")
            echo -e "\n${YELLOW}🌐 Red Polygon Amoy Testnet:${NC}"
            echo -e "${GREEN}  Chain ID: 80002${NC}"
            echo -e "${GREEN}  Explorer: https://amoy.polygonscan.com${NC}"
            ;;
        "polygon")
            echo -e "\n${YELLOW}🌐 Red Polygon Mainnet:${NC}"
            echo -e "${GREEN}  Chain ID: 137${NC}"
            echo -e "${GREEN}  Explorer: https://polygonscan.com${NC}"
            ;;
    esac
    
    echo -e "\n${YELLOW}📚 Documentación:${NC}"
    echo -e "  ${BLUE}README.md:${NC} ./README.md"
    echo -e "  ${BLUE}APIs:${NC} http://localhost:5001/docs"
    
    echo -e "\n${RED}🛑 Presiona Ctrl+C para detener todos los servicios${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════════════════════${NC}\n"
}

# =============================================================================
# FUNCIONES DE DESPLIEGUE POR RED
# =============================================================================

deploy_local() {
    echo -e "${BOLD}${BLUE}🏠 DESPLIEGUE LOCAL (HARDHAT)${NC}\n"
    
    # Limpiar sistema antes del despliegue
    clean_system
    
    # Verificar requisitos
    check_requirements
    
    # Verificar configuración
    local first_run=$(check_configuration_files)
    local missing_deps=$(check_dependencies_installed)
    
    # Instalar dependencias si es necesario
    if [[ "$first_run" == "true" || "$missing_deps" == "true" ]]; then
        echo -e "${YELLOW}📦 Instalando dependencias necesarias...${NC}"
        install_dependencies "hardhat" || return 1
        install_dependencies "frontend" || return 1
        install_dependencies "api" || return 1
        install_dependencies "ipfs" || return 1
    else
        echo -e "${GREEN}✅ Todas las dependencias están instaladas${NC}"
    fi
    
    # Iniciar IPFS si está disponible
    if command -v ipfs &> /dev/null; then
        echo -e "${BLUE}🌐 Iniciando IPFS...${NC}"
        # Verificar si IPFS ya está corriendo
        if ! pgrep -f "ipfs daemon" > /dev/null; then
            echo -e "${BLUE}  🚀 Iniciando daemon de IPFS...${NC}"
            ipfs daemon &
            IPFS_PID=$!
            sleep 3
            if kill -0 $IPFS_PID 2>/dev/null; then
                echo -e "${GREEN}  ✓ IPFS iniciado (PID: $IPFS_PID)${NC}"
            else
                echo -e "${YELLOW}  ⚠️  IPFS no se pudo iniciar, continuando sin él${NC}"
            fi
        else
            echo -e "${GREEN}  ✓ IPFS ya está corriendo${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  IPFS no está instalado, continuando sin almacenamiento descentralizado${NC}"
    fi
    
    # Iniciar nodo Hardhat
    start_hardhat_node || return 1
    
    # Ejecutar tests si están disponibles
    if [[ -d "$PROJECT_DIR/hardhat-dev/test" ]] && ls "$PROJECT_DIR/hardhat-dev/test"/*.js >/dev/null 2>&1; then
        echo -e "${YELLOW}🧪 Ejecutando tests antes del despliegue...${NC}"
        run_tests "local" "all" || {
            echo -e "${YELLOW}⚠️  Tests fallaron, ¿continuar con el despliegue? (y/N)${NC}"
            read -r response
            if [[ ! "$response" =~ ^[Yy]$ ]]; then
                return 1
            fi
        }
    fi
    
    # Desplegar contratos
    deploy_contracts "local" || return 1
    
    # Sincronizar direcciones con la API
    sync_contract_addresses "local" || {
        echo -e "${YELLOW}⚠️  Sincronización falló, continuando sin ella${NC}"
    }
    
    # Iniciar frontend
    start_frontend || return 1
    
    # Iniciar APIs
    start_apis
    
    # Mostrar información de conexión
    show_connection_info "local"
    
    # Esperar hasta que el usuario termine
    wait $FRONTEND_PID
}

deploy_sepolia() {
    echo -e "${BOLD}${BLUE}🧪 DESPLIEGUE SEPOLIA TESTNET${NC}\n"
    
    check_env_vars "sepolia" || return 1
    
    echo -e "${YELLOW}⚠️  Vas a desplegar en Sepolia Testnet. ¿Continuar? (y/N)${NC}"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        return 0
    fi
    
    install_dependencies "hardhat"
    
    # Tests básicos para testnet
    if [[ -d "$PROJECT_DIR/hardhat-dev/test" ]]; then
        run_tests "sepolia" "integration" || {
            echo -e "${YELLOW}⚠️  Tests fallaron, ¿continuar? (y/N)${NC}"
            read -r response
            if [[ ! "$response" =~ ^[Yy]$ ]]; then
                return 1
            fi
        }
    fi
    
    deploy_contracts "sepolia" || return 1
    
    # Sincronizar direcciones con la API
    sync_contract_addresses "sepolia" || {
        echo -e "${YELLOW}⚠️  Sincronización falló, continuando sin ella${NC}"
    }
    
    show_connection_info "sepolia"
    echo -e "${GREEN}✅ Despliegue en Sepolia completado${NC}"
}

deploy_polygon_amoy() {
    echo -e "${BOLD}${BLUE}🔗 DESPLIEGUE POLYGON AMOY TESTNET${NC}\n"
    
    check_env_vars "polygon-amoy" || return 1
    
    echo -e "${YELLOW}⚠️  Vas a desplegar en Polygon Amoy Testnet. ¿Continuar? (y/N)${NC}"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        return 0
    fi
    
    install_dependencies "hardhat"
    
    # Tests básicos para testnet
    if [[ -d "$PROJECT_DIR/hardhat-dev/test" ]]; then
        run_tests "polygon-amoy" "integration" || {
            echo -e "${YELLOW}⚠️  Tests fallaron, ¿continuar? (y/N)${NC}"
            read -r response
            if [[ ! "$response" =~ ^[Yy]$ ]]; then
                return 1
            fi
        }
    fi
    
    deploy_contracts "polygon-amoy" || return 1
    
    # Sincronizar direcciones con la API
    sync_contract_addresses "polygon-amoy" || {
        echo -e "${YELLOW}⚠️  Sincronización falló, continuando sin ella${NC}"
    }
    
    show_connection_info "polygon-amoy"
    echo -e "${GREEN}✅ Despliegue en Polygon Amoy completado${NC}"
}

deploy_polygon_mainnet() {
    echo -e "${BOLD}${BLUE}🌐 DESPLIEGUE POLYGON MAINNET${NC}\n"
    
    check_env_vars "polygon" || return 1
    
    echo -e "${RED}⚠️  ¡ATENCIÓN! Vas a desplegar en POLYGON MAINNET (PRODUCCIÓN)${NC}"
    echo -e "${RED}   Esto utilizará MATIC reales y es irreversible.${NC}"
    echo -e "${YELLOW}   ¿Estás completamente seguro? Escribe 'DEPLOY' para continuar:${NC}"
    read -r response
    if [[ "$response" != "DEPLOY" ]]; then
        echo -e "${BLUE}Despliegue cancelado${NC}"
        return 0
    fi
    
    install_dependencies "hardhat"
    
    # Tests críticos para mainnet
    if [[ -d "$PROJECT_DIR/hardhat-dev/test" ]]; then
        echo -e "${YELLOW}🧪 Ejecutando tests críticos antes del despliegue en mainnet...${NC}"
        run_tests "polygon" "smoke" || {
            echo -e "${RED}❌ Tests críticos fallaron. Despliegue abortado por seguridad.${NC}"
            return 1
        }
    fi
    
    deploy_contracts "polygon" || return 1
    
    # Sincronizar direcciones con la API
    sync_contract_addresses "polygon" || {
        echo -e "${YELLOW}⚠️  Sincronización falló, continuando sin ella${NC}"
    }
    
    show_connection_info "polygon"
    echo -e "${GREEN}✅ Despliegue en Polygon Mainnet completado${NC}"
}

# =============================================================================
# FUNCIONES DE MENÚ
# =============================================================================

run_tests_only() {
    echo -e "${BOLD}${BLUE}🧪 EJECUTAR TESTS${NC}\n"
    
    if [[ ! -d "$PROJECT_DIR/hardhat-dev/test" ]]; then
        echo -e "${RED}❌ Directorio de tests no encontrado${NC}"
        return 1
    fi
    
    install_dependencies "hardhat"
    
    echo -e "${YELLOW}Selecciona el tipo de tests:${NC}"
    echo -e "  ${BLUE}1)${NC} Tests unitarios"
    echo -e "  ${BLUE}2)${NC} Tests de integración"
    echo -e "  ${BLUE}3)${NC} Smoke tests"
    echo -e "  ${BLUE}4)${NC} Todos los tests"
    echo -e "  ${BLUE}0)${NC} Volver al menú principal"
    echo ""
    echo -n "Selecciona una opción: "
    read -r choice
    
    case $choice in
        1) run_tests "local" "unit" ;;
        2) run_tests "local" "integration" ;;
        3) run_tests "local" "smoke" ;;
        4) run_tests "local" "all" ;;
        0) return 0 ;;
        *) echo -e "${RED}❌ Opción inválida${NC}" ;;
    esac
}

# Nueva función: Limpiar sistema
cleanup_system() {
    echo -e "${BOLD}${BLUE}🧹 LIMPIEZA DEL SISTEMA${NC}\n"
    
    echo -e "${YELLOW}¿Qué quieres limpiar?${NC}"
    echo -e "  ${BLUE}1)${NC} Solo logs y archivos temporales"
    echo -e "  ${BLUE}2)${NC} Logs, temporales y cache"
    echo -e "  ${BLUE}3)${NC} Limpieza completa (incluye node_modules)"
    echo -e "  ${BLUE}0)${NC} Volver al menú principal"
    echo ""
    echo -n "Selecciona una opción: "
    read -r choice
    
    case $choice in
        1)
            echo -e "${YELLOW}🧹 Limpiando logs y archivos temporales...${NC}"
            find . -name "*.log" -delete 2>/dev/null
            find . -name "*.tmp" -delete 2>/dev/null
            find . -name "*.temp" -delete 2>/dev/null
            find . -name ".DS_Store" -delete 2>/dev/null
            echo -e "${GREEN}  ✓ Limpieza básica completada${NC}"
            ;;
        2)
            echo -e "${YELLOW}🧹 Limpiando logs, temporales y cache...${NC}"
            find . -name "*.log" -delete 2>/dev/null
            find . -name "*.tmp" -delete 2>/dev/null
            find . -name "*.temp" -delete 2>/dev/null
            find . -name ".DS_Store" -delete 2>/dev/null
            rm -rf hardhat-dev/cache/ 2>/dev/null
            rm -rf hardhat-dev/artifacts/ 2>/dev/null
            rm -rf frontend/.vite/ 2>/dev/null
            rm -rf .cache/ 2>/dev/null
            echo -e "${GREEN}  ✓ Limpieza con cache completada${NC}"
            ;;
        3)
            echo -e "${RED}⚠️  ¡ATENCIÓN! Esto eliminará todas las dependencias.${NC}"
            echo -e "${YELLOW}¿Estás seguro? Escribe 'SI' para confirmar:${NC}"
            read -r confirm
            if [[ "$confirm" == "SI" ]]; then
                echo -e "${YELLOW}🧹 Limpieza completa en progreso...${NC}"
                rm -rf hardhat-dev/node_modules/ 2>/dev/null
                rm -rf frontend/node_modules/ 2>/dev/null
                rm -rf hardhat-dev/cache/ 2>/dev/null
                rm -rf hardhat-dev/artifacts/ 2>/dev/null
                rm -rf frontend/.vite/ 2>/dev/null
                find . -name "*.log" -delete 2>/dev/null
                find . -name "*.tmp" -delete 2>/dev/null
                find . -name "*.temp" -delete 2>/dev/null
                find . -name ".DS_Store" -delete 2>/dev/null
                echo -e "${GREEN}  ✓ Limpieza completa completada${NC}"
                echo -e "${YELLOW}  💡 Ejecuta el script nuevamente para reinstalar dependencias${NC}"
            else
                echo -e "${BLUE}Limpieza cancelada${NC}"
            fi
            ;;
        0) return 0 ;;
        *) echo -e "${RED}❌ Opción inválida${NC}" ;;
    esac
}

# Nueva función: Generar ABIs
generate_abis() {
    echo -e "${BOLD}${BLUE}📄 GENERAR ABIs${NC}\n"
    
    if [[ ! -d "$PROJECT_DIR/hardhat-dev" ]]; then
        echo -e "${RED}❌ Directorio hardhat-dev no encontrado${NC}"
        return 1
    fi
    
    install_dependencies "hardhat"
    
    cd "$PROJECT_DIR/hardhat-dev" || return 1
    
    echo -e "${YELLOW}📦 Compilando contratos...${NC}"
    npx hardhat compile --force || {
        echo -e "${RED}❌ Error en la compilación${NC}"
        cd "$PROJECT_DIR"
        return 1
    }
    
    echo -e "${YELLOW}📄 Generando ABIs...${NC}"
    if [[ -f "./scripts/generate-abis.js" ]]; then
        node ./scripts/generate-abis.js || {
            echo -e "${RED}❌ Error generando ABIs${NC}"
            cd "$PROJECT_DIR"
            return 1
        }
    else
        echo -e "${YELLOW}⚠️  Script generate-abis.js no encontrado, generando manualmente...${NC}"
        # Generar ABIs manualmente si no existe el script
        npx hardhat export-abi --export-all --output abis.json || {
            echo -e "${RED}❌ Error exportando ABIs${NC}"
            cd "$PROJECT_DIR"
            return 1
        }
    fi
    
    echo -e "${GREEN}✅ ABIs generados exitosamente${NC}"
    echo -e "${BLUE}📁 Archivo: hardhat-dev/abis.json${NC}"
    
    cd "$PROJECT_DIR"
}

# Nueva función: Configurar MetaMask
configure_metamask() {
    echo -e "${BOLD}${BLUE}🦊 CONFIGURAR METAMASK${NC}\n"
    
    echo -e "${YELLOW}Configuración para red local:${NC}"
    echo -e "${BLUE}Nombre de la Red:${NC} Musubi Local"
    echo -e "${BLUE}RPC URL:${NC} http://localhost:8545"
    echo -e "${BLUE}Chain ID:${NC} 31337"
    echo -e "${BLUE}Símbolo de Moneda:${NC} ETH"
    echo -e "${BLUE}Explorer:${NC} (dejar vacío)"
    echo ""
    
    echo -e "${YELLOW}Cuentas de prueba disponibles:${NC}"
    echo -e "${BLUE}Cuenta 1:${NC} 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
    echo -e "${BLUE}Clave Privada:${NC} 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
    echo -e "${BLUE}Balance:${NC} 10000 ETH"
    echo ""
    
    echo -e "${YELLOW}Cuenta 2:${NC} 0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
    echo -e "${BLUE}Clave Privada:${NC} 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
    echo -e "${BLUE}Balance:${NC} 10000 ETH"
    echo ""
    
    echo -e "${GREEN}✅ Configuración de MetaMask mostrada${NC}"
    echo -e "${YELLOW}💡 Importa las cuentas usando las claves privadas para probar el sistema${NC}"
}

# Nueva función: Ejecutar pruebas UX
run_ux_tests() {
    echo -e "${BOLD}${BLUE}🎯 PRUEBAS DE EXPERIENCIA DE USUARIO${NC}\n"
    
    if [[ ! -f "$PROJECT_DIR/hardhat-dev/scripts/test-user-experience.sh" ]]; then
        echo -e "${RED}❌ Script de pruebas UX no encontrado${NC}"
        return 1
    fi
    
    
    echo -e "${YELLOW}¿Qué tipo de pruebas quieres ejecutar?${NC}"
    echo -e "  ${BLUE}1)${NC} Pruebas manuales (guiadas)"
    echo -e "  ${BLUE}2)${NC} Pruebas automatizadas"
    echo -e "  ${BLUE}3)${NC} Pruebas de optimización"
    echo -e "  ${BLUE}0)${NC} Volver al menú principal"
    echo ""
    echo -n "Selecciona una opción: "
    read -r choice
    
    case $choice in
        1)
            echo -e "${YELLOW}🎯 Ejecutando pruebas manuales...${NC}"
            bash "$PROJECT_DIR/hardhat-dev/scripts/test-user-experience.sh" manual || {
                echo -e "${RED}❌ Error en pruebas manuales${NC}"
                return 1
            }
            ;;
        2)
            echo -e "${YELLOW}🤖 Ejecutando pruebas automatizadas...${NC}"
            bash "$PROJECT_DIR/hardhat-dev/scripts/test-user-experience.sh" automated || {
                echo -e "${RED}❌ Error en pruebas automatizadas${NC}"
                return 1
            }
            ;;
        3)
            echo -e "${YELLOW}⚡ Ejecutando pruebas de optimización...${NC}"
            bash "$PROJECT_DIR/hardhat-dev/scripts/test-user-experience.sh" optimization || {
                echo -e "${RED}❌ Error en pruebas de optimización${NC}"
                return 1
            }
            ;;
        0) return 0 ;;
        *) echo -e "${RED}❌ Opción inválida${NC}" ;;
    esac
}

# Nueva función: Gestión de configuración
manage_configuration() {
    echo -e "${BOLD}${BLUE}⚙️  GESTIÓN DE CONFIGURACIÓN${NC}\n"
    
    echo -e "${YELLOW}¿Qué quieres gestionar?${NC}"
    echo -e "  ${BLUE}1)${NC} Ver configuración actual"
    echo -e "  ${BLUE}2)${NC} Crear configuración de ejemplo"
    echo -e "  ${BLUE}3)${NC} Validar configuración"
    echo -e "  ${BLUE}4)${NC} Restaurar configuración por defecto"
    echo -e "  ${BLUE}0)${NC} Volver al menú principal"
    echo ""
    echo -n "Selecciona una opción: "
    read -r choice
    
    case $choice in
        1)
            echo -e "${YELLOW}📋 Configuración actual:${NC}"
            if [[ -f "$PROJECT_DIR/.env" ]]; then
                echo -e "${GREEN}  ✓ Archivo .env encontrado${NC}"
                echo -e "${BLUE}  📄 Contenido:${NC}"
                cat "$PROJECT_DIR/.env" | grep -v "^#" | grep -v "^$" || echo "  (vacío)"
            else
                echo -e "${RED}  ✗ Archivo .env no encontrado${NC}"
            fi
            
            echo -e "\n${YELLOW}📁 Archivos de configuración:${NC}"
            ls -la "$PROJECT_DIR"/*.config.* 2>/dev/null || echo "  No se encontraron archivos de configuración"
            ;;
        2)
            echo -e "${YELLOW}📝 Creando configuración de ejemplo...${NC}"
            cat > "$PROJECT_DIR/.env.example" << 'EOF'
# =============================================================================
# MUSUBI - Variables de Entorno de Ejemplo
# =============================================================================

# Clave privada del deployer (sin 0x)
PRIVATE_KEY=tu_clave_privada_aqui

# Infura Project ID (para redes Ethereum)
INFURA_PROJECT_ID=tu_infura_project_id_aqui

# Alchemy API Key (alternativa a Infura)
ALCHEMY_API_KEY=tu_alchemy_api_key_aqui

# Etherscan API Key (para verificación de contratos)
ETHERSCAN_API_KEY=tu_etherscan_api_key_aqui

# Polygonscan API Key (para verificación en Polygon)
POLYGONSCAN_API_KEY=tu_polygonscan_api_key_aqui

# Configuración de red
NETWORK=local
CHAIN_ID=31337

# Configuración de gas
GAS_LIMIT=3000000
GAS_PRICE=20000000000

# Configuración de desarrollo
DEBUG=true
LOG_LEVEL=info
EOF
            echo -e "${GREEN}  ✓ Archivo .env.example creado${NC}"
            echo -e "${YELLOW}  💡 Copia .env.example a .env y configura tus valores${NC}"
            ;;
        3)
            echo -e "${YELLOW}🔍 Validando configuración...${NC}"
            local errors=0
            
            # Verificar archivos necesarios
            if [[ ! -f "$PROJECT_DIR/hardhat-dev/hardhat.config.js" ]]; then
                echo -e "${RED}  ✗ hardhat.config.js no encontrado${NC}"
                ((errors++))
            else
                echo -e "${GREEN}  ✓ hardhat.config.js encontrado${NC}"
            fi
            
            if [[ ! -f "$PROJECT_DIR/frontend/package.json" ]]; then
                echo -e "${RED}  ✗ package.json del frontend no encontrado${NC}"
                ((errors++))
            else
                echo -e "${GREEN}  ✓ package.json del frontend encontrado${NC}"
            fi
            
            if [[ ! -f "$PROJECT_DIR/musubi-api/requirements.txt" ]]; then
                echo -e "${YELLOW}  ⚠️  requirements.txt no encontrado (APIs opcionales)${NC}"
            else
                echo -e "${GREEN}  ✓ requirements.txt encontrado${NC}"
            fi
            
            if [[ $errors -eq 0 ]]; then
                echo -e "${GREEN}✅ Configuración válida${NC}"
            else
                echo -e "${RED}❌ Se encontraron $errors errores${NC}"
            fi
            ;;
        4)
            echo -e "${RED}⚠️  ¿Estás seguro de restaurar la configuración por defecto?${NC}"
            echo -e "${YELLOW}Esto eliminará tu archivo .env actual. Escribe 'RESTORE' para confirmar:${NC}"
            read -r confirm
            if [[ "$confirm" == "RESTORE" ]]; then
                if [[ -f "$PROJECT_DIR/.env" ]]; then
                    mv "$PROJECT_DIR/.env" "$PROJECT_DIR/.env.backup"
                    echo -e "${GREEN}  ✓ Archivo .env respaldado como .env.backup${NC}"
                fi
                echo -e "${GREEN}  ✓ Configuración restaurada${NC}"
            else
                echo -e "${BLUE}Restauración cancelada${NC}"
            fi
            ;;
        0) return 0 ;;
        *) echo -e "${RED}❌ Opción inválida${NC}" ;;
    esac
}

# Nueva función: Información del proyecto
show_project_info() {
    echo -e "${BOLD}${BLUE}📚 INFORMACIÓN DEL PROYECTO${NC}\n"
    
    echo -e "${YELLOW}🎯 Descripción:${NC}"
    echo -e "  Musubi es una plataforma descentralizada para el intercambio de tiempo"
    echo -e "  y habilidades, similar a LinkedIn pero con validación blockchain."
    echo ""
    
    echo -e "${YELLOW}🏗️  Arquitectura:${NC}"
    echo -e "  ${BLUE}• Smart Contracts:${NC} Solidity (Hardhat)"
    echo -e "  ${BLUE}• Frontend:${NC} React + TypeScript + Vite"
    echo -e "  ${BLUE}• APIs:${NC} Python + FastAPI"
    echo -e "  ${BLUE}• Blockchain:${NC} Ethereum/Polygon"
    echo ""
    
    echo -e "${YELLOW}📁 Estructura del Proyecto:${NC}"
    echo -e "  ${BLUE}• contracts/:${NC} Smart contracts fuente"
    echo -e "  ${BLUE}• hardhat-dev/:${NC} Configuración y tests de Hardhat"
    echo -e "  ${BLUE}• frontend/:${NC} Aplicación React"
    echo -e "  ${BLUE}• musubi-api/:${NC} APIs REST"
    echo ""
    
    echo -e "${YELLOW}🚀 Funcionalidades Principales:${NC}"
    echo -e "  ${BLUE}•${NC} Registro de perfiles profesionales y empresas"
    echo -e "  ${BLUE}•${NC} Sistema de skills validadas como NFTs"
    echo -e "  ${BLUE}•${NC} Registro y validación de tiempo trabajado"
    echo -e "  ${BLUE}•${NC} Marketplace P2P de servicios"
    echo -e "  ${BLUE}•${NC} Token KRM con sistema de reflexión"
    echo ""
    
    echo -e "${YELLOW}📖 Documentación:${NC}"
    echo -e "  ${BLUE}• README.md:${NC} Guía principal del proyecto"
    echo -e "  ${BLUE}• INICIO_RAPIDO.md:${NC} Guía de inicio rápido"
    echo -e "  ${BLUE}• GUIA_PRUEBAS_USUARIO.md:${NC} Guía de pruebas UX"
    echo ""
    
    echo -e "${YELLOW}🔗 Enlaces Útiles:${NC}"
    echo -e "  ${BLUE}• Frontend:${NC} http://localhost:5173 (cuando esté ejecutándose)"
    echo -e "  ${BLUE}• APIs:${NC} http://localhost:5001 (cuando esté ejecutándose)"
    echo -e "  ${BLUE}• Blockchain:${NC} http://localhost:8545 (cuando esté ejecutándose)"
}

configure_env_vars() {
    echo -e "${BOLD}${BLUE}🔧 CONFIGURAR VARIABLES DE ENTORNO${NC}\n"
    
    local env_file="$PROJECT_DIR/.env"
    
    echo -e "${YELLOW}Configurando variables de entorno para redes externas...${NC}\n"
    
    # PRIVATE_KEY
    echo -e "${BLUE}🔑 Clave Privada del Deployer:${NC}"
    echo -n "PRIVATE_KEY (deja vacío para mantener actual): "
    read -r private_key
    if [[ -n "$private_key" ]]; then
        if grep -q "PRIVATE_KEY=" "$env_file" 2>/dev/null; then
            sed -i "s/PRIVATE_KEY=.*/PRIVATE_KEY=$private_key/" "$env_file"
        else
            echo "PRIVATE_KEY=$private_key" >> "$env_file"
        fi
        echo -e "${GREEN}  ✓ PRIVATE_KEY configurada${NC}"
    fi
    
    # INFURA_PROJECT_ID
    echo -e "\n${BLUE}🌐 Infura Project ID:${NC}"
    echo -n "INFURA_PROJECT_ID (deja vacío para mantener actual): "
    read -r infura_id
    if [[ -n "$infura_id" ]]; then
        if grep -q "INFURA_PROJECT_ID=" "$env_file" 2>/dev/null; then
            sed -i "s/INFURA_PROJECT_ID=.*/INFURA_PROJECT_ID=$infura_id/" "$env_file"
        else
            echo "INFURA_PROJECT_ID=$infura_id" >> "$env_file"
        fi
        echo -e "${GREEN}  ✓ INFURA_PROJECT_ID configurada${NC}"
    fi
    
    # ETHERSCAN_API_KEY
    echo -e "\n${BLUE}🔍 Etherscan API Key (para verificación):${NC}"
    echo -n "ETHERSCAN_API_KEY (deja vacío para mantener actual): "
    read -r etherscan_key
    if [[ -n "$etherscan_key" ]]; then
        if grep -q "ETHERSCAN_API_KEY=" "$env_file" 2>/dev/null; then
            sed -i "s/ETHERSCAN_API_KEY=.*/ETHERSCAN_API_KEY=$etherscan_key/" "$env_file"
        else
            echo "ETHERSCAN_API_KEY=$etherscan_key" >> "$env_file"
        fi
        echo -e "${GREEN}  ✓ ETHERSCAN_API_KEY configurada${NC}"
    fi
    
    # POLYGONSCAN_API_KEY
    echo -e "\n${BLUE}🔍 Polygonscan API Key (para verificación):${NC}"
    echo -n "POLYGONSCAN_API_KEY (deja vacío para mantener actual): "
    read -r polygonscan_key
    if [[ -n "$polygonscan_key" ]]; then
        if grep -q "POLYGONSCAN_API_KEY=" "$env_file" 2>/dev/null; then
            sed -i "s/POLYGONSCAN_API_KEY=.*/POLYGONSCAN_API_KEY=$polygonscan_key/" "$env_file"
        else
            echo "POLYGONSCAN_API_KEY=$polygonscan_key" >> "$env_file"
        fi
        echo -e "${GREEN}  ✓ POLYGONSCAN_API_KEY configurada${NC}"
    fi
    
    echo -e "\n${GREEN}✅ Configuración de variables de entorno completada${NC}"
    echo -e "${BLUE}📄 Archivo de configuración: $env_file${NC}"
    
    # Cargar variables
    if [[ -f "$env_file" ]]; then
        export $(grep -v '^#' "$env_file" | xargs)
        echo -e "${GREEN}  ✓ Variables cargadas en la sesión actual${NC}"
    fi
}

show_system_status() {
    echo -e "${BOLD}${BLUE}📊 ESTADO DEL SISTEMA${NC}\n"
    
    # Estado de puertos
    echo -e "${YELLOW}🌐 Estado de Puertos:${NC}"
    echo -n "  Puerto 8545 (Hardhat): "
    if lsof -Pi :8545 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Activo${NC}"
    else
        echo -e "${RED}✗ Inactivo${NC}"
    fi
    
    echo -n "  Puerto 5173-5175 (Frontend): "
    if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1 || lsof -Pi :5174 -sTCP:LISTEN -t >/dev/null 2>&1 || lsof -Pi :5175 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Activo${NC}"
    else
        echo -e "${RED}✗ Inactivo${NC}"
    fi
    
    echo -n "  Puerto 5001 (APIs): "
    if lsof -Pi :5001 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Activo${NC}"
    else
        echo -e "${RED}✗ Inactivo${NC}"
    fi
    
    # Estado de procesos
    echo -e "\n${YELLOW}⚙️  Estado de Procesos:${NC}"
    echo -n "  Hardhat Node: "
    if pgrep -f "hardhat node" >/dev/null; then
        echo -e "${GREEN}✓ Ejecutándose${NC}"
    else
        echo -e "${RED}✗ Detenido${NC}"
    fi
    
    echo -n "  Frontend (Vite): "
    if pgrep -f "vite" >/dev/null; then
        echo -e "${GREEN}✓ Ejecutándose${NC}"
    else
        echo -e "${RED}✗ Detenido${NC}"
    fi
    
    echo -n "  APIs (Python): "
    if pgrep -f "python.*main.py" >/dev/null; then
        echo -e "${GREEN}✓ Ejecutándose${NC}"
    else
        echo -e "${RED}✗ Detenido${NC}"
    fi
    
    # Variables de entorno
    echo -e "\n${YELLOW}🔧 Variables de Entorno:${NC}"
    echo -n "  PRIVATE_KEY: "
    if [[ -n "$PRIVATE_KEY" ]]; then
        echo -e "${GREEN}✓ Configurada${NC}"
    else
        echo -e "${RED}✗ No configurada${NC}"
    fi
    
    echo -n "  INFURA_PROJECT_ID: "
    if [[ -n "$INFURA_PROJECT_ID" ]]; then
        echo -e "${GREEN}✓ Configurada${NC}"
    else
        echo -e "${RED}✗ No configurada${NC}"
    fi
    
    # Información del proyecto
    echo -e "\n${YELLOW}📁 Información del Proyecto:${NC}"
    echo -e "  Directorio: $PROJECT_DIR"
    echo -e "  Git Branch: $(git branch --show-current 2>/dev/null || echo 'N/A')"
    echo -e "  Git Commit: $(git rev-parse --short HEAD 2>/dev/null || echo 'N/A')"
    
    echo ""
}

start_frontend_only() {
    echo -e "${BOLD}${BLUE}🎨 INICIAR SOLO FRONTEND${NC}\n"
    
    install_dependencies "frontend"
    start_frontend || return 1
    
    echo -e "${GREEN}✅ Frontend iniciado exitosamente${NC}"
    echo -e "${YELLOW}🌐 Accede a la aplicación desde tu navegador${NC}"
    echo -e "${RED}🛑 Presiona Ctrl+C para detener${NC}\n"
    
    wait $FRONTEND_PID
}

start_apis_only() {
    echo -e "${BOLD}${BLUE}🔌 INICIAR SOLO APIS${NC}\n"
    
    install_dependencies "api"
    start_apis || return 1
    
    echo -e "${GREEN}✅ APIs iniciadas exitosamente${NC}"
    echo -e "${YELLOW}🌐 APIs disponibles en http://localhost:5001${NC}"
    echo -e "${YELLOW}📚 Documentación en http://localhost:5001/docs${NC}"
    echo -e "${RED}🛑 Presiona Ctrl+C para detener${NC}\n"
    
    wait $API_PID
}

# Menú principal
show_main_menu() {
    while true; do
        show_banner
        
        echo -e "${YELLOW}Selecciona una opción de despliegue:${NC}\n"
        
        echo -e "  ${BOLD}${GREEN}🏠 DESPLIEGUES${NC}"
        echo -e "  ${BLUE}1)${NC} Despliegue Local (Hardhat)"
        echo -e "  ${BLUE}2)${NC} Despliegue Testnet Sepolia"
        echo -e "  ${BLUE}3)${NC} Despliegue Testnet Polygon Amoy"
        echo -e "  ${BLUE}4)${NC} Despliegue Mainnet Polygon"
        echo ""
        
        echo -e "  ${BOLD}${PURPLE}🛠️  HERRAMIENTAS DE DESARROLLO${NC}"
        echo -e "  ${BLUE}5)${NC} Ejecutar Solo Tests"
        echo -e "  ${BLUE}6)${NC} Generar ABIs"
        echo -e "  ${BLUE}7)${NC} Configurar Variables de Entorno"
        echo -e "  ${BLUE}8)${NC} Gestionar Configuración"
        echo ""
        
        echo -e "  ${BOLD}${CYAN}🚀 SERVICIOS${NC}"
        echo -e "  ${BLUE}9)${NC} Iniciar Solo Frontend"
        echo -e "  ${BLUE}10)${NC} Iniciar Solo APIs"
        echo ""
        
        echo -e "  ${BOLD}${YELLOW}🔧 MANTENIMIENTO${NC}"
        echo -e "  ${BLUE}11)${NC} Limpiar Sistema"
        echo -e "  ${BLUE}12)${NC} Ver Estado del Sistema"
        echo ""
        
        echo -e "  ${BOLD}${BLUE}🎯 PRUEBAS Y VALIDACIÓN${NC}"
        echo -e "  ${BLUE}13)${NC} Pruebas de Experiencia de Usuario"
        echo -e "  ${BLUE}14)${NC} Configurar MetaMask"
        echo ""
        
        echo -e "  ${BOLD}${GREEN}📚 INFORMACIÓN${NC}"
        echo -e "  ${BLUE}15)${NC} Información del Proyecto"
        echo ""
        
        echo -e "  ${BLUE}0)${NC} Salir"
        echo ""
        echo -n "Selecciona una opción: "
        
        read -r choice
        echo ""
        
        case $choice in
            1) deploy_local ;;
            2) deploy_sepolia ;;
            3) deploy_polygon_amoy ;;
            4) deploy_polygon_mainnet ;;
            5) run_tests_only ;;
            6) generate_abis ;;
            7) configure_env_vars ;;
            8) manage_configuration ;;
            9) start_frontend_only ;;
            10) start_apis_only ;;
            11) cleanup_system ;;
            12) show_system_status ;;
            13) run_ux_tests ;;
            14) configure_metamask ;;
            15) show_project_info ;;
            0) 
                echo -e "${GREEN}¡Hasta luego! 👋${NC}"
                exit 0
                ;;
            *) 
                echo -e "${RED}❌ Opción inválida. Presiona Enter para continuar...${NC}"
                read -r
                ;;
        esac
        
        if [[ $choice != 0 ]]; then
            echo -e "\n${YELLOW}Presiona Enter para volver al menú principal...${NC}"
            read -r
        fi
    done
}

# =============================================================================
# PUNTO DE ENTRADA PRINCIPAL
# =============================================================================

main() {
    # Cargar variables de entorno si existen
    if [[ -f "$PROJECT_DIR/.env" ]]; then
        export $(grep -v '^#' "$PROJECT_DIR/.env" | xargs) 2>/dev/null
    fi
    
    # Verificar que estamos en el directorio correcto
    if [[ ! -f "$PROJECT_DIR/start-musubi.sh" ]]; then
        echo -e "${RED}❌ Error: Ejecuta este script desde el directorio raíz del proyecto${NC}"
        echo -e "${YELLOW}💡 Asegúrate de estar en el directorio que contiene start-musubi.sh${NC}"
        exit 1
    fi
    
    # Verificar requisitos del sistema
    check_requirements
    
    # Verificar configuración y detectar primera ejecución
    local first_run=$(check_configuration_files)
    
    # Verificar si las dependencias están instaladas
    local missing_deps=$(check_dependencies_installed)
    
    # Instalación automática si es necesario
    auto_install_if_needed "$first_run" "$missing_deps" || {
        echo -e "${RED}❌ Error en la configuración automática${NC}"
        exit 1
    }
    
    # Mostrar información de bienvenida
    if [[ "$first_run" == "true" ]]; then
        echo -e "${GREEN}🎉 ¡Bienvenido a Musubi!${NC}"
        echo -e "${BLUE}📚 Para más información, selecciona la opción 15 (Información del Proyecto)${NC}"
        echo -e "${YELLOW}💡 Recomendación: Comienza con la opción 1 (Despliegue Local)${NC}"
        echo ""
    else
        echo -e "${GREEN}🎉 ¡Bienvenido de vuelta a Musubi!${NC}"
        echo -e "${BLUE}📚 Para más información, selecciona la opción 15 (Información del Proyecto)${NC}"
        echo ""
    fi
    
    # Mostrar menú principal
    show_main_menu
}

# Ejecutar función principal
main "$@"
