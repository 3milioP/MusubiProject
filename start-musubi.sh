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
    
    # Limpiar puertos
    pkill -f "hardhat node" &>/dev/null
    pkill -f "vite" &>/dev/null
    pkill -f "python.*main.py" &>/dev/null
    
    echo -e "${GREEN}✨ Limpieza completada${NC}"
    exit 0
}
trap cleanup SIGINT SIGTERM ERR EXIT

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
            npm install --silent || { echo -e "${RED}❌ Error instalando dependencias de Hardhat${NC}"; exit 1; }
            echo -e "${GREEN}  ✓ Dependencias de Hardhat instaladas${NC}"
            ;;
        "frontend")
            cd "$PROJECT_DIR/frontend" || exit 1
            if [[ ! -f "package.json" ]]; then
                echo -e "${RED}❌ package.json no encontrado en frontend${NC}"
                exit 1
            fi
            npm install --silent || { echo -e "${RED}❌ Error instalando dependencias del frontend${NC}"; exit 1; }
            echo -e "${GREEN}  ✓ Dependencias del frontend instaladas${NC}"
            ;;
        "api")
            if command -v python3 &> /dev/null && [[ -f "$PROJECT_DIR/musubi-api/requirements.txt" ]]; then
                cd "$PROJECT_DIR/musubi-api" || return 1
                
                # Actualizar pip primero
                echo -e "${BLUE}  📦 Actualizando pip...${NC}"
                python3 -m pip install --upgrade pip --quiet || {
                    echo -e "${YELLOW}⚠️  No se pudo actualizar pip, continuando...${NC}"
                }
                
                # Instalar dependencias con manejo de errores mejorado
                echo -e "${BLUE}  📦 Instalando dependencias de Python...${NC}"
                python3 -m pip install -r requirements.txt --quiet --no-deps || {
                    echo -e "${YELLOW}⚠️  Error con --no-deps, intentando instalación normal...${NC}"
                    python3 -m pip install -r requirements.txt --quiet || {
                        echo -e "${YELLOW}⚠️  Error instalando dependencias de la API${NC}"
                        echo -e "${YELLOW}  💡 Continuando sin APIs REST...${NC}"
                        return 1
                    }
                }
                echo -e "${GREEN}  ✓ Dependencias de la API instaladas${NC}"
            else
                echo -e "${YELLOW}⚠️  Python3 o requirements.txt no encontrado, saltando APIs${NC}"
            fi
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
    
    cd "$PROJECT_DIR/musubi-api" || return 1
    
    # Verificar si ya hay APIs ejecutándose
    if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null; then
        echo -e "${YELLOW}⚠️  Puerto 5000 en uso, deteniendo proceso anterior...${NC}"
        pkill -f "python.*main.py" &>/dev/null
        sleep 2
    fi
    
    # Iniciar APIs en background
    python3 src/main.py > api.log 2>&1 &
    API_PID=$!
    
    # Esperar a que las APIs estén listas
    echo -e "${BLUE}  ⏳ Esperando a que las APIs estén listas...${NC}"
    for i in {1..30}; do
        if curl -s http://localhost:5000/health >/dev/null 2>&1; then
            echo -e "${GREEN}  ✓ APIs listas (PID: $API_PID)${NC}"
            echo -e "${GREEN}  🌐 APIs disponibles en http://localhost:5000${NC}"
            cd "$PROJECT_DIR"
            return 0
        fi
        sleep 1
        echo -n "."
    done
    
    echo -e "\n${YELLOW}⚠️  APIs no respondieron, continuando sin ellas${NC}"
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
            echo -e "${GREEN}  APIs: http://localhost:5000${NC}"
            
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
    echo -e "  ${BLUE}README:${NC} ./README.md"
    echo -e "  ${BLUE}APIs:${NC} http://localhost:5000/docs"
    
    echo -e "\n${RED}🛑 Presiona Ctrl+C para detener todos los servicios${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════════════════════${NC}\n"
}

# =============================================================================
# FUNCIONES DE DESPLIEGUE POR RED
# =============================================================================

deploy_local() {
    echo -e "${BOLD}${BLUE}🏠 DESPLIEGUE LOCAL (HARDHAT)${NC}\n"
    
    install_dependencies "hardhat"
    install_dependencies "frontend"
    install_dependencies "api"
    
    start_hardhat_node || return 1
    
    # Ejecutar tests si están disponibles
    if [[ -d "$PROJECT_DIR/hardhat-dev/test" ]] && ls "$PROJECT_DIR/hardhat-dev/test"/*.js >/dev/null 2>&1; then
        run_tests "local" "all" || {
            echo -e "${YELLOW}⚠️  Tests fallaron, ¿continuar con el despliegue? (y/N)${NC}"
            read -r response
            if [[ ! "$response" =~ ^[Yy]$ ]]; then
                return 1
            fi
        }
    fi
    
    deploy_contracts "local" || return 1
    start_frontend || return 1
    start_apis
    
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
    
    echo -n "  Puerto 5000 (APIs): "
    if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null 2>&1; then
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
    echo -e "${YELLOW}🌐 APIs disponibles en http://localhost:5000${NC}"
    echo -e "${YELLOW}📚 Documentación en http://localhost:5000/docs${NC}"
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
        
        echo -e "  ${BOLD}${PURPLE}🛠️  HERRAMIENTAS${NC}"
        echo -e "  ${BLUE}5)${NC} Ejecutar Solo Tests"
        echo -e "  ${BLUE}6)${NC} Configurar Variables de Entorno"
        echo -e "  ${BLUE}7)${NC} Ver Estado del Sistema"
        echo ""
        
        echo -e "  ${BOLD}${CYAN}🚀 SERVICIOS${NC}"
        echo -e "  ${BLUE}8)${NC} Iniciar Solo Frontend"
        echo -e "  ${BLUE}9)${NC} Iniciar Solo APIs"
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
            6) configure_env_vars ;;
            7) show_system_status ;;
            8) start_frontend_only ;;
            9) start_apis_only ;;
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
    
    check_requirements
    show_main_menu
}

# Ejecutar función principal
main "$@"

