#!/bin/bash

# Script para configurar IPFS para Musubi
# Base de datos descentralizada para el proyecto blockchain

echo "🚀 Configurando IPFS para Musubi..."
echo "=================================="

# Verificar si IPFS ya está instalado
if command -v ipfs &> /dev/null; then
    echo "✅ IPFS ya está instalado"
    IPFS_VERSION=$(ipfs version)
    echo "📋 Versión: $IPFS_VERSION"
else
    echo "📥 Instalando IPFS..."
    
    # Detectar sistema operativo
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        echo "🍎 Detectado macOS"
        if command -v brew &> /dev/null; then
            brew install ipfs
        else
            echo "❌ Homebrew no está instalado. Instala Homebrew primero:"
            echo "   /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
            exit 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        echo "🐧 Detectado Linux"
        wget https://dist.ipfs.io/go-ipfs/v0.20.0/go-ipfs_v0.20.0_linux-amd64.tar.gz
        tar -xvzf go-ipfs_v0.20.0_linux-amd64.tar.gz
        cd go-ipfs
        sudo bash install.sh
        cd ..
        rm -rf go-ipfs go-ipfs_v0.20.0_linux-amd64.tar.gz
    else
        echo "❌ Sistema operativo no soportado: $OSTYPE"
        echo "📝 Instala IPFS manualmente desde: https://ipfs.io/docs/install/"
        exit 1
    fi
fi

# Inicializar IPFS si no está inicializado
if [ ! -d ~/.ipfs ]; then
    echo "🔧 Inicializando IPFS..."
    ipfs init
    echo "✅ IPFS inicializado"
else
    echo "✅ IPFS ya está inicializado"
fi

# Configurar IPFS para desarrollo local
echo "⚙️ Configurando IPFS para desarrollo..."

# Habilitar API HTTP
ipfs config Addresses.API /ip4/127.0.0.1/tcp/5001

# Habilitar Gateway HTTP
ipfs config Addresses.Gateway /ip4/127.0.0.1/tcp/8080

# Configurar CORS para desarrollo
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["*"]'
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods '["PUT", "POST", "GET"]'
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Headers '["Authorization"]'

# Configurar para desarrollo local (no usar DHT público)
ipfs config Routing.Type "none"

echo "✅ Configuración completada"

# Mostrar configuración
echo ""
echo "📋 Configuración de IPFS:"
echo "   API: http://localhost:5001"
echo "   Gateway: http://localhost:8080"
echo "   Directorio de datos: ~/.ipfs"

# Verificar si IPFS está corriendo
if pgrep -x "ipfs" > /dev/null; then
    echo "✅ IPFS ya está corriendo"
else
    echo ""
    echo "🚀 Para iniciar IPFS, ejecuta:"
    echo "   ipfs daemon"
    echo ""
    echo "🔗 O en segundo plano:"
    echo "   ipfs daemon &"
fi

echo ""
echo "🎯 Próximos pasos:"
echo "   1. Inicia IPFS: ipfs daemon"
echo "   2. Verifica la conexión: curl http://localhost:5001/api/v0/version"
echo "   3. La API de Musubi se conectará automáticamente a IPFS"
echo ""
echo "📚 Documentación:"
echo "   - IPFS: https://ipfs.io/docs/"
echo "   - API: http://localhost:5001/docs (cuando Musubi esté corriendo)"
echo ""
echo "✨ ¡IPFS configurado para Musubi!" 