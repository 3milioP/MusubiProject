#!/bin/bash

# Script para verificar rápidamente el estado de IPFS
# Útil para debugging y verificación antes de ejecutar start-musubi

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Verificando estado de IPFS...${NC}"
echo "=================================="

# Verificar si IPFS está instalado
if command -v ipfs &> /dev/null; then
    echo -e "${GREEN}✅ IPFS instalado: $(ipfs --version | head -n1)${NC}"
else
    echo -e "${RED}❌ IPFS no está instalado${NC}"
    echo -e "${YELLOW}💡 Para instalar: brew install ipfs${NC}"
    exit 1
fi

# Verificar si IPFS está inicializado
if [ -d ~/.ipfs ]; then
    echo -e "${GREEN}✅ IPFS inicializado${NC}"
else
    echo -e "${YELLOW}⚠️  IPFS no está inicializado${NC}"
    echo -e "${BLUE}💡 Para inicializar: ipfs init${NC}"
fi

# Verificar configuración
echo -e "${BLUE}📋 Verificando configuración...${NC}"

# Verificar API
API_CONFIG=$(ipfs config Addresses.API 2>/dev/null || echo "No configurado")
if [[ "$API_CONFIG" == "/ip4/127.0.0.1/tcp/5001" ]]; then
    echo -e "${GREEN}✅ API configurada correctamente${NC}"
else
    echo -e "${YELLOW}⚠️  API no configurada: $API_CONFIG${NC}"
fi

# Verificar Gateway
GATEWAY_CONFIG=$(ipfs config Addresses.Gateway 2>/dev/null || echo "No configurado")
if [[ "$GATEWAY_CONFIG" == "/ip4/127.0.0.1/tcp/8080" ]]; then
    echo -e "${GREEN}✅ Gateway configurado correctamente${NC}"
else
    echo -e "${YELLOW}⚠️  Gateway no configurado: $GATEWAY_CONFIG${NC}"
fi

# Verificar CORS
CORS_CONFIG=$(ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin 2>/dev/null || echo "No configurado")
if [[ "$CORS_CONFIG" == '["*"]' ]]; then
    echo -e "${GREEN}✅ CORS configurado correctamente${NC}"
else
    echo -e "${YELLOW}⚠️  CORS no configurado: $CORS_CONFIG${NC}"
fi

# Verificar si IPFS está corriendo
if pgrep -x "ipfs" > /dev/null; then
    echo -e "${GREEN}✅ IPFS daemon corriendo${NC}"
    
    # Verificar conectividad
    if curl -s http://localhost:5001/api/v0/version > /dev/null 2>&1; then
        echo -e "${GREEN}✅ API IPFS respondiendo en http://localhost:5001${NC}"
        
        # Obtener información de versión
        VERSION_INFO=$(curl -s http://localhost:5001/api/v0/version 2>/dev/null | grep -o '"Version":"[^"]*"' | cut -d'"' -f4 || echo "No disponible")
        echo -e "${BLUE}📦 Versión: $VERSION_INFO${NC}"
    else
        echo -e "${YELLOW}⚠️  API IPFS no responde en http://localhost:5001${NC}"
    fi
    
    if curl -s http://localhost:8080 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Gateway IPFS respondiendo en http://localhost:8080${NC}"
    else
        echo -e "${YELLOW}⚠️  Gateway IPFS no responde en http://localhost:8080${NC}"
    fi
else
    echo -e "${RED}❌ IPFS daemon no está corriendo${NC}"
    echo -e "${BLUE}💡 Para iniciar: ipfs daemon${NC}"
fi

echo ""
echo -e "${BLUE}🎯 Resumen:${NC}"
if command -v ipfs &> /dev/null && pgrep -x "ipfs" > /dev/null && curl -s http://localhost:5001/api/v0/version > /dev/null 2>&1; then
    echo -e "${GREEN}✨ IPFS está listo para Musubi${NC}"
    echo -e "${BLUE}   Puedes ejecutar 'start-musubi.sh' con opción 1${NC}"
else
    echo -e "${YELLOW}⚠️  IPFS necesita configuración${NC}"
    echo -e "${BLUE}   Ejecuta: ./setup-ipfs-dev.sh${NC}"
fi

echo "" 