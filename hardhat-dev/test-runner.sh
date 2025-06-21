#!/bin/bash

# =============================================================================
# MUSUBI - Sistema de Tests Inteligente
# Autor: Musubi Team
# Descripción: Script para ejecutar tests adaptativos según red y tipo
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
TEST_DIR="$PROJECT_DIR/test"
RESULTS_DIR="$PROJECT_DIR/test-results"

# =============================================================================
# FUNCIONES UTILITARIAS
# =============================================================================

# Banner del sistema de tests
show_test_banner() {
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                                                                              ║${NC}"
    echo -e "${CYAN}║  ${BOLD}${BLUE}🧪 MUSUBI - Sistema de Tests Inteligente${NC}${CYAN}                                ║${NC}"
    echo -e "${CYAN}║                                                                              ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Crear directorio de resultados
setup_results_dir() {
    mkdir -p "$RESULTS_DIR"
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Iniciando ejecución de tests" > "$RESULTS_DIR/test-session.log"
}

# Verificar requisitos para tests
check_test_requirements() {
    echo -e "${YELLOW}🔍 Verificando requisitos para tests...${NC}"
    
    # Verificar directorio de tests
    if [[ ! -d "$TEST_DIR" ]]; then
        echo -e "${RED}❌ Directorio de tests no encontrado: $TEST_DIR${NC}"
        return 1
    fi
    
    # Verificar archivos de test
    if ! ls "$TEST_DIR"/*.js >/dev/null 2>&1; then
        echo -e "${RED}❌ No se encontraron archivos de test en $TEST_DIR${NC}"
        return 1
    fi
    
    # Verificar Hardhat
    if [[ ! -f "package.json" ]]; then
        echo -e "${RED}❌ package.json no encontrado en directorio actual${NC}"
        return 1
    fi
    
    # Verificar instalación de dependencias
    if [[ ! -d "node_modules" ]]; then
        echo -e "${YELLOW}📦 Instalando dependencias de Hardhat...${NC}"
        npm install --silent || {
            echo -e "${RED}❌ Error instalando dependencias${NC}"
            return 1
        }
    fi
    
    echo -e "${GREEN}✅ Requisitos verificados${NC}"
    return 0
}

# Obtener lista de archivos de test
get_test_files() {
    local test_type=$1
    local files=()
    
    case $test_type in
        "unit")
            # Tests unitarios - archivos que contienen "Unit" o tests básicos
            files=($(find "$TEST_DIR" -name "*.test.js" -o -name "*Unit*.js" | sort))
            ;;
        "integration")
            # Tests de integración - archivos que contienen "Integration"
            files=($(find "$TEST_DIR" -name "*Integration*.js" -o -name "*integration*.js" | sort))
            # Si no hay tests específicos de integración, usar todos
            if [[ ${#files[@]} -eq 0 ]]; then
                files=($(find "$TEST_DIR" -name "*.test.js" | sort))
            fi
            ;;
        "smoke")
            # Smoke tests - tests básicos y críticos
            files=($(find "$TEST_DIR" -name "*Smoke*.js" -o -name "*smoke*.js" | sort))
            # Si no hay smoke tests específicos, usar algunos tests básicos
            if [[ ${#files[@]} -eq 0 ]]; then
                files=($(find "$TEST_DIR" -name "*.test.js" | head -3 | sort))
            fi
            ;;
        "all"|*)
            # Todos los tests
            files=($(find "$TEST_DIR" -name "*.test.js" -o -name "*.js" | grep -E "\.(test|spec)\.js$" | sort))
            ;;
    esac
    
    echo "${files[@]}"
}

# Ejecutar un archivo de test específico
run_single_test() {
    local test_file=$1
    local network=$2
    local timeout_duration=$3
    
    local test_name=$(basename "$test_file" .js)
    echo -e "${BLUE}  🔬 Ejecutando: $test_name${NC}"
    
    # Ya estamos en el directorio correcto (hardhat-dev)
    
    # Configurar timeout y red
    local hardhat_network="localhost"
    case $network in
        "sepolia") hardhat_network="sepolia" ;;
        "polygon-amoy") hardhat_network="polygonAmoy" ;;
        "polygon") hardhat_network="polygon" ;;
    esac
    
    # Ejecutar test con timeout
    local start_time=$(date +%s)
    if timeout "$timeout_duration" npx hardhat test "$test_file" --network "$hardhat_network" > "$RESULTS_DIR/${test_name}.log" 2>&1; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        echo -e "${GREEN}    ✅ $test_name - ${duration}s${NC}"
        echo "PASS,$test_name,$duration" >> "$RESULTS_DIR/test-results.csv"
        return 0
    else
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        echo -e "${RED}    ❌ $test_name - ${duration}s${NC}"
        echo "FAIL,$test_name,$duration" >> "$RESULTS_DIR/test-results.csv"
        
        # Mostrar últimas líneas del error
        echo -e "${YELLOW}    📄 Últimas líneas del error:${NC}"
        tail -n 5 "$RESULTS_DIR/${test_name}.log" | sed 's/^/      /'
        return 1
    fi
}

# Calcular estadísticas de tests
calculate_stats() {
    local results_file="$RESULTS_DIR/test-results.csv"
    
    if [[ ! -f "$results_file" ]]; then
        echo -e "${YELLOW}⚠️  No se encontraron resultados de tests${NC}"
        return
    fi
    
    local total_tests=$(wc -l < "$results_file")
    local passed_tests=$(grep -c "^PASS" "$results_file")
    local failed_tests=$(grep -c "^FAIL" "$results_file")
    local total_time=$(awk -F',' '{sum+=$3} END {print sum}' "$results_file")
    
    local success_rate=0
    if [[ $total_tests -gt 0 ]]; then
        success_rate=$(( (passed_tests * 100) / total_tests ))
    fi
    
    echo -e "\n${CYAN}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                           📊 ${BOLD}ESTADÍSTICAS DE TESTS${NC}${CYAN}                           ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo -e "${YELLOW}📈 Resumen de Ejecución:${NC}"
    echo -e "  ${BLUE}Total de tests:${NC} $total_tests"
    echo -e "  ${GREEN}Tests exitosos:${NC} $passed_tests"
    echo -e "  ${RED}Tests fallidos:${NC} $failed_tests"
    echo -e "  ${PURPLE}Tasa de éxito:${NC} $success_rate%"
    echo -e "  ${CYAN}Tiempo total:${NC} ${total_time}s"
    
    # Mostrar tests fallidos si los hay
    if [[ $failed_tests -gt 0 ]]; then
        echo -e "\n${RED}❌ Tests Fallidos:${NC}"
        grep "^FAIL" "$results_file" | while IFS=',' read -r status test_name duration; do
            echo -e "  ${RED}• $test_name (${duration}s)${NC}"
        done
    fi
    
    echo -e "\n${BLUE}📁 Logs detallados en: $RESULTS_DIR${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════════════════════${NC}\n"
    
    # Retornar código de salida basado en el éxito
    if [[ $failed_tests -eq 0 ]]; then
        return 0
    else
        return 1
    fi
}

# =============================================================================
# FUNCIONES PRINCIPALES DE TESTS
# =============================================================================

# Ejecutar tests por tipo
run_tests_by_type() {
    local test_type=$1
    local network=${2:-"local"}
    local timeout_duration=${3:-300}
    
    echo -e "${BOLD}${BLUE}🧪 Ejecutando Tests: $test_type (Red: $network)${NC}\n"
    
    # Configurar timeout según la red
    case $network in
        "local") timeout_duration=180 ;;      # 3 minutos para local
        "sepolia"|"polygon-amoy") timeout_duration=600 ;;  # 10 minutos para testnet
        "polygon") timeout_duration=900 ;;    # 15 minutos para mainnet
    esac
    
    # Obtener archivos de test
    local test_files=($(get_test_files "$test_type"))
    
    if [[ ${#test_files[@]} -eq 0 ]]; then
        echo -e "${YELLOW}⚠️  No se encontraron tests del tipo: $test_type${NC}"
        return 0
    fi
    
    echo -e "${YELLOW}📋 Tests a ejecutar: ${#test_files[@]}${NC}"
    for file in "${test_files[@]}"; do
        echo -e "  ${BLUE}• $(basename "$file")${NC}"
    done
    echo ""
    
    # Limpiar resultados anteriores
    rm -f "$RESULTS_DIR/test-results.csv"
    echo "status,test_name,duration" > "$RESULTS_DIR/test-results.csv"
    
    # Ejecutar cada test
    local failed_count=0
    for test_file in "${test_files[@]}"; do
        if ! run_single_test "$test_file" "$network" "$timeout_duration"; then
            ((failed_count++))
        fi
    done
    
    # Mostrar estadísticas
    calculate_stats
    
    # Retornar resultado
    if [[ $failed_count -eq 0 ]]; then
        echo -e "${GREEN}🎉 Todos los tests pasaron exitosamente${NC}"
        return 0
    else
        echo -e "${RED}💥 $failed_count tests fallaron${NC}"
        return 1
    fi
}

# Validar tests para despliegue
validate_for_deployment() {
    local network=$1
    
    echo -e "${BOLD}${BLUE}🔍 Validando para despliegue en $network${NC}\n"
    
    local required_success_rate=80
    local test_type="integration"
    
    # Configurar requisitos según la red
    case $network in
        "local")
            required_success_rate=100
            test_type="all"
            echo -e "${YELLOW}📋 Ejecutando todos los tests (100% requerido)${NC}"
            ;;
        "sepolia"|"polygon-amoy")
            required_success_rate=80
            test_type="integration"
            echo -e "${YELLOW}📋 Ejecutando tests de integración (80% requerido)${NC}"
            ;;
        "polygon")
            required_success_rate=95
            test_type="smoke"
            echo -e "${YELLOW}📋 Ejecutando smoke tests (95% requerido)${NC}"
            ;;
    esac
    
    # Ejecutar tests
    if ! run_tests_by_type "$test_type" "$network"; then
        # Calcular tasa de éxito actual
        local results_file="$RESULTS_DIR/test-results.csv"
        if [[ -f "$results_file" ]]; then
            local total_tests=$(wc -l < "$results_file")
            local passed_tests=$(grep -c "^PASS" "$results_file")
            local actual_success_rate=0
            
            if [[ $total_tests -gt 1 ]]; then  # -1 para el header
                total_tests=$((total_tests - 1))
                actual_success_rate=$(( (passed_tests * 100) / total_tests ))
            fi
            
            echo -e "\n${YELLOW}📊 Tasa de éxito: $actual_success_rate% (Requerido: $required_success_rate%)${NC}"
            
            if [[ $actual_success_rate -ge $required_success_rate ]]; then
                echo -e "${GREEN}✅ Validación exitosa para despliegue en $network${NC}"
                return 0
            else
                echo -e "${RED}❌ Validación fallida - Tasa de éxito insuficiente${NC}"
                return 1
            fi
        else
            echo -e "${RED}❌ No se pudieron obtener resultados de tests${NC}"
            return 1
        fi
    else
        echo -e "${GREEN}✅ Validación exitosa para despliegue en $network${NC}"
        return 0
    fi
}

# Análisis de cobertura (solo para local)
run_coverage_analysis() {
    echo -e "${BOLD}${BLUE}📊 Análisis de Cobertura de Código${NC}\n"
    
    cd "$PROJECT_DIR/hardhat-dev" || return 1
    
    # Verificar si solidity-coverage está instalado
    if ! npm list solidity-coverage >/dev/null 2>&1; then
        echo -e "${YELLOW}📦 Instalando solidity-coverage...${NC}"
        npm install --save-dev solidity-coverage --silent || {
            echo -e "${RED}❌ Error instalando solidity-coverage${NC}"
            return 1
        }
    fi
    
    # Ejecutar análisis de cobertura
    echo -e "${YELLOW}🔍 Ejecutando análisis de cobertura...${NC}"
    npx hardhat coverage > "$RESULTS_DIR/coverage.log" 2>&1 || {
        echo -e "${RED}❌ Error en análisis de cobertura${NC}"
        return 1
    }
    
    # Mostrar resumen de cobertura
    if [[ -f "coverage.json" ]]; then
        echo -e "${GREEN}✅ Análisis de cobertura completado${NC}"
        echo -e "${BLUE}📄 Reporte disponible en: coverage/index.html${NC}"
        echo -e "${BLUE}📊 Datos en: coverage.json${NC}"
    else
        echo -e "${YELLOW}⚠️  Análisis completado pero no se generó reporte${NC}"
    fi
    
    cd "$PROJECT_DIR"
}

# Análisis de gas
run_gas_analysis() {
    echo -e "${BOLD}${BLUE}⛽ Análisis de Consumo de Gas${NC}\n"
    
    cd "$PROJECT_DIR/hardhat-dev" || return 1
    
    # Verificar si hardhat-gas-reporter está instalado
    if ! npm list hardhat-gas-reporter >/dev/null 2>&1; then
        echo -e "${YELLOW}📦 Instalando hardhat-gas-reporter...${NC}"
        npm install --save-dev hardhat-gas-reporter --silent || {
            echo -e "${RED}❌ Error instalando hardhat-gas-reporter${NC}"
            return 1
        }
    fi
    
    # Ejecutar tests con reporte de gas
    echo -e "${YELLOW}🔍 Ejecutando análisis de gas...${NC}"
    REPORT_GAS=true npx hardhat test > "$RESULTS_DIR/gas-report.log" 2>&1 || {
        echo -e "${YELLOW}⚠️  Tests completados con algunos errores${NC}"
    }
    
    # Extraer información de gas del log
    if grep -q "gas used" "$RESULTS_DIR/gas-report.log"; then
        echo -e "${GREEN}✅ Análisis de gas completado${NC}"
        echo -e "${BLUE}📄 Reporte detallado en: $RESULTS_DIR/gas-report.log${NC}"
        
        # Mostrar resumen de gas
        echo -e "\n${YELLOW}⛽ Resumen de Gas:${NC}"
        grep -A 10 -B 5 "gas used\|Gas used" "$RESULTS_DIR/gas-report.log" | head -20
    else
        echo -e "${YELLOW}⚠️  No se encontró información de gas en el reporte${NC}"
    fi
    
    cd "$PROJECT_DIR"
}

# =============================================================================
# FUNCIONES DE MENÚ
# =============================================================================

show_test_menu() {
    while true; do
        show_test_banner
        
        echo -e "${YELLOW}Selecciona el tipo de tests a ejecutar:${NC}\n"
        
        echo -e "  ${BOLD}${GREEN}🧪 TESTS POR TIPO${NC}"
        echo -e "  ${BLUE}1)${NC} Tests Unitarios"
        echo -e "  ${BLUE}2)${NC} Tests de Integración"
        echo -e "  ${BLUE}3)${NC} Smoke Tests"
        echo -e "  ${BLUE}4)${NC} Todos los Tests"
        echo ""
        
        echo -e "  ${BOLD}${PURPLE}🔍 ANÁLISIS${NC}"
        echo -e "  ${BLUE}5)${NC} Análisis de Cobertura"
        echo -e "  ${BLUE}6)${NC} Análisis de Gas"
        echo ""
        
        echo -e "  ${BOLD}${CYAN}🚀 VALIDACIÓN${NC}"
        echo -e "  ${BLUE}7)${NC} Validar para Local"
        echo -e "  ${BLUE}8)${NC} Validar para Testnet"
        echo -e "  ${BLUE}9)${NC} Validar para Mainnet"
        echo ""
        
        echo -e "  ${BLUE}0)${NC} Salir"
        echo ""
        echo -n "Selecciona una opción: "
        
        read -r choice
        echo ""
        
        case $choice in
            1) run_tests_by_type "unit" "local" ;;
            2) run_tests_by_type "integration" "local" ;;
            3) run_tests_by_type "smoke" "local" ;;
            4) run_tests_by_type "all" "local" ;;
            5) run_coverage_analysis ;;
            6) run_gas_analysis ;;
            7) validate_for_deployment "local" ;;
            8) validate_for_deployment "sepolia" ;;
            9) validate_for_deployment "polygon" ;;
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
    local test_type=${2:-"all"}
    local network=${3:-"local"}
    
    setup_results_dir
    
    if ! check_test_requirements; then
        exit 1
    fi
    
    case $command in
        "menu")
            show_test_menu
            ;;
        "unit"|"integration"|"smoke"|"all")
            run_tests_by_type "$command" "$network"
            ;;
        "validate")
            validate_for_deployment "$test_type"
            ;;
        "coverage")
            run_coverage_analysis
            ;;
        "gas")
            run_gas_analysis
            ;;
        "stats")
            calculate_stats
            ;;
        *)
            echo -e "${RED}❌ Comando no reconocido: $command${NC}"
            echo -e "${YELLOW}Uso: $0 [menu|unit|integration|smoke|all|validate|coverage|gas|stats] [network] [timeout]${NC}"
            exit 1
            ;;
    esac
}

# Ejecutar función principal
main "$@"

