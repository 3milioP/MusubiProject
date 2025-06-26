#!/bin/bash

# Script wrapper para verificación y alineación desde start-musubi
# Se ejecuta automáticamente después del despliegue de contratos

set -e

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Variables globales
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERIFICATION_SCRIPT="$PROJECT_DIR/scripts/verify-and-align.sh"

echo -e "${BLUE}🔄 Ejecutando verificación y alineación dinámica...${NC}"

# Verificar si existe el script de verificación
if [[ ! -f "$VERIFICATION_SCRIPT" ]]; then
    echo -e "${YELLOW}⚠️  Script de verificación no encontrado, usando sincronización manual${NC}"
    exit 1
fi

# Ejecutar script de verificación
if bash "$VERIFICATION_SCRIPT"; then
    echo -e "${GREEN}✅ Verificación y alineación completada exitosamente${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Verificación y alineación falló, continuando con sincronización manual${NC}"
    exit 1
fi 