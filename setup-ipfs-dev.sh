#!/bin/bash

# Script para configurar IPFS para desarrollo de Musubi
# Este script se ejecuta automáticamente desde start-musubi.sh

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🌐 Configurando IPFS para desarrollo de Musubi...${NC}"
echo "=================================================="

# Verificar si IPFS ya está instalado
if command -v ipfs &> /dev/null; then
    echo -e "${GREEN}✓ IPFS ya está instalado: $(ipfs --version | head -n1)${NC}"
else
    echo -e "${RED}❌ IPFS no está instalado${NC}"
    echo -e "${YELLOW}💡 Ejecuta 'brew install ipfs' en macOS o instala manualmente${NC}"
    exit 1
fi

# Inicializar IPFS si no está inicializado
if [ ! -d ~/.ipfs ]; then
    echo -e "${BLUE}🔧 Inicializando IPFS...${NC}"
    ipfs init || {
        echo -e "${RED}❌ Error inicializando IPFS${NC}"
        exit 1
    }
    echo -e "${GREEN}✓ IPFS inicializado${NC}"
else
    echo -e "${GREEN}✓ IPFS ya está inicializado${NC}"
fi

# Configurar IPFS para desarrollo local
echo -e "${BLUE}⚙️  Configurando IPFS para desarrollo...${NC}"

# Habilitar API HTTP en puerto 5001
echo -e "${BLUE}  📡 Configurando API HTTP en puerto 5001...${NC}"
ipfs config Addresses.API /ip4/127.0.0.1/tcp/5001 || {
    echo -e "${YELLOW}⚠️  Error configurando API HTTP${NC}"
}

# Habilitar Gateway HTTP en puerto 8080
echo -e "${BLUE}  🌐 Configurando Gateway HTTP en puerto 8080...${NC}"
ipfs config Addresses.Gateway /ip4/127.0.0.1/tcp/8080 || {
    echo -e "${YELLOW}⚠️  Error configurando Gateway HTTP${NC}"
}

# Configurar CORS para desarrollo
echo -e "${BLUE}  🔓 Configurando CORS para desarrollo...${NC}"
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["*"]' || {
    echo -e "${YELLOW}⚠️  Error configurando CORS${NC}"
}
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods '["PUT", "POST", "GET"]' || {
    echo -e "${YELLOW}⚠️  Error configurando métodos CORS${NC}"
}
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Headers '["Authorization"]' || {
    echo -e "${YELLOW}⚠️  Error configurando headers CORS${NC}"
}

# Configurar para desarrollo local (no usar DHT público)
echo -e "${BLUE}  🏠 Configurando routing local...${NC}"
ipfs config Routing.Type "none" || {
    echo -e "${YELLOW}⚠️  Error configurando routing${NC}"
}

echo -e "${GREEN}✓ IPFS configurado para desarrollo${NC}"

# Verificar si IPFS está corriendo
if pgrep -x "ipfs" > /dev/null; then
    echo -e "${GREEN}✓ IPFS ya está corriendo${NC}"
else
    echo -e "${BLUE}🚀 Iniciando IPFS daemon...${NC}"
    # Iniciar IPFS en segundo plano
    ipfs daemon &
    IPFS_PID=$!
    echo $IPFS_PID > /tmp/ipfs_daemon.pid
    
    # Esperar un momento para que IPFS se inicie
    sleep 3
    
    # Verificar que IPFS esté respondiendo
    if curl -s http://localhost:5001/api/v0/version > /dev/null 2>&1; then
        echo -e "${GREEN}✓ IPFS iniciado correctamente (PID: $IPFS_PID)${NC}"
    else
        echo -e "${YELLOW}⚠️  IPFS iniciado pero no responde inmediatamente${NC}"
        echo -e "${BLUE}💡 Puede tardar unos segundos en estar completamente disponible${NC}"
    fi
fi

echo ""
echo -e "${BLUE}📋 Configuración de IPFS:${NC}"
echo -e "${BLUE}   API: http://localhost:5001${NC}"
echo -e "${BLUE}   Gateway: http://localhost:8080${NC}"
echo -e "${BLUE}   Directorio de datos: ~/.ipfs${NC}"
echo ""
echo -e "${GREEN}✨ ¡IPFS configurado y listo para Musubi!${NC}"
echo ""
echo -e "${BLUE}🎯 Próximos pasos:${NC}"
echo -e "${BLUE}   1. Ejecuta 'start-musubi.sh' con opción 1${NC}"
echo -e "${BLUE}   2. IPFS estará disponible para la API y frontend${NC}"
echo -e "${BLUE}   3. Los datos se almacenarán realmente en IPFS${NC}"
echo "" 