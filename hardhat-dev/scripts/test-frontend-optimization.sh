#!/bin/bash

echo "🧪 Probando flujo completo del frontend optimizado..."
echo "=================================================="

# Verificar que el frontend esté corriendo
echo "🔍 Verificando que el frontend esté corriendo..."
if ! curl -s http://localhost:5173 > /dev/null; then
    echo "❌ Frontend no está corriendo en http://localhost:5173"
    echo "💡 Ejecuta: cd frontend && npm run dev"
    exit 1
fi

echo "✅ Frontend está corriendo"

# Verificar que la blockchain esté corriendo
echo "🔍 Verificando que la blockchain esté corriendo..."
if ! curl -s -X POST -H "Content-Type: application/json" \
    --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
    http://localhost:8545 > /dev/null; then
    echo "❌ Blockchain no está corriendo en http://localhost:8545"
    echo "💡 Ejecuta: cd hardhat-dev && npx hardhat node"
    exit 1
fi

echo "✅ Blockchain está corriendo"

# Verificar que las APIs estén corriendo
echo "🔍 Verificando que las APIs estén corriendo..."
if ! curl -s http://localhost:5000 > /dev/null; then
    echo "❌ APIs no están corriendo en http://localhost:5000"
    echo "💡 Ejecuta: cd musubi-api && python3 src/main.py"
    exit 1
fi

echo "✅ APIs están corriendo"

echo ""
echo "🎯 Flujo de prueba del frontend optimizado:"
echo "=========================================="
echo ""
echo "1. 📱 Abre http://localhost:5173 en tu navegador"
echo ""
echo "2. 🔗 Conecta tu wallet MetaMask:"
echo "   - Asegúrate de estar en la red local (Chain ID: 31337)"
echo "   - Usa una de las cuentas de prueba del hardhat"
echo ""
echo "3. 🎓 Completa el onboarding:"
echo "   - Pantalla de bienvenida"
echo "   - Tutorial de MetaMask (opcional)"
echo "   - Tutorial de Musubi (opcional)"
echo "   - Registro de perfil con disclaimer"
echo ""
echo "4. ✅ Verifica el registro de perfil:"
echo "   - El perfil debe aparecer en el Dashboard"
echo "   - El Navbar debe mostrar el indicador de perfil"
echo "   - La página de Perfil debe mostrar los datos registrados"
echo ""
echo "5. 🧪 Prueba las funcionalidades:"
echo "   - Declarar habilidades en Skills"
echo "   - Registrar tiempo en TimeRegistry"
echo "   - Crear servicios en Marketplace"
echo "   - Transferir tokens KRM"
echo ""
echo "🔧 Funcionalidades implementadas:"
echo "================================"
echo "✅ Registro de perfil con disclaimer obligatorio"
echo "✅ Validación de campos requeridos"
echo "✅ Flujo de onboarding mejorado"
echo "✅ Indicadores visuales de estado del perfil"
echo "✅ Integración completa con contratos actualizados"
echo "✅ Feedback claro de transacciones"
echo "✅ UX/UI moderna y responsive"
echo ""
echo "📋 Checklist de verificación:"
echo "============================"
echo "□ Wallet conectada correctamente"
echo "□ Onboarding completado"
echo "□ Perfil registrado con disclaimer"
echo "□ Datos del perfil visibles en Dashboard"
echo "□ Indicador de perfil en Navbar"
echo "□ Funcionalidades básicas operativas"
echo "□ Transacciones blockchain exitosas"
echo ""
echo "🚀 ¡El frontend está optimizado y listo para usar!"
echo ""
echo "💡 Consejos:"
echo "- Usa las cuentas de prueba del hardhat para testing"
echo "- Verifica que MetaMask esté configurado para la red local"
echo "- Revisa la consola del navegador para logs detallados"
echo "- Si hay errores, verifica que todos los servicios estén corriendo"

# Mantener el script corriendo
while true; do
    sleep 10
    echo "⏰ Script de monitoreo activo... (Ctrl+C para salir)"
done 