#!/usr/bin/env node
/**
 * Script de sincronización de direcciones de contratos para el Frontend
 * Lee automáticamente las direcciones desde los archivos de despliegue de Hardhat Ignition
 * y actualiza la configuración del frontend.
 */

const fs = require('fs');
const path = require('path');

// Colores para output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  bold: '\x1b[1m',
  reset: '\x1b[0m'
};

function printStatus(message, color = colors.blue) {
  console.log(`${color}${message}${colors.reset}`);
}

function printSuccess(message) {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function printWarning(message) {
  console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

function printError(message) {
  console.log(`${colors.red}❌ ${message}${colors.reset}`);
}

function getProjectRoot() {
  return path.resolve(__dirname, '..');
}

function getAvailableNetworks() {
  const projectRoot = getProjectRoot();
  const ignitionDir = path.join(projectRoot, 'hardhat-dev', 'ignition', 'deployments');
  
  const networks = {};
  
  if (!fs.existsSync(ignitionDir)) {
    printWarning(`Directorio de despliegues no encontrado: ${ignitionDir}`);
    return networks;
  }
  
  // Buscar directorios de redes (chain-*)
  const chainDirs = fs.readdirSync(ignitionDir)
    .filter(dir => dir.startsWith('chain-'))
    .map(dir => path.join(ignitionDir, dir));
  
  for (const chainDir of chainDirs) {
    const chainId = path.basename(chainDir).replace('chain-', '');
    const deployedFile = path.join(chainDir, 'deployed_addresses.json');
    
    if (fs.existsSync(deployedFile)) {
      try {
        const addresses = JSON.parse(fs.readFileSync(deployedFile, 'utf8'));
        
        // Mapear nombres de red
        const networkName = getNetworkName(chainId);
        networks[networkName] = {
          chain_id: chainId,
          deployment_path: deployedFile,
          addresses: addresses
        };
        printSuccess(`Red encontrada: ${networkName} (Chain ID: ${chainId})`);
      } catch (error) {
        printError(`Error leyendo ${deployedFile}: ${error.message}`);
      }
    }
  }
  
  return networks;
}

function getNetworkName(chainId) {
  const networkMap = {
    "31337": "local",
    "11155111": "sepolia", 
    "80002": "polygon_amoy",
    "137": "polygon",
    "1": "ethereum",
    "56": "bsc",
    "42161": "arbitrum"
  };
  return networkMap[chainId] || `chain_${chainId}`;
}

function createFrontendConfig(networks, selectedNetwork = null) {
  const projectRoot = getProjectRoot();
  
  // Configuración base de redes
  const networksConfig = {
    'local': {
      rpc_url: 'http://localhost:8545',
      chain_id: 31337,
      name: 'Musubi Local'
    },
    'sepolia': {
      name: 'Sepolia Testnet',
      rpc_url: `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID || ''}`,
      chain_id: 11155111,
      explorer_url: 'https://sepolia.etherscan.io'
    },
    'polygon_amoy': {
      name: 'Polygon Amoy Testnet',
      rpc_url: `https://polygon-amoy.infura.io/v3/${process.env.INFURA_PROJECT_ID || ''}`,
      chain_id: 80002,
      explorer_url: 'https://amoy.polygonscan.com'
    },
    'polygon': {
      name: 'Polygon Mainnet',
      rpc_url: `https://polygon-mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID || ''}`,
      chain_id: 137,
      explorer_url: 'https://polygonscan.com'
    }
  };
  
  // Direcciones de contratos por red
  const contractAddresses = {};
  
  for (const [networkName, networkData] of Object.entries(networks)) {
    if (networksConfig[networkName]) {
      // Mapear direcciones desde el formato de Ignition
      const addresses = {};
      for (const [contractKey, address] of Object.entries(networkData.addresses)) {
        // Convertir "MusubiDeployment#KRMToken" a "KRMToken"
        const contractName = contractKey.split('#').pop();
        addresses[contractName] = address;
      }
      
      contractAddresses[networkName] = addresses;
    }
  }
  
  // Si no hay redes disponibles, usar configuración por defecto
  if (Object.keys(contractAddresses).length === 0) {
    printWarning("No se encontraron redes desplegadas, usando configuración por defecto");
    contractAddresses.local = {
      KRMToken: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      ProfileRegistry: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
      SkillSystem: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
      TimeRegistry: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
      P2PMarketplace: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9'
    };
  }
  
  // Configuración final
  const config = {
    networks: networksConfig,
    contract_addresses: contractAddresses,
    active_network: selectedNetwork || 'local',
    last_sync: new Date().toISOString(),
    artifacts_path: path.join(projectRoot, 'hardhat-dev', 'artifacts', 'contracts')
  };
  
  return config;
}

function generateFrontendConfig(config) {
  const projectRoot = getProjectRoot();
  const frontendConfigPath = path.join(projectRoot, 'frontend', 'src', 'config.ts');
  
  // Obtener las direcciones de la red activa
  const activeNetwork = config.active_network;
  const addresses = config.contract_addresses[activeNetwork] || {};
  
  // Generar el contenido del archivo config.ts
  const configContent = `// Configuración automáticamente generada por sync_frontend_addresses.js
// Última sincronización: ${config.last_sync}
// Red activa: ${activeNetwork}

export const CONTRACT_ADDRESSES = {
  KRMToken: "${addresses.KRMToken || '0x0000000000000000000000000000000000000000'}",
  ProfileRegistry: "${addresses.ProfileRegistry || '0x0000000000000000000000000000000000000000'}",
  SkillSystem: "${addresses.SkillSystem || '0x0000000000000000000000000000000000000000'}",
  TimeRegistry: "${addresses.TimeRegistry || '0x0000000000000000000000000000000000000000'}",
  P2PMarketplace: "${addresses.P2PMarketplace || '0x0000000000000000000000000000000000000000'}",
  ProfileNFT: "${addresses.ProfileNFT || '0x0000000000000000000000000000000000000000'}",
  IPFSRegistry: "${addresses.IPFSRegistry || '0x0000000000000000000000000000000000000000'}"
};

export const CHAIN_ID = ${config.networks[activeNetwork]?.chain_id || 31337};
export const RPC_URL = "${config.networks[activeNetwork]?.rpc_url || 'http://localhost:8545'}";

// Configuración completa para referencia
export const NETWORK_CONFIG = ${JSON.stringify(config, null, 2)};
`;
  
  // Crear directorio si no existe
  const configDir = path.dirname(frontendConfigPath);
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  // Escribir archivo
  fs.writeFileSync(frontendConfigPath, configContent, 'utf8');
  
  return frontendConfigPath;
}

function main() {
  printStatus(`${colors.bold}🔄 Sincronizando direcciones de contratos para Frontend${colors.reset}`);
  console.log();
  
  // Obtener redes disponibles
  const networks = getAvailableNetworks();
  
  if (Object.keys(networks).length === 0) {
    printError("No se encontraron redes desplegadas");
    printWarning("Ejecuta primero el despliegue de contratos");
    process.exit(1);
  }
  
  // Mostrar redes disponibles
  printStatus("📡 Redes disponibles:");
  Object.entries(networks).forEach(([networkName, networkData], index) => {
    console.log(`  ${index + 1}. ${networkName} (Chain ID: ${networkData.chain_id})`);
  });
  
  // Selección de red (por ahora usar la primera disponible)
  const selectedNetwork = Object.keys(networks)[0];
  printSuccess(`Red seleccionada: ${selectedNetwork}`);
  
  // Crear configuración
  const config = createFrontendConfig(networks, selectedNetwork);
  
  // Generar archivo de configuración del frontend
  const configFile = generateFrontendConfig(config);
  printSuccess(`Configuración guardada en: ${configFile}`);
  
  // Mostrar resumen
  console.log();
  printStatus(`${colors.bold}📋 Resumen de la configuración:${colors.reset}`);
  console.log(`  Red activa: ${config.active_network}`);
  console.log(`  Redes configuradas: ${Object.keys(config.contract_addresses).join(', ')}`);
  
  Object.entries(config.contract_addresses).forEach(([networkName, addresses]) => {
    console.log(`  ${networkName}: ${Object.keys(addresses).length} contratos`);
  });
  
  console.log();
  printSuccess("✅ Sincronización completada");
  console.log("El frontend usará automáticamente esta configuración al reiniciarse");
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}

module.exports = {
  getAvailableNetworks,
  createFrontendConfig,
  generateFrontendConfig
}; 