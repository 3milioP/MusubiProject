#!/bin/bash

# Script de verificación y alineación dinámica para Musubi
# Detecta cambios en contratos y sincroniza automáticamente todos los componentes
# Se ejecuta desde start-musubi.sh después del despliegue

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

# Variables globales
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HARDHAT_DIR="$PROJECT_DIR/hardhat-dev"
API_DIR="$PROJECT_DIR/musubi-api"
FRONTEND_DIR="$PROJECT_DIR/frontend"
NETWORK="local"

# Función para imprimir mensajes
print_status() {
    echo -e "${BLUE}🔍 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo -e "${BOLD}${BLUE}$1${NC}"
}

# Función para detectar cambios en contratos
detect_contract_changes() {
    print_status "Detectando cambios en contratos..."
    
    local deployment_file="$HARDHAT_DIR/ignition/deployments/chain-31337/deployed_addresses.json"
    
    # Verificar si existe el archivo de despliegue
    if [ ! -f "$deployment_file" ]; then
        print_error "Archivo de despliegue no encontrado: $deployment_file"
        return 1
    fi
    
    # Calcular hash del archivo de despliegue
    local deployment_hash=""
    if command -v md5sum &> /dev/null; then
        deployment_hash=$(md5sum "$deployment_file" | cut -d' ' -f1)
    elif command -v md5 &> /dev/null; then
        deployment_hash=$(md5 "$deployment_file" | cut -d' ' -f4)
    else
        print_error "No se encontró md5sum ni md5 para calcular hash"
        return 1
    fi
    
    # Verificar si existe archivo de hash anterior
    local hash_file="$PROJECT_DIR/.contract_hash"
    local previous_hash=""
    
    if [ -f "$hash_file" ]; then
        previous_hash=$(cat "$hash_file")
    fi
    
    # Comparar hashes
    if [ "$deployment_hash" != "$previous_hash" ]; then
        print_warning "Cambios detectados en contratos desplegados"
        echo "$deployment_hash" > "$hash_file"
        return 0  # Hay cambios
    else
        print_success "No hay cambios en contratos"
        return 1  # No hay cambios
    fi
}

# Función para verificar ABIs
verify_abis() {
    print_status "Verificando ABIs de contratos..."
    
    local artifacts_dir="$HARDHAT_DIR/artifacts/contracts"
    local required_contracts=(
        "core/IPFSRegistry.sol/IPFSRegistry.json"
        "core/ProfileRegistry.sol/ProfileRegistry.json"
        "core/SkillSystem.sol/SkillSystem.json"
        "core/TimeRegistry.sol/TimeRegistry.json"
        "tokens/KRMToken.sol/KRMToken.json"
        "tokens/ProfileNFT.sol/ProfileNFT.json"
        "marketplace/P2PMarketplace.sol/P2PMarketplace.json"
    )
    
    local missing_abis=()
    
    for contract in "${required_contracts[@]}"; do
        local abi_file="$artifacts_dir/$contract"
        if [ ! -f "$abi_file" ]; then
            missing_abis+=("$contract")
        fi
    done
    
    if [ ${#missing_abis[@]} -eq 0 ]; then
        print_success "Todos los ABIs están disponibles"
        return 0
    else
        print_warning "ABIs faltantes:"
        for abi in "${missing_abis[@]}"; do
            echo "  - $abi"
        done
        return 1
    fi
}

# Función para sincronizar API
sync_api() {
    print_status "Sincronizando API..."
    
    cd "$API_DIR"
    
    if [ -f "sync_contract_addresses.py" ]; then
        if python3 sync_contract_addresses.py; then
            print_success "API sincronizada correctamente"
            return 0
        else
            print_error "Error sincronizando API"
            return 1
        fi
    else
        print_error "Script de sincronización de API no encontrado"
        return 1
    fi
}

# Función para sincronizar Frontend
sync_frontend() {
    print_status "Sincronizando Frontend..."
    
    cd "$HARDHAT_DIR"
    
    if [ -f "sync_frontend_addresses.js" ]; then
        if node sync_frontend_addresses.js; then
            print_success "Frontend sincronizado correctamente"
            return 0
        else
            print_error "Error sincronizando Frontend"
            return 1
        fi
    else
        print_error "Script de sincronización de Frontend no encontrado"
        return 1
    fi
}

# Función para verificar IPFS
verify_ipfs() {
    print_status "Verificando IPFS..."
    
    # Verificar si IPFS está instalado
    if ! command -v ipfs &> /dev/null; then
        print_error "IPFS no está instalado"
        return 1
    fi
    
    # Verificar si IPFS está corriendo
    if ! pgrep -x "ipfs" > /dev/null; then
        print_warning "IPFS no está corriendo, iniciando..."
        if [ -f "$PROJECT_DIR/setup-ipfs-dev.sh" ]; then
            bash "$PROJECT_DIR/setup-ipfs-dev.sh" > /dev/null 2>&1
        else
            print_error "Script de configuración IPFS no encontrado"
            return 1
        fi
    fi
    
    # Verificar conectividad
    if curl -s http://localhost:5001/api/v0/version > /dev/null 2>&1; then
        print_success "IPFS está funcionando correctamente"
        return 0
    else
        print_error "IPFS no responde en http://localhost:5001"
        return 1
    fi
}

# Función para verificar blockchain
verify_blockchain() {
    print_status "Verificando blockchain..."
    
    # Verificar si Hardhat está corriendo
    if curl -s -X POST -H "Content-Type: application/json" \
        --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
        http://localhost:8545 > /dev/null 2>&1; then
        print_success "Blockchain (Hardhat) está funcionando"
        return 0
    else
        print_error "Blockchain no responde en http://localhost:8545"
        return 1
    fi
}

# Función para verificar alineación de direcciones
verify_address_alignment() {
    print_status "Verificando alineación de direcciones..."
    
    local deployment_file="$HARDHAT_DIR/ignition/deployments/chain-31337/deployed_addresses.json"
    local api_config_file="$API_DIR/src/config/api_config.json"
    local frontend_config_file="$FRONTEND_DIR/src/config.ts"
    
    # Leer direcciones del despliegue
    if [ ! -f "$deployment_file" ]; then
        print_error "Archivo de despliegue no encontrado"
        return 1
    fi
    
    # Extraer direcciones del despliegue
    local deployed_addresses=$(cat "$deployment_file" | grep -o '"MusubiDeployment#[^"]*":"[^"]*"' | sed 's/.*":"//;s/"//g')
    
    # Verificar API
    if [ -f "$api_config_file" ]; then
        local api_addresses=$(cat "$api_config_file" | grep -o '"[^"]*":"[^"]*"' | sed 's/.*":"//;s/"//g')
        local api_mismatch=false
        
        for deployed_addr in $deployed_addresses; do
            if ! echo "$api_addresses" | grep -q "$deployed_addr"; then
                api_mismatch=true
                break
            fi
        done
        
        if [ "$api_mismatch" = true ]; then
            print_warning "API necesita sincronización"
            return 1
        else
            print_success "API está alineada"
        fi
    fi
    
    # Verificar Frontend
    if [ -f "$frontend_config_file" ]; then
        local frontend_addresses=$(cat "$frontend_config_file" | grep -o '"[^"]*":"[^"]*"' | sed 's/.*":"//;s/"//g')
        local frontend_mismatch=false
        
        for deployed_addr in $deployed_addresses; do
            if ! echo "$frontend_addresses" | grep -q "$deployed_addr"; then
                frontend_mismatch=true
                break
            fi
        done
        
        if [ "$frontend_mismatch" = true ]; then
            print_warning "Frontend necesita sincronización"
            return 1
        else
            print_success "Frontend está alineado"
        fi
    fi
    
    return 0
}

# Función para mostrar resumen de alineación
show_alignment_summary() {
    print_header "📊 Resumen de Alineación"
    echo ""
    
    # Verificar blockchain
    if verify_blockchain > /dev/null 2>&1; then
        print_success "Blockchain: Conectado"
    else
        print_error "Blockchain: Desconectado"
    fi
    
    # Verificar IPFS
    if verify_ipfs > /dev/null 2>&1; then
        print_success "IPFS: Conectado"
    else
        print_error "IPFS: Desconectado"
    fi
    
    # Verificar ABIs
    if verify_abis > /dev/null 2>&1; then
        print_success "ABIs: Disponibles"
    else
        print_warning "ABIs: Faltantes"
    fi
    
    # Verificar alineación
    if verify_address_alignment > /dev/null 2>&1; then
        print_success "Direcciones: Alineadas"
    else
        print_warning "Direcciones: Desalineadas"
    fi
    
    echo ""
}

# Función principal
main() {
    print_header "🔄 Verificación y Alineación Dinámica de Musubi"
    echo ""
    
    # Verificar servicios básicos
    print_status "Verificando servicios básicos..."
    
    local blockchain_ok=false
    local ipfs_ok=false
    local changes_detected=false
    
    if verify_blockchain; then
        blockchain_ok=true
    fi
    
    if verify_ipfs; then
        ipfs_ok=true
    fi
    
    # Detectar cambios en contratos
    if detect_contract_changes; then
        changes_detected=true
        print_warning "Cambios detectados en contratos - iniciando sincronización"
        
        # Sincronizar API
        if sync_api; then
            print_success "API sincronizada"
        else
            print_error "Error sincronizando API"
        fi
        
        # Sincronizar Frontend
        if sync_frontend; then
            print_success "Frontend sincronizado"
        else
            print_error "Error sincronizando Frontend"
        fi
    fi
    
    # Verificar ABIs
    verify_abis
    
    # Verificar alineación final
    verify_address_alignment
    
    # Mostrar resumen
    show_alignment_summary
    
    # Resultado final
    if [ "$blockchain_ok" = true ] && [ "$ipfs_ok" = true ]; then
        print_success "🎯 Sistema alineado y listo"
        return 0
    else
        print_error "⚠️  Sistema necesita configuración adicional"
        return 1
    fi
}

# Ejecutar función principal
main "$@" 