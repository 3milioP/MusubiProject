#!/bin/bash

echo "🧪 PRUEBAS DE EXPERIENCIA DE USUARIO - MUSUBI"
echo "============================================="
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir con colores
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar servicios
print_status "Verificando servicios..."

# Verificar frontend
if curl -s http://localhost:5173 > /dev/null; then
    print_success "Frontend corriendo en http://localhost:5173"
else
    print_error "Frontend no está corriendo"
    echo "💡 Ejecuta: cd frontend && npm run dev"
    exit 1
fi

# Verificar blockchain
if curl -s -X POST -H "Content-Type: application/json" \
    --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
    http://localhost:8545 > /dev/null; then
    print_success "Blockchain corriendo en http://localhost:8545"
else
    print_error "Blockchain no está corriendo"
    echo "💡 Ejecuta: cd hardhat-dev && npx hardhat node"
    exit 1
fi

# Verificar APIs
if curl -s http://localhost:5000 > /dev/null; then
    print_success "APIs corriendo en http://localhost:5000"
else
    print_warning "APIs no están corriendo (opcional para pruebas básicas)"
fi

echo ""
echo "🎯 ESCENARIOS DE PRUEBA DE USUARIO"
echo "=================================="
echo ""

echo "📋 ESCENARIO 1: Usuario Nuevo - Flujo Completo"
echo "----------------------------------------------"
echo "1. Abrir http://localhost:5173"
echo "2. Verificar pantalla de bienvenida"
echo "3. Hacer clic en 'Configurar Wallet'"
echo "4. Conectar MetaMask a red local (Chain ID: 31337)"
echo "5. Completar tutorial de MetaMask (opcional)"
echo "6. Completar tutorial de Musubi (opcional)"
echo "7. Llegar al registro de perfil"
echo "8. Completar formulario de perfil:"
echo "   - Seleccionar tipo: Individual"
echo "   - Nombre: 'Juan Pérez'"
echo "   - Descripción: 'Desarrollador Full Stack con 5 años de experiencia'"
echo "   - Ubicación: 'Madrid, España'"
echo "   - Website: 'https://juanperez.dev'"
echo "9. Leer y aceptar disclaimer"
echo "10. Confirmar registro"
echo "11. Verificar que aparece en Dashboard"
echo ""

echo "📋 ESCENARIO 2: Usuario Experto - Registro Directo"
echo "-------------------------------------------------"
echo "1. Abrir http://localhost:5173"
echo "2. Hacer clic en 'Ya tengo Wallet'"
echo "3. Conectar MetaMask directamente"
echo "4. Ir directamente a registro de perfil"
echo "5. Completar formulario de empresa:"
echo "   - Tipo: Empresa"
echo "   - Nombre: 'TechCorp Solutions'"
echo "   - Descripción: 'Empresa de desarrollo de software especializada en blockchain'"
echo "   - Ubicación: 'Barcelona, España'"
echo "   - Website: 'https://techcorp.es'"
echo "6. Aceptar disclaimer"
echo "7. Registrar perfil"
echo "8. Verificar indicadores en Navbar"
echo ""

echo "📋 ESCENARIO 3: Validación de Campos"
echo "-----------------------------------"
echo "1. Ir a registro de perfil"
echo "2. Intentar registrar sin nombre → Debe mostrar error"
echo "3. Intentar registrar sin descripción → Debe mostrar error"
echo "4. Intentar registrar sin aceptar disclaimer → Debe mostrar error"
echo "5. Completar formulario correctamente"
echo "6. Verificar que se puede registrar"
echo ""

echo "📋 ESCENARIO 4: Funcionalidades Post-Registro"
echo "--------------------------------------------"
echo "1. Tener perfil registrado"
echo "2. Ir a página de Skills"
echo "3. Declarar habilidad 'JavaScript' nivel Intermedio"
echo "4. Verificar que aparece en lista de habilidades"
echo "5. Ir a TimeRegistry"
echo "6. Registrar tiempo trabajado"
echo "7. Ir a Marketplace"
echo "8. Crear un servicio"
echo "9. Verificar que todo funciona correctamente"
echo ""

echo "📋 ESCENARIO 5: Navegación y UX"
echo "------------------------------"
echo "1. Verificar que el sidebar se abre/cierra correctamente"
echo "2. Navegar entre todas las páginas"
echo "3. Verificar que el estado activo se mantiene"
echo "4. Verificar indicadores de perfil en Navbar"
echo "5. Verificar balance KRM se muestra correctamente"
echo "6. Verificar información de red en Navbar"
echo "7. Probar menú de wallet (desconectar)"
echo ""

echo "📋 ESCENARIO 6: Estados de Carga y Feedback"
echo "------------------------------------------"
echo "1. Observar estados de carga durante transacciones"
echo "2. Verificar mensajes de éxito/error"
echo "3. Verificar que los botones se deshabilitan durante carga"
echo "4. Verificar feedback visual de transacciones"
echo "5. Probar refresh de datos"
echo ""

echo "📋 ESCENARIO 7: Responsive Design"
echo "-------------------------------"
echo "1. Probar en diferentes tamaños de pantalla"
echo "2. Verificar que el sidebar se adapta en móvil"
echo "3. Verificar que los formularios son usables en móvil"
echo "4. Verificar que los botones son accesibles"
echo ""

echo "🔍 CRITERIOS DE VALIDACIÓN"
echo "=========================="
echo ""

echo "✅ CRITERIOS OBLIGATORIOS:"
echo "-------------------------"
echo "□ El onboarding es claro y guía al usuario paso a paso"
echo "□ El disclaimer es visible y obligatorio"
echo "□ Los campos requeridos están claramente marcados"
echo "□ Los errores de validación son claros y específicos"
echo "□ Las transacciones blockchain funcionan correctamente"
echo "□ El feedback de éxito/error es inmediato"
echo "□ La navegación es intuitiva"
echo "□ Los indicadores de estado son claros"
echo "□ El perfil se registra correctamente en la blockchain"
echo "□ Todas las funcionalidades básicas operan"
echo ""

echo "✅ CRITERIOS DE CALIDAD:"
echo "----------------------"
echo "□ La interfaz es moderna y atractiva"
echo "□ Los tiempos de carga son aceptables"
echo "□ La experiencia es fluida sin interrupciones"
echo "□ Los mensajes son claros y útiles"
echo "□ La aplicación es responsive"
echo "□ Los iconos y elementos visuales son consistentes"
echo "□ El flujo de usuario es lógico"
echo "□ No hay errores en consola del navegador"
echo ""

echo "📊 MÉTRICAS A MEDIR"
echo "=================="
echo ""

echo "⏱️  TIEMPOS:"
echo "-----------"
echo "• Tiempo para completar onboarding: < 5 minutos"
echo "• Tiempo para registrar perfil: < 2 minutos"
echo "• Tiempo de carga de páginas: < 3 segundos"
echo "• Tiempo de transacciones blockchain: < 30 segundos"
echo ""

echo "🎯 USABILIDAD:"
echo "-------------"
echo "• Número de clics para completar tareas principales"
echo "• Número de errores de usuario"
echo "• Tiempo para encontrar funcionalidades"
echo "• Satisfacción general del usuario"
echo ""

echo "🔧 TÉCNICAS:"
echo "-----------"
echo "• Errores en consola del navegador"
echo "• Fallos de transacciones blockchain"
echo "• Problemas de conectividad"
echo "• Rendimiento general"
echo ""

echo "📝 PLANTILLA DE REPORTE"
echo "======================"
echo ""

echo "REPORTE DE PRUEBAS DE USUARIO - MUSUBI"
echo "Fecha: $(date)"
echo "Tester: [Nombre del tester]"
echo "Navegador: [Chrome/Firefox/Safari]"
echo "Dispositivo: [Desktop/Mobile]"
echo ""

echo "RESULTADOS POR ESCENARIO:"
echo "------------------------"
echo ""

echo "ESCENARIO 1 - Usuario Nuevo:"
echo "□ Completado exitosamente"
echo "□ Completado con problemas menores"
echo "□ Completado con problemas mayores"
echo "□ Falló completamente"
echo "Observaciones:"
echo ""

echo "ESCENARIO 2 - Usuario Experto:"
echo "□ Completado exitosamente"
echo "□ Completado con problemas menores"
echo "□ Completado con problemas mayores"
echo "□ Falló completamente"
echo "Observaciones:"
echo ""

echo "ESCENARIO 3 - Validación:"
echo "□ Completado exitosamente"
echo "□ Completado con problemas menores"
echo "□ Completado con problemas mayores"
echo "□ Falló completamente"
echo "Observaciones:"
echo ""

echo "ESCENARIO 4 - Funcionalidades:"
echo "□ Completado exitosamente"
echo "□ Completado con problemas menores"
echo "□ Completado con problemas mayores"
echo "□ Falló completamente"
echo "Observaciones:"
echo ""

echo "ESCENARIO 5 - Navegación:"
echo "□ Completado exitosamente"
echo "□ Completado con problemas menores"
echo "□ Completado con problemas mayores"
echo "□ Falló completamente"
echo "Observaciones:"
echo ""

echo "ESCENARIO 6 - Estados:"
echo "□ Completado exitosamente"
echo "□ Completado con problemas menores"
echo "□ Completado con problemas mayores"
echo "□ Falló completamente"
echo "Observaciones:"
echo ""

echo "ESCENARIO 7 - Responsive:"
echo "□ Completado exitosamente"
echo "□ Completado con problemas menores"
echo "□ Completado con problemas mayores"
echo "□ Falló completamente"
echo "Observaciones:"
echo ""

echo "PROBLEMAS ENCONTRADOS:"
echo "--------------------"
echo "1. [Descripción del problema]"
echo "   Severidad: [Alta/Media/Baja]"
echo "   Pasos para reproducir:"
echo "   - Paso 1"
echo "   - Paso 2"
echo "   - Paso 3"
echo ""

echo "SUGERENCIAS DE MEJORA:"
echo "--------------------"
echo "1. [Sugerencia específica]"
echo "2. [Sugerencia específica]"
echo "3. [Sugerencia específica]"
echo ""

echo "CALIFICACIÓN GENERAL:"
echo "-------------------"
echo "□ Excelente (9-10)"
echo "□ Muy bueno (7-8)"
echo "□ Bueno (5-6)"
echo "□ Regular (3-4)"
echo "□ Malo (1-2)"
echo ""

echo "🚀 INSTRUCCIONES PARA EJECUTAR PRUEBAS"
echo "====================================="
echo ""

echo "1. 📱 PREPARACIÓN:"
echo "   - Abrir http://localhost:5173"
echo "   - Tener MetaMask configurado para red local"
echo "   - Tener cuentas de prueba disponibles"
echo ""

echo "2. 🧪 EJECUCIÓN:"
echo "   - Seguir cada escenario paso a paso"
echo "   - Documentar cualquier problema encontrado"
echo "   - Tomar screenshots de errores importantes"
echo "   - Medir tiempos de respuesta"
echo ""

echo "3. 📊 EVALUACIÓN:"
echo "   - Completar la plantilla de reporte"
echo "   - Calificar cada criterio"
echo "   - Identificar problemas críticos"
echo "   - Proponer mejoras específicas"
echo ""

echo "4. 🔄 ITERACIÓN:"
echo "   - Corregir problemas críticos"
echo "   - Re-ejecutar pruebas"
echo "   - Validar mejoras implementadas"
echo ""

echo "💡 CONSEJOS PARA TESTING:"
echo "======================="
echo ""

echo "• Usar diferentes navegadores (Chrome, Firefox, Safari)"
echo "• Probar en diferentes dispositivos (Desktop, Tablet, Mobile)"
echo "• Simular diferentes velocidades de conexión"
echo "• Probar con diferentes cuentas de MetaMask"
echo "• Documentar todo con screenshots y videos"
echo "• Ser objetivo en las evaluaciones"
echo "• Enfocarse en la experiencia del usuario final"
echo ""

echo "🎯 OBJETIVO FINAL:"
echo "================="
echo "Asegurar que Musubi proporciona una experiencia de usuario"
echo "excepcional, intuitiva y sin fricciones para todos los tipos"
echo "de usuarios, desde principiantes hasta expertos en Web3."
echo ""

echo "¡Listo para comenzar las pruebas! 🚀"
echo ""
echo "Presiona Enter para abrir el frontend en tu navegador..."
read -r

# Abrir navegador automáticamente
if command -v open >/dev/null 2>&1; then
    open http://localhost:5173
elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open http://localhost:5173
else
    print_status "Abre manualmente: http://localhost:5173"
fi 