#!/bin/bash

echo "🔧 CONFIGURACIÓN DE PRUEBAS DE UX - MUSUBI"
echo "=========================================="
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Verificar Node.js
print_status "Verificando Node.js..."
if ! command -v node &> /dev/null; then
    print_error "Node.js no está instalado"
    echo "💡 Instala Node.js desde: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version)
print_success "Node.js $NODE_VERSION encontrado"

# Verificar npm
print_status "Verificando npm..."
if ! command -v npm &> /dev/null; then
    print_error "npm no está instalado"
    exit 1
fi

NPM_VERSION=$(npm --version)
print_success "npm $NPM_VERSION encontrado"

# Instalar dependencias de pruebas
print_status "Instalando dependencias de pruebas..."
if [ -f "package-ux-tests.json" ]; then
    # Usar el package.json específico para pruebas
    cp package-ux-tests.json package.json
    npm install
    print_success "Dependencias instaladas correctamente"
else
    print_warning "package-ux-tests.json no encontrado, instalando Puppeteer directamente..."
    npm install puppeteer
    print_success "Puppeteer instalado correctamente"
fi

# Verificar servicios
print_status "Verificando servicios de Musubi..."

# Verificar frontend
if curl -s http://localhost:5173 > /dev/null; then
    print_success "Frontend corriendo en http://localhost:5173"
else
    print_warning "Frontend no está corriendo"
    echo "💡 Ejecuta: cd frontend && npm run dev"
fi

# Verificar blockchain
if curl -s -X POST -H "Content-Type: application/json" \
    --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
    http://localhost:8545 > /dev/null; then
    print_success "Blockchain corriendo en http://localhost:8545"
else
    print_warning "Blockchain no está corriendo"
    echo "💡 Ejecuta: cd hardhat-dev && npx hardhat node"
fi

# Verificar APIs
if curl -s http://localhost:5000 > /dev/null; then
    print_success "APIs corriendo en http://localhost:5000"
else
    print_warning "APIs no están corriendo (opcional)"
fi

# Crear directorio para resultados
print_status "Creando directorio para resultados..."
mkdir -p test-results
print_success "Directorio test-results creado"

# Verificar scripts
print_status "Verificando scripts de prueba..."

# Verificar que el script de pruebas UX esté disponible
if [ -f "test-user-experience.sh" ]; then
    chmod +x test-user-experience.sh
    print_success "test-user-experience.sh encontrado y configurado"
else
    print_error "test-user-experience.sh no encontrado"
    print_info "Asegúrate de ejecutar este script desde hardhat-dev/scripts/"
    exit 1
fi

if [ -f "test-automated-ux.js" ]; then
    print_success "Script de pruebas automatizadas listo"
else
    print_error "test-automated-ux.js no encontrado"
fi

# Crear archivo de configuración de ejemplo
print_status "Creando archivo de configuración de ejemplo..."
cat > test-config.json << EOF
{
  "baseUrl": "http://localhost:5173",
  "timeout": 30000,
  "headless": false,
  "slowMo": 100,
  "screenshots": true,
  "video": false,
  "testUsers": {
    "newUser": {
      "name": "Juan Pérez",
      "description": "Desarrollador Full Stack con 5 años de experiencia",
      "location": "Madrid, España",
      "website": "https://juanperez.dev"
    },
    "expertUser": {
      "name": "TechCorp Solutions",
      "description": "Empresa de desarrollo de software especializada en blockchain",
      "location": "Barcelona, España",
      "website": "https://techcorp.es"
    }
  }
}
EOF
print_success "Archivo de configuración creado: test-config.json"

# Crear script de ejecución rápida
print_status "Creando script de ejecución rápida..."
cat > run-ux-tests.sh << 'EOF'
#!/bin/bash

echo "🧪 EJECUTANDO PRUEBAS DE UX - MUSUBI"
echo "===================================="
echo ""

echo "Selecciona el tipo de prueba:"
echo "1. Pruebas manuales (guiadas)"
echo "2. Pruebas automatizadas (Puppeteer)"
echo "3. Pruebas automatizadas (headless)"
echo "4. Todas las pruebas"
echo "5. Solo verificar servicios"
echo ""

read -p "Opción (1-5): " choice

case $choice in
    1)
        echo "🚀 Ejecutando pruebas manuales..."
        ./hardhat-dev/scripts/test-user-experience.sh
        ;;
    2)
        echo "🤖 Ejecutando pruebas automatizadas..."
        node test-automated-ux.js
        ;;
    3)
        echo "🤖 Ejecutando pruebas automatizadas (headless)..."
        node -e "require('./test-automated-ux.js').TEST_CONFIG.headless = true; require('./test-automated-ux.js').main()"
        ;;
    4)
        echo "🔄 Ejecutando todas las pruebas..."
        echo "1. Verificando servicios..."
        ./hardhat-dev/scripts/test-user-experience.sh --check-only
        echo ""
        echo "2. Ejecutando pruebas automatizadas..."
        node test-automated-ux.js
        echo ""
        echo "3. Ejecutando pruebas manuales..."
        ./hardhat-dev/scripts/test-user-experience.sh
        ;;
    5)
        echo "🔍 Verificando servicios..."
        ./hardhat-dev/scripts/test-user-experience.sh --check-only
        ;;
    *)
        echo "❌ Opción inválida"
        exit 1
        ;;
esac

echo ""
echo "✅ Pruebas completadas"
EOF

chmod +x run-ux-tests.sh
print_success "Script de ejecución rápida creado: run-ux-tests.sh"

# Crear README de pruebas
print_status "Creando documentación de pruebas..."
cat > README-UX-TESTS.md << 'EOF'
# 🧪 Pruebas de Experiencia de Usuario - Musubi

## 📋 Descripción
Este directorio contiene todas las herramientas y scripts necesarios para realizar pruebas completas de experiencia de usuario en Musubi.

## 🚀 Inicio Rápido

### 1. Configuración Inicial
```bash
# Ejecutar configuración automática
./setup-ux-tests.sh
```

### 2. Ejecutar Pruebas
```bash
# Script interactivo para elegir tipo de prueba
./run-ux-tests.sh

# O ejecutar directamente:
./hardhat-dev/scripts/test-user-experience.sh          # Pruebas manuales
node test-automated-ux.js          # Pruebas automatizadas
```

## 📁 Estructura de Archivos

```
├── test-user-experience.sh        # Guía de pruebas manuales
├── test-automated-ux.js          # Pruebas automatizadas con Puppeteer
├── setup-ux-tests.sh             # Configuración automática
├── run-ux-tests.sh               # Script de ejecución rápida
├── test-config.json              # Configuración de pruebas
├── package-ux-tests.json         # Dependencias de Node.js
├── GUIA_PRUEBAS_USUARIO.md       # Guía completa de metodología
├── test-results/                 # Directorio para resultados
└── README-UX-TESTS.md            # Este archivo
```

## 🎯 Tipos de Pruebas

### Pruebas Manuales
- **Archivo:** test-user-experience.sh
- **Descripción:** Guía paso a paso para pruebas manuales
- **Uso:** Seguir escenarios definidos manualmente
- **Duración:** 15-30 minutos

### Pruebas Automatizadas
- **Archivo:** test-automated-ux.js
- **Descripción:** Pruebas automatizadas con Puppeteer
- **Uso:** Ejecutar script de Node.js
- **Duración:** 2-5 minutos

## 📊 Escenarios de Prueba

### Escenario 1: Usuario Nuevo
- Onboarding completo
- Configuración de wallet
- Registro de perfil individual
- Verificación de funcionalidades

### Escenario 2: Usuario Experto
- Registro directo
- Perfil de empresa
- Funcionalidades avanzadas

### Escenario 3: Validación
- Campos requeridos
- Mensajes de error
- Validación de formularios

### Escenario 4: Funcionalidades
- Declaración de habilidades
- Registro de tiempo
- Marketplace

### Escenario 5: Navegación
- Sidebar y menús
- Indicadores de estado
- Responsive design

## 🔧 Configuración

### Requisitos
- Node.js 16+
- npm
- Navegador Chrome/Chromium
- Servicios de Musubi corriendo

### Variables de Configuración
Editar test-config.json para personalizar:
- URL base de la aplicación
- Timeouts
- Modo headless
- Datos de prueba

## 📈 Métricas y Resultados

### Métricas Automatizadas
- Tiempo de carga de páginas
- Tiempo de transacciones
- Número de errores
- Tasa de éxito de pruebas

### Métricas Manuales
- Tiempo de onboarding
- Número de errores de usuario
- Satisfacción subjetiva
- Problemas encontrados

## 🐛 Solución de Problemas

### Problemas Comunes

#### 1. Puppeteer no se instala
```bash
npm install puppeteer --force
```

#### 2. Servicios no están corriendo
```bash
# Frontend
cd frontend && npm run dev

# Blockchain
cd hardhat-dev && npx hardhat node

# APIs
cd musubi-api && python3 src/main.py
```

#### 3. Errores de permisos
```bash
chmod +x *.sh
```

### Logs y Debugging
- Los screenshots de errores se guardan en test-results/
- Los logs detallados aparecen en consola
- Usar --verbose para más información

## 📝 Reportes

### Generación de Reportes
Los resultados se pueden exportar en diferentes formatos:
- JSON para análisis automatizado
- Markdown para documentación
- Screenshots para evidencias visuales

### Plantilla de Reporte
Ver GUIA_PRUEBAS_USUARIO.md para plantilla completa de reporte.

## 🔄 Mejoras Continuas

### Proceso de Iteración
1. Ejecutar pruebas
2. Analizar resultados
3. Identificar problemas
4. Implementar mejoras
5. Re-ejecutar pruebas
6. Validar mejoras

### Contribuciones
Para agregar nuevas pruebas:
1. Crear nuevo escenario en test-automated-ux.js
2. Actualizar documentación
3. Verificar que pasa en diferentes entornos
4. Documentar casos de uso

## 📞 Soporte

Para problemas o preguntas:
1. Revisar logs de error
2. Verificar configuración
3. Consultar documentación
4. Crear issue con detalles completos

---

**Última actualización:** $(date)
**Versión:** 1.0.0
EOF

print_success "Documentación creada: README-UX-TESTS.md"

echo ""
echo "🎉 CONFIGURACIÓN COMPLETADA"
echo "==========================="
echo ""
echo "✅ Herramientas instaladas:"
echo "   - Puppeteer para automatización"
echo "   - Scripts de prueba configurados"
echo "   - Documentación generada"
echo ""
echo "🚀 Próximos pasos:"
echo "   1. Ejecutar: ./run-ux-tests.sh"
echo "   2. Seguir la guía: ./hardhat-dev/scripts/test-user-experience.sh"
echo "   3. Revisar documentación: README-UX-TESTS.md"
echo ""
echo "📊 Para ejecutar pruebas rápidamente:"
echo "   ./run-ux-tests.sh"
echo ""
echo "🔧 Para verificar servicios:"
echo "   ./hardhat-dev/scripts/test-user-experience.sh --check-only"
echo ""
echo "¡Listo para comenzar las pruebas de UX! 🎯"

# Ejecutar pruebas manuales
print_status "Ejecutando pruebas manuales..."
./hardhat-dev/scripts/test-user-experience.sh

# Verificar resultados
print_status "Verificando resultados de pruebas manuales..."
./hardhat-dev/scripts/test-user-experience.sh --check-only

echo "🎯 Pruebas Manuales:"
echo "   ./hardhat-dev/scripts/test-user-experience.sh"
echo ""
echo "🤖 Pruebas Automatizadas:"
echo "   ./hardhat-dev/scripts/test-user-experience.sh"
echo ""
echo "⚡ Pruebas de Optimización:"
echo "   ./hardhat-dev/scripts/test-user-experience.sh" 