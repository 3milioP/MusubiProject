#!/bin/bash

# Colores para mejor legibilidad
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función para limpiar procesos al salir
cleanup() {
  echo -e "\n${YELLOW}Deteniendo servicios...${NC}"
  [[ -n "$HARDHAT_PID" ]] && kill "$HARDHAT_PID" &>/dev/null
  [[ -n "$FRONTEND_PID" ]] && kill "$FRONTEND_PID" &>/dev/null
  echo -e "${GREEN}✓ Servicios detenidos correctamente${NC}"
  exit
}
trap cleanup SIGINT SIGTERM ERR EXIT

echo -e "${BLUE}===========================================================${NC}"
echo -e "${BLUE}       MUSUBI - Script de Despliegue Automatizado          ${NC}"
echo -e "${BLUE}===========================================================${NC}"

# Verificar requisitos previos
echo -e "\n${YELLOW}Verificando requisitos previos...${NC}"

# Verificar Node.js
if ! command -v node &> /dev/null; then
  echo -e "${RED}Error: Node.js no está instalado. Por favor, instala Node.js v16 o superior.${NC}"
  exit 1
fi

NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 16 ]; then
  echo -e "${RED}Error: Se requiere Node.js v16 o superior. Versión actual: $(node -v)${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v) instalado correctamente${NC}"

# Verificar npm
if ! command -v npm &> /dev/null; then
  echo -e "${RED}Error: npm no está instalado.${NC}"
  exit 1
fi
echo -e "${GREEN}✓ npm $(npm -v) instalado correctamente${NC}"

PROJECT_DIR=$(pwd)
echo "Limpiando despliegues anteriores..."
rm -rf ./ignition/deployments/chain-31337

# Hardhat
echo -e "\n${YELLOW}Instalando dependencias de Hardhat...${NC}"
cd "$PROJECT_DIR/hardhat-dev" || { echo -e "${RED}Error: No se pudo acceder a hardhat-dev${NC}"; exit 1; }
npm install

echo -e "\n${YELLOW}Iniciando nodo Hardhat en segundo plano...${NC}"
npx hardhat node > hardhat-node.log 2>&1 &
HARDHAT_PID=$!
sleep 5

# Verifica si sigue vivo
if ! ps -p $HARDHAT_PID > /dev/null; then
  echo -e "\n${RED}Error: El nodo Hardhat no se pudo iniciar.${NC}"
  echo -e "${RED}Log de error:${NC}"
  tail -n 20 hardhat-node.log
  detener_servicios
  exit 1
else
  echo -e "${GREEN}✓ Nodo Hardhat iniciado correctamente (PID: $HARDHAT_PID)${NC}"
fi

# Despliegue
echo -e "\n${YELLOW}Desplegando contratos con Ignition...${NC}"
npx hardhat ignition deploy ./ignition/modules/deploy.js --network localhost || exit 1
echo -e "${GREEN}✓ Contratos desplegados correctamente${NC}"

# # Tests
# echo -e "\n${YELLOW}Ejecutando tests de contratos...${NC}"
# TEST_FILES=(
#   "KRMToken.test.js"
#   "P2PMarketplace.test.js"
#   "ProfileNFT.test.js"
#   "ProfileRegistry.test.js"
#   "SkillSystem.test.js"
#   "TimeRegistry.test.js"
# )

# # Verificar e instalar hardhat-toolbox
# if ! npm list --depth=0 | grep -q hardhat-toolbox; then
#   echo -e "${YELLOW}Instalando hardhat-toolbox...${NC}"
#   npm install --save-dev @nomicfoundation/hardhat-toolbox
#   if ! grep -q "@nomicfoundation/hardhat-toolbox" hardhat.config.js; then
#     echo -e "${YELLOW}Agregando require en hardhat.config.js${NC}"
#     echo "require('@nomicfoundation/hardhat-toolbox');" | cat - hardhat.config.js > temp && mv temp hardhat.config.js
#   fi
# fi

# for file in "${TEST_FILES[@]}"; do
#   if [ -f "./test/$file" ]; then
#     echo -e "${BLUE}▶ Ejecutando test: $file${NC}"
#     npx hardhat test "./test/$file" || { echo -e "${RED}❌ Fallo en test: $file${NC}"; exit 1; }
#     echo -e "${GREEN}✓ Test exitoso: $file${NC}"
#   else
#     echo -e "${YELLOW}⚠ No encontrado: $file${NC}"
#   fi
# done

# Frontend
echo -e "\n${YELLOW}Configurando frontend...${NC}"
cd "$PROJECT_DIR/frontend" || { echo -e "${RED}Error: No se pudo acceder a frontend${NC}"; exit 1; }

REQUIRED_PKGS=( "@mui/x-date-pickers" "@mui/material" "@emotion/react" "@emotion/styled" "date-fns" )
MISSING_PKGS=()

for pkg in "${REQUIRED_PKGS[@]}"; do
  if ! npm list "$pkg" >/dev/null 2>&1; then
    MISSING_PKGS+=("$pkg")
  fi
done

if [ ${#MISSING_PKGS[@]} -ne 0 ]; then
  echo -e "${YELLOW}Instalando paquetes faltantes: ${MISSING_PKGS[*]}${NC}"
  npm install "${MISSING_PKGS[@]}"
else
  echo -e "${GREEN}✓ Dependencias del frontend verificadas${NC}"
fi

echo -e "\n${YELLOW}Instalando dependencias del frontend...${NC}"
npm install

echo -e "\n${YELLOW}Iniciando frontend...${NC}"
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
sleep 10

if ! ps -p $FRONTEND_PID > /dev/null; then
  echo -e "${RED}Error: El frontend no se pudo iniciar.${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Frontend iniciado correctamente (PID: $FRONTEND_PID)${NC}"

# Instrucciones finales
echo -e "\n${BLUE}===========================================================${NC}"
echo -e "${GREEN}¡Musubi está ejecutándose correctamente!${NC}"
echo -e "${BLUE}===========================================================${NC}"
PORT_USED=$(grep -o 'http://localhost:[0-9]*' frontend.log | head -1)
echo -e "${YELLOW}Frontend: ${GREEN}$PORT_USED${NC}"
echo -e "${YELLOW}Blockchain local: ${GREEN}http://localhost:8545${NC}"
echo -e "${YELLOW}Chain ID: ${GREEN}31337${NC}"
echo -e "\n${YELLOW}Para conectar MetaMask:${NC}"
echo -e "  Nombre: Musubi Local"
echo -e "  RPC URL: http://localhost:8545"
echo -e "  Chain ID: 31337"
echo -e "  Símbolo: ETH"
echo -e "\n${YELLOW}Para importar una cuenta:${NC}"
echo -e "  - Copia una clave privada de hardhat-node.log"
echo -e "  - Ve a MetaMask > Importar cuenta > Pega clave"
echo -e "\n${YELLOW}Presiona Ctrl+C para detener la app${NC}"
echo -e "${BLUE}===========================================================${NC}"

# Esperar a que termine el frontend
wait $FRONTEND_PID
