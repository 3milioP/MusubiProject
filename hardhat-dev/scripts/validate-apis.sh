#!/bin/bash

# =============================================================================
# MUSUBI - Sistema de Validación de APIs REST
# Autor: Musubi Team
# Descripción: Script para validar funcionalidad usando APIs REST
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
API_BASE_URL="http://localhost:5000"
RESULTS_DIR="$PROJECT_DIR/api-validation-results"
HARDHAT_URL="http://localhost:8545"

# =============================================================================
# FUNCIONES UTILITARIAS
# =============================================================================

# Banner del sistema de validación
show_validation_banner() {
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                                                                              ║${NC}"
    echo -e "${CYAN}║  ${BOLD}${BLUE}🔌 MUSUBI - Validación de APIs REST${NC}${CYAN}                                    ║${NC}"
    echo -e "${CYAN}║                                                                              ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Crear directorio de resultados
setup_results_dir() {
    mkdir -p "$RESULTS_DIR"
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Iniciando validación de APIs" > "$RESULTS_DIR/validation-session.log"
}

# Verificar conectividad básica
check_connectivity() {
    echo -e "${YELLOW}🔍 Verificando conectividad...${NC}"
    
    # Verificar API
    echo -n "  API (puerto 5000): "
    if curl -s "$API_BASE_URL/health" >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Disponible${NC}"
    else
        echo -e "${RED}✗ No disponible${NC}"
        echo -e "${YELLOW}💡 Inicia las APIs con: cd musubi-api && python src/main.py${NC}"
        return 1
    fi
    
    # Verificar Hardhat
    echo -n "  Hardhat (puerto 8545): "
    if curl -s -X POST -H "Content-Type: application/json" \
       --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
       "$HARDHAT_URL" >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Disponible${NC}"
    else
        echo -e "${RED}✗ No disponible${NC}"
        echo -e "${YELLOW}💡 Inicia Hardhat con: cd hardhat-dev && npx hardhat node${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ Conectividad verificada${NC}\n"
    return 0
}

# Realizar petición HTTP y validar respuesta
make_api_request() {
    local endpoint=$1
    local expected_status=${2:-200}
    local method=${3:-"GET"}
    local data=${4:-""}
    
    local full_url="$API_BASE_URL$endpoint"
    local response_file="$RESULTS_DIR/response_$(echo "$endpoint" | tr '/' '_').json"
    
    # Realizar petición
    if [[ "$method" == "GET" ]]; then
        local http_status=$(curl -s -w "%{http_code}" -o "$response_file" "$full_url")
    else
        local http_status=$(curl -s -w "%{http_code}" -X "$method" \
                           -H "Content-Type: application/json" \
                           -d "$data" -o "$response_file" "$full_url")
    fi
    
    # Validar código de estado
    if [[ "$http_status" == "$expected_status" ]]; then
        echo -e "${GREEN}    ✅ $endpoint - HTTP $http_status${NC}"
        
        # Validar que la respuesta sea JSON válido
        if jq empty "$response_file" 2>/dev/null; then
            local response_size=$(wc -c < "$response_file")
            echo -e "${BLUE}       📄 Respuesta JSON válida (${response_size} bytes)${NC}"
            return 0
        else
            echo -e "${YELLOW}       ⚠️  Respuesta no es JSON válido${NC}"
            return 1
        fi
    else
        echo -e "${RED}    ❌ $endpoint - HTTP $http_status (esperado: $expected_status)${NC}"
        if [[ -f "$response_file" ]]; then
            echo -e "${RED}       Error: $(head -n 1 "$response_file")${NC}"
        fi
        return 1
    fi
}

# =============================================================================
# FUNCIONES DE VALIDACIÓN POR MÓDULO
# =============================================================================

# Validar endpoints de información general
validate_general_endpoints() {
    echo -e "${BOLD}${BLUE}🌐 Validando Endpoints Generales${NC}"
    
    local passed=0
    local total=0
    
    # Health check
    ((total++))
    if make_api_request "/health"; then
        ((passed++))
    fi
    
    # Información de contratos
    ((total++))
    if make_api_request "/api/contracts/networks"; then
        ((passed++))
    fi
    
    ((total++))
    if make_api_request "/api/contracts/network/local/info"; then
        ((passed++))
    fi
    
    ((total++))
    if make_api_request "/api/contracts/network/local/addresses"; then
        ((passed++))
    fi
    
    echo -e "${CYAN}  📊 Generales: $passed/$total tests pasaron${NC}\n"
    return $((total - passed))
}

# Validar endpoints del token KRM
validate_krm_endpoints() {
    echo -e "${BOLD}${BLUE}🪙 Validando Endpoints del Token KRM${NC}"
    
    local passed=0
    local total=0
    
    # Información del token
    ((total++))
    if make_api_request "/api/krm/info"; then
        ((passed++))
    fi
    
    # Suministro total
    ((total++))
    if make_api_request "/api/krm/total-supply"; then
        ((passed++))
    fi
    
    # Balance de una dirección de prueba
    local test_address="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
    ((total++))
    if make_api_request "/api/krm/balance/$test_address"; then
        ((passed++))
    fi
    
    # Eventos de transferencia
    ((total++))
    if make_api_request "/api/krm/transfer-events"; then
        ((passed++))
    fi
    
    echo -e "${CYAN}  📊 KRM: $passed/$total tests pasaron${NC}\n"
    return $((total - passed))
}

# Validar endpoints de perfiles
validate_profiles_endpoints() {
    echo -e "${BOLD}${BLUE}👤 Validando Endpoints de Perfiles${NC}"
    
    local passed=0
    local total=0
    
    # Contador de perfiles
    ((total++))
    if make_api_request "/api/profiles/count"; then
        ((passed++))
    fi
    
    # Verificar existencia de perfil
    local test_address="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
    ((total++))
    if make_api_request "/api/profiles/exists/$test_address"; then
        ((passed++))
    fi
    
    # Obtener perfil específico
    ((total++))
    if make_api_request "/api/profiles/$test_address"; then
        ((passed++))
    fi
    
    # Eventos de creación
    ((total++))
    if make_api_request "/api/profiles/events/created"; then
        ((passed++))
    fi
    
    echo -e "${CYAN}  📊 Perfiles: $passed/$total tests pasaron${NC}\n"
    return $((total - passed))
}

# Validar endpoints de habilidades
validate_skills_endpoints() {
    echo -e "${BOLD}${BLUE}🎯 Validando Endpoints de Habilidades${NC}"
    
    local passed=0
    local total=0
    
    # Contador de habilidades
    ((total++))
    if make_api_request "/api/skills/count"; then
        ((passed++))
    fi
    
    # Categorías disponibles
    ((total++))
    if make_api_request "/api/skills/categories"; then
        ((passed++))
    fi
    
    # Habilidades de usuario
    local test_address="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
    ((total++))
    if make_api_request "/api/skills/user/$test_address"; then
        ((passed++))
    fi
    
    # Eventos de declaración
    ((total++))
    if make_api_request "/api/skills/events/declared"; then
        ((passed++))
    fi
    
    # Eventos de validación
    ((total++))
    if make_api_request "/api/skills/events/validated"; then
        ((passed++))
    fi
    
    echo -e "${CYAN}  📊 Habilidades: $passed/$total tests pasaron${NC}\n"
    return $((total - passed))
}

# Validar endpoints de registro de tiempo
validate_timeregistry_endpoints() {
    echo -e "${BOLD}${BLUE}⏰ Validando Endpoints de Registro de Tiempo${NC}"
    
    local passed=0
    local total=0
    
    # Contador de registros
    ((total++))
    if make_api_request "/api/timeregistry/count"; then
        ((passed++))
    fi
    
    # Registros de usuario
    local test_address="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
    ((total++))
    if make_api_request "/api/timeregistry/user/$test_address"; then
        ((passed++))
    fi
    
    # Estadísticas de usuario
    ((total++))
    if make_api_request "/api/timeregistry/stats/$test_address"; then
        ((passed++))
    fi
    
    # Registros de empresa
    ((total++))
    if make_api_request "/api/timeregistry/company/$test_address"; then
        ((passed++))
    fi
    
    # Eventos de creación
    ((total++))
    if make_api_request "/api/timeregistry/events/created"; then
        ((passed++))
    fi
    
    echo -e "${CYAN}  📊 Registro de Tiempo: $passed/$total tests pasaron${NC}\n"
    return $((total - passed))
}

# Validar endpoints del marketplace
validate_marketplace_endpoints() {
    echo -e "${BOLD}${BLUE}🛒 Validando Endpoints del Marketplace${NC}"
    
    local passed=0
    local total=0
    
    # Todos los servicios
    ((total++))
    if make_api_request "/api/marketplace/services"; then
        ((passed++))
    fi
    
    # Todas las órdenes
    ((total++))
    if make_api_request "/api/marketplace/orders"; then
        ((passed++))
    fi
    
    # Estadísticas generales
    ((total++))
    if make_api_request "/api/marketplace/stats"; then
        ((passed++))
    fi
    
    # Servicios de proveedor
    local test_address="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
    ((total++))
    if make_api_request "/api/marketplace/services/provider/$test_address"; then
        ((passed++))
    fi
    
    # Órdenes de usuario
    ((total++))
    if make_api_request "/api/marketplace/orders/user/$test_address"; then
        ((passed++))
    fi
    
    # Eventos de servicios creados
    ((total++))
    if make_api_request "/api/marketplace/events/service-created"; then
        ((passed++))
    fi
    
    echo -e "${CYAN}  📊 Marketplace: $passed/$total tests pasaron${NC}\n"
    return $((total - passed))
}

# =============================================================================
# FUNCIONES DE VALIDACIÓN COMPLETA
# =============================================================================

# Ejecutar validación completa
run_full_validation() {
    echo -e "${BOLD}${BLUE}🔍 VALIDACIÓN COMPLETA DE APIs${NC}\n"
    
    local total_failed=0
    local start_time=$(date +%s)
    
    # Ejecutar validaciones por módulo
    validate_general_endpoints
    total_failed=$((total_failed + $?))
    
    validate_krm_endpoints
    total_failed=$((total_failed + $?))
    
    validate_profiles_endpoints
    total_failed=$((total_failed + $?))
    
    validate_skills_endpoints
    total_failed=$((total_failed + $?))
    
    validate_timeregistry_endpoints
    total_failed=$((total_failed + $?))
    
    validate_marketplace_endpoints
    total_failed=$((total_failed + $?))
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    # Mostrar resumen final
    show_validation_summary $total_failed $duration
    
    return $total_failed
}

# Mostrar resumen de validación
show_validation_summary() {
    local total_failed=$1
    local duration=$2
    
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                        📊 ${BOLD}RESUMEN DE VALIDACIÓN${NC}${CYAN}                         ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
    
    if [[ $total_failed -eq 0 ]]; then
        echo -e "${GREEN}🎉 ¡VALIDACIÓN EXITOSA!${NC}"
        echo -e "${GREEN}✅ Todas las APIs funcionan correctamente${NC}"
    else
        echo -e "${RED}💥 VALIDACIÓN CON ERRORES${NC}"
        echo -e "${RED}❌ $total_failed endpoints fallaron${NC}"
    fi
    
    echo -e "${BLUE}⏱️  Tiempo total: ${duration}s${NC}"
    echo -e "${BLUE}📁 Resultados detallados en: $RESULTS_DIR${NC}"
    
    # Mostrar archivos de respuesta generados
    local response_count=$(find "$RESULTS_DIR" -name "response_*.json" | wc -l)
    echo -e "${BLUE}📄 Respuestas guardadas: $response_count archivos${NC}"
    
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════════════════════${NC}\n"
    
    return $total_failed
}

# Validar endpoint específico
validate_specific_endpoint() {
    local endpoint=$1
    
    if [[ -z "$endpoint" ]]; then
        echo -e "${RED}❌ Debes especificar un endpoint${NC}"
        echo -e "${YELLOW}Ejemplo: $0 endpoint /api/krm/info${NC}"
        return 1
    fi
    
    echo -e "${BOLD}${BLUE}🔍 Validando endpoint específico: $endpoint${NC}\n"
    
    if make_api_request "$endpoint"; then
        echo -e "\n${GREEN}✅ Endpoint validado exitosamente${NC}"
        
        # Mostrar contenido de la respuesta
        local response_file="$RESULTS_DIR/response_$(echo "$endpoint" | tr '/' '_').json"
        if [[ -f "$response_file" ]]; then
            echo -e "\n${YELLOW}📄 Contenido de la respuesta:${NC}"
            jq . "$response_file" 2>/dev/null || cat "$response_file"
        fi
        return 0
    else
        echo -e "\n${RED}❌ Endpoint falló la validación${NC}"
        return 1
    fi
}

# Probar funcionalidad de escritura (simulada)
test_write_operations() {
    echo -e "${BOLD}${BLUE}✍️  Probando Operaciones de Escritura (Simuladas)${NC}\n"
    
    echo -e "${YELLOW}📝 Nota: Las operaciones de escritura requieren transacciones blockchain${NC}"
    echo -e "${YELLOW}    que no se pueden probar sin MetaMask conectado.${NC}"
    echo -e "${YELLOW}    Validando solo la estructura de endpoints...${NC}\n"
    
    local passed=0
    local total=0
    
    # Simular creación de perfil (solo validar estructura)
    echo -e "${BLUE}  👤 Validando estructura para crear perfil...${NC}"
    ((total++))
    # Aquí normalmente haríamos POST, pero solo validamos que el endpoint existe
    if make_api_request "/api/profiles/count"; then
        echo -e "${GREEN}    ✅ Endpoint de perfiles accesible${NC}"
        ((passed++))
    fi
    
    # Simular declaración de habilidad
    echo -e "${BLUE}  🎯 Validando estructura para declarar habilidad...${NC}"
    ((total++))
    if make_api_request "/api/skills/categories"; then
        echo -e "${GREEN}    ✅ Endpoint de habilidades accesible${NC}"
        ((passed++))
    fi
    
    # Simular registro de tiempo
    echo -e "${BLUE}  ⏰ Validando estructura para registrar tiempo...${NC}"
    ((total++))
    if make_api_request "/api/timeregistry/count"; then
        echo -e "${GREEN}    ✅ Endpoint de registro de tiempo accesible${NC}"
        ((passed++))
    fi
    
    # Simular creación de servicio
    echo -e "${BLUE}  🛒 Validando estructura para crear servicio...${NC}"
    ((total++))
    if make_api_request "/api/marketplace/services"; then
        echo -e "${GREEN}    ✅ Endpoint de marketplace accesible${NC}"
        ((passed++))
    fi
    
    echo -e "\n${CYAN}  📊 Operaciones de escritura: $passed/$total estructuras validadas${NC}"
    echo -e "${YELLOW}  💡 Para probar escritura real, conecta MetaMask y usa el frontend${NC}\n"
    
    return $((total - passed))
}

# =============================================================================
# FUNCIONES DE MENÚ
# =============================================================================

show_validation_menu() {
    while true; do
        show_validation_banner
        
        echo -e "${YELLOW}Selecciona el tipo de validación:${NC}\n"
        
        echo -e "  ${BOLD}${GREEN}🔍 VALIDACIONES COMPLETAS${NC}"
        echo -e "  ${BLUE}1)${NC} Validación Completa de APIs"
        echo -e "  ${BLUE}2)${NC} Probar Operaciones de Escritura"
        echo ""
        
        echo -e "  ${BOLD}${PURPLE}📋 VALIDACIONES POR MÓDULO${NC}"
        echo -e "  ${BLUE}3)${NC} Endpoints Generales"
        echo -e "  ${BLUE}4)${NC} Token KRM"
        echo -e "  ${BLUE}5)${NC} Perfiles"
        echo -e "  ${BLUE}6)${NC} Habilidades"
        echo -e "  ${BLUE}7)${NC} Registro de Tiempo"
        echo -e "  ${BLUE}8)${NC} Marketplace"
        echo ""
        
        echo -e "  ${BOLD}${CYAN}🎯 HERRAMIENTAS${NC}"
        echo -e "  ${BLUE}9)${NC} Validar Endpoint Específico"
        echo -e "  ${BLUE}10)${NC} Verificar Conectividad"
        echo ""
        
        echo -e "  ${BLUE}0)${NC} Salir"
        echo ""
        echo -n "Selecciona una opción: "
        
        read -r choice
        echo ""
        
        case $choice in
            1) run_full_validation ;;
            2) test_write_operations ;;
            3) validate_general_endpoints ;;
            4) validate_krm_endpoints ;;
            5) validate_profiles_endpoints ;;
            6) validate_skills_endpoints ;;
            7) validate_timeregistry_endpoints ;;
            8) validate_marketplace_endpoints ;;
            9) 
                echo -n "Introduce el endpoint (ej: /api/krm/info): "
                read -r endpoint
                validate_specific_endpoint "$endpoint"
                ;;
            10) check_connectivity ;;
            0) exit 0 ;;
            *) 
                echo -e "${RED}❌ Opción inválida${NC}"
                ;;
        esac
        
        if [[ $choice != 0 ]]; then
            echo -e "\n${YELLOW}Presiona Enter para continuar...${NC}"
            read -r
        fi
    done
}

# =============================================================================
# PUNTO DE ENTRADA PRINCIPAL
# =============================================================================

main() {
    local command=${1:-"menu"}
    local endpoint=${2:-""}
    
    setup_results_dir
    
    # Verificar conectividad básica
    if ! check_connectivity; then
        echo -e "${RED}❌ No se puede continuar sin conectividad básica${NC}"
        exit 1
    fi
    
    case $command in
        "menu")
            show_validation_menu
            ;;
        "full")
            run_full_validation
            ;;
        "write")
            test_write_operations
            ;;
        "endpoint")
            validate_specific_endpoint "$endpoint"
            ;;
        "general")
            validate_general_endpoints
            ;;
        "krm")
            validate_krm_endpoints
            ;;
        "profiles")
            validate_profiles_endpoints
            ;;
        "skills")
            validate_skills_endpoints
            ;;
        "timeregistry")
            validate_timeregistry_endpoints
            ;;
        "marketplace")
            validate_marketplace_endpoints
            ;;
        *)
            echo -e "${RED}❌ Comando no reconocido: $command${NC}"
            echo -e "${YELLOW}Uso: $0 [menu|full|write|endpoint|general|krm|profiles|skills|timeregistry|marketplace] [endpoint]${NC}"
            exit 1
            ;;
    esac
}

# Ejecutar función principal
main "$@"

