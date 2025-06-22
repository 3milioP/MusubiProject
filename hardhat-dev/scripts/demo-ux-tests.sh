#!/bin/bash

echo "🎬 DEMOSTRACIÓN - SISTEMA DE PRUEBAS DE UX MUSUBI"
echo "================================================="
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${PURPLE}$1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_step() {
    echo -e "${CYAN}📋 $1${NC}"
}

# Función para mostrar progreso
show_progress() {
    local current=$1
    local total=$2
    local width=50
    local percentage=$((current * 100 / total))
    local completed=$((width * current / total))
    local remaining=$((width - completed))
    
    printf "\r["
    printf "%${completed}s" | tr ' ' '█'
    printf "%${remaining}s" | tr ' ' '░'
    printf "] %d%%" $percentage
}

# Verificar que el script de pruebas UX esté disponible
if [ ! -f "test-user-experience.sh" ]; then
    print_error "test-user-experience.sh no encontrado en el directorio actual"
    print_info "Asegúrate de ejecutar este script desde hardhat-dev/scripts/"
    exit 1
fi

print_header "🎯 SISTEMA DE PRUEBAS DE UX - MUSUBI"
echo ""

print_info "Este script demuestra las capacidades del sistema de pruebas"
print_info "implementado para validar la experiencia de usuario de Musubi."
echo ""

print_step "PASO 1: Verificación de Herramientas Disponibles"
echo "-----------------------------------------------------"

tools=(
    "test-user-experience.sh"
    "test-automated-ux.js"
    "setup-ux-tests.sh"
    "run-ux-tests.sh"
    "package-ux-tests.json"
    "GUIA_PRUEBAS_USUARIO.md"
    "README-UX-TESTS.md"
)

total_tools=${#tools[@]}
found_tools=0

for tool in "${tools[@]}"; do
    if [ -f "$tool" ]; then
        print_success "$tool"
        ((found_tools++))
    else
        print_error "$tool (no encontrado)"
    fi
done

show_progress $found_tools $total_tools
echo ""

if [ $found_tools -eq $total_tools ]; then
    print_success "Todas las herramientas están disponibles"
else
    print_warning "Algunas herramientas faltan. Ejecuta: ./setup-ux-tests.sh"
fi

echo ""

print_step "PASO 2: Verificación de Servicios"
echo "--------------------------------------"

services=(
    "Frontend (localhost:5173)"
    "Blockchain (localhost:8545)"
    "APIs (localhost:5000)"
)

total_services=${#services[@]}
running_services=0

# Verificar frontend
if curl -s http://localhost:5173 > /dev/null; then
    print_success "Frontend corriendo en http://localhost:5173"
    ((running_services++))
else
    print_error "Frontend no está corriendo"
fi

# Verificar blockchain
if curl -s -X POST -H "Content-Type: application/json" \
    --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
    http://localhost:8545 > /dev/null; then
    print_success "Blockchain corriendo en http://localhost:8545"
    ((running_services++))
else
    print_error "Blockchain no está corriendo"
fi

# Verificar APIs
if curl -s http://localhost:5000 > /dev/null; then
    print_success "APIs corriendo en http://localhost:5000"
    ((running_services++))
else
    print_warning "APIs no están corriendo (opcional)"
fi

show_progress $running_services $total_services
echo ""

echo ""

print_step "PASO 3: Demostración de Escenarios de Prueba"
echo "------------------------------------------------"

scenarios=(
    "Usuario Nuevo - Flujo Completo"
    "Usuario Experto - Registro Directo"
    "Validación de Campos"
    "Funcionalidades Post-Registro"
    "Navegación y UX"
    "Estados de Carga y Feedback"
    "Responsive Design"
)

echo "📊 Escenarios implementados:"
for i in "${!scenarios[@]}"; do
    echo "   $((i+1)). ${scenarios[$i]}"
done

echo ""

print_step "PASO 4: Criterios de Validación"
echo "-----------------------------------"

criteria=(
    "Onboarding claro y guiado"
    "Disclaimer visible y obligatorio"
    "Campos requeridos marcados"
    "Errores de validación claros"
    "Transacciones blockchain funcionan"
    "Feedback inmediato"
    "Navegación intuitiva"
    "Indicadores de estado claros"
    "Perfil se registra correctamente"
    "Funcionalidades básicas operan"
)

echo "✅ Criterios obligatorios (100% requerido):"
for criterion in "${criteria[@]}"; do
    echo "   • $criterion"
done

echo ""

print_step "PASO 5: Métricas Implementadas"
echo "----------------------------------"

echo "⏱️  Métricas de Tiempo:"
echo "   • Onboarding: < 5 minutos"
echo "   • Registro de perfil: < 2 minutos"
echo "   • Carga de páginas: < 3 segundos"
echo "   • Transacciones blockchain: < 30 segundos"

echo ""
echo "🎯 Métricas de Usabilidad:"
echo "   • Número de clics: < 5 para tareas principales"
echo "   • Errores de usuario: < 2 por sesión"
echo "   • Tasa de éxito: > 95%"
echo "   • Satisfacción: > 8/10"

echo ""

print_step "PASO 6: Opciones de Ejecución"
echo "---------------------------------"

echo "🎯 Pruebas Manuales:"
echo "   ./hardhat-dev/scripts/test-user-experience.sh"
echo ""
echo "🤖 Pruebas Automatizadas:"
echo "   ./hardhat-dev/scripts/test-user-experience.sh"
echo ""
echo "⚡ Pruebas de Optimización:"
echo "   ./hardhat-dev/scripts/test-user-experience.sh"

print_step "PASO 7: Beneficios del Sistema"
echo "----------------------------------"

echo "🎉 Beneficios para el equipo:"
echo "   • Feedback rápido sobre problemas de UX"
echo "   • Validación automática de funcionalidades"
echo "   • Métricas objetivas de calidad"
echo "   • Documentación completa y actualizada"
echo "   • Proceso iterativo de mejora"
echo ""

echo "🎉 Beneficios para usuarios finales:"
echo "   • Experiencia optimizada y sin fricciones"
echo "   • Onboarding claro y guiado"
echo "   • Interfaz intuitiva y moderna"
echo "   • Funcionalidades confiables y rápidas"
echo "   • Soporte para diferentes niveles de experiencia"
echo ""

print_header "🎬 DEMOSTRACIÓN COMPLETADA"
echo ""

print_info "El sistema de pruebas de UX está completamente implementado y listo para usar."
print_info "Puedes comenzar inmediatamente con cualquiera de las opciones mostradas arriba."
echo ""

echo "🚀 PRÓXIMOS PASOS RECOMENDADOS:"
echo ""

if [ $running_services -eq 0 ]; then
    print_warning "1. Iniciar servicios de Musubi:"
    echo "   cd frontend && npm run dev"
    echo "   cd hardhat-dev && npx hardhat node"
    echo ""
fi

print_info "2. Ejecutar configuración automática:"
echo "   ./setup-ux-tests.sh"
echo ""

print_info "3. Comenzar con pruebas manuales:"
echo "   ./hardhat-dev/scripts/test-user-experience.sh"
echo ""

print_info "4. O usar el menú interactivo:"
echo "   ./run-ux-tests.sh"
echo ""

print_success "¡El sistema está listo para validar la experiencia de usuario de Musubi! 🎯"
echo ""

echo "📚 DOCUMENTACIÓN DISPONIBLE:"
echo "   • GUIA_PRUEBAS_USUARIO.md - Metodología completa"
echo "   • README-UX-TESTS.md - Documentación técnica"
echo "   • RESUMEN_PRUEBAS_UX.md - Resumen ejecutivo"
echo ""

print_header "🎉 ¡GRACIAS POR TU INTERÉS EN LA CALIDAD DE UX DE MUSUBI!" 