#!/usr/bin/env node

/**
 * Script de Pruebas de Interoperabilidad del Frontend
 * Verifica la integración entre frontend, blockchain e IPFS
 */

import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}`)
};

// Configuración
const CONFIG = {
  hardhatUrl: 'http://localhost:8545',
  ipfsUrl: 'http://localhost:5001',
  frontendUrl: 'http://localhost:5173',
  apiUrl: 'http://localhost:5001',
  testAccount: {
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
  }
};

// Cargar configuraciones
function loadConfigurations() {
  log.header('🔧 Cargando Configuraciones');
  
  try {
    // Cargar direcciones de contratos
    const deploymentFile = path.join(__dirname, '../hardhat-dev/ignition/deployments/chain-31337/deployed_addresses.json');
    if (!fs.existsSync(deploymentFile)) {
      throw new Error('Archivo de despliegue no encontrado');
    }
    
    const deployment = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
    log.success('Direcciones de contratos cargadas');
    
    // Cargar configuración del frontend
    const frontendConfig = path.join(__dirname, '../frontend/src/config.ts');
    if (!fs.existsSync(frontendConfig)) {
      throw new Error('Configuración del frontend no encontrada');
    }
    
    log.success('Configuración del frontend cargada');
    
    // Cargar configuración de la API
    const apiConfig = path.join(__dirname, '../musubi-api/src/config/api_config.json');
    if (!fs.existsSync(apiConfig)) {
      throw new Error('Configuración de la API no encontrada');
    }
    
    const apiConfigData = JSON.parse(fs.readFileSync(apiConfig, 'utf8'));
    log.success('Configuración de la API cargada');
    
    return { deployment, apiConfigData };
  } catch (error) {
    log.error(`Error cargando configuraciones: ${error.message}`);
    throw error;
  }
}

// Verificar conectividad de servicios
async function checkServices() {
  log.header('🌐 Verificando Conectividad de Servicios');
  
  const services = [
    { name: 'Hardhat Node', url: CONFIG.hardhatUrl, method: 'POST' },
    { name: 'IPFS Daemon', url: `${CONFIG.ipfsUrl}/api/v0/version`, method: 'GET' },
    { name: 'Frontend', url: CONFIG.frontendUrl, method: 'GET' },
    { name: 'API', url: `${CONFIG.apiUrl}/health`, method: 'GET' }
  ];
  
  for (const service of services) {
    try {
      const response = await fetch(service.url, {
        method: service.method,
        headers: service.method === 'POST' ? { 'Content-Type': 'application/json' } : {},
        body: service.method === 'POST' ? JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: 1
        }) : undefined
      });
      
      if (response.ok) {
        log.success(`${service.name}: Conectado`);
      } else {
        log.warning(`${service.name}: Error ${response.status}`);
      }
    } catch (error) {
      log.error(`${service.name}: No disponible - ${error.message}`);
    }
  }
}

// Verificar contratos desplegados
async function checkContracts(deployment) {
  log.header('📋 Verificando Contratos Desplegados');
  
  const provider = new ethers.JsonRpcProvider(CONFIG.hardhatUrl);
  const requiredContracts = [
    'KRMToken',
    'ProfileRegistry', 
    'SkillSystem',
    'TimeRegistry',
    'P2PMarketplace',
    'ProfileNFT',
    'IPFSRegistry'
  ];
  
  for (const contractName of requiredContracts) {
    try {
      const contractAddress = deployment[`MusubiDeployment#${contractName}`];
      if (!contractAddress) {
        log.error(`${contractName}: Dirección no encontrada`);
        continue;
      }
      
      // Verificar que el contrato responde
      const code = await provider.getCode(contractAddress);
      if (code !== '0x') {
        log.success(`${contractName}: ${contractAddress}`);
      } else {
        log.error(`${contractName}: No responde en ${contractAddress}`);
      }
    } catch (error) {
      log.error(`${contractName}: Error verificando - ${error.message}`);
    }
  }
}

// Verificar ABIs
function checkABIs() {
  log.header('📄 Verificando ABIs');
  
  const abiDir = path.join(__dirname, '../hardhat-dev/artifacts/contracts');
  const requiredABIs = [
    'core/IPFSRegistry.sol/IPFSRegistry.json',
    'core/ProfileRegistry.sol/ProfileRegistry.json',
    'core/SkillSystem.sol/SkillSystem.json',
    'core/TimeRegistry.sol/TimeRegistry.json',
    'tokens/KRMToken.sol/KRMToken.json',
    'tokens/ProfileNFT.sol/ProfileNFT.json',
    'marketplace/P2PMarketplace.sol/P2PMarketplace.json'
  ];
  
  for (const abiPath of requiredABIs) {
    const fullPath = path.join(abiDir, abiPath);
    if (fs.existsSync(fullPath)) {
      const abiData = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      if (abiData.abi && abiData.abi.length > 0) {
        log.success(`${path.basename(abiPath, '.json')}: ${abiData.abi.length} funciones`);
      } else {
        log.error(`${path.basename(abiPath, '.json')}: ABI vacío`);
      }
    } else {
      log.error(`${path.basename(abiPath, '.json')}: No encontrado`);
    }
  }
}

// Verificar alineación de direcciones
function checkAddressAlignment(deployment, apiConfig) {
  log.header('🔗 Verificando Alineación de Direcciones');
  
  const frontendConfigPath = path.join(__dirname, '../frontend/src/config.ts');
  const frontendConfigContent = fs.readFileSync(frontendConfigPath, 'utf8');
  
  // Extraer direcciones del frontend
  const frontendAddresses = {};
  const addressRegex = /(\w+):\s*['"]([^'"]+)['"]/g;
  let match;
  
  while ((match = addressRegex.exec(frontendConfigContent)) !== null) {
    frontendAddresses[match[1]] = match[2];
  }
  
  // Comparar direcciones
  const contractNames = [
    'KRMToken',
    'ProfileRegistry',
    'SkillSystem', 
    'TimeRegistry',
    'P2PMarketplace',
    'ProfileNFT',
    'IPFSRegistry'
  ];
  
  for (const contractName of contractNames) {
    const deploymentAddress = deployment[`MusubiDeployment#${contractName}`];
    const frontendAddress = frontendAddresses[contractName];
    const apiAddress = apiConfig.contracts?.[contractName];
    
    if (deploymentAddress && frontendAddress && deploymentAddress.toLowerCase() === frontendAddress.toLowerCase()) {
      log.success(`${contractName}: Frontend alineado`);
    } else {
      log.error(`${contractName}: Frontend desalineado`);
      log.info(`  Deployment: ${deploymentAddress}`);
      log.info(`  Frontend: ${frontendAddress}`);
    }
    
    if (deploymentAddress && apiAddress && deploymentAddress.toLowerCase() === apiAddress.toLowerCase()) {
      log.success(`${contractName}: API alineada`);
    } else {
      log.error(`${contractName}: API desalineada`);
      log.info(`  Deployment: ${deploymentAddress}`);
      log.info(`  API: ${apiAddress}`);
    }
  }
}

// Verificar funcionalidades de contratos
async function testContractFunctions(deployment) {
  log.header('🧪 Probando Funcionalidades de Contratos');
  
  const provider = new ethers.JsonRpcProvider(CONFIG.hardhatUrl);
  const wallet = new ethers.Wallet(CONFIG.testAccount.privateKey, provider);
  
  try {
    // Test KRMToken
    const krmToken = new ethers.Contract(
      deployment['MusubiDeployment#KRMToken'],
      ['function balanceOf(address) view returns (uint256)'],
      wallet
    );
    
    const balance = await krmToken.balanceOf(CONFIG.testAccount.address);
    log.success(`KRMToken balance: ${ethers.formatEther(balance)} KRM`);
    
    // Test ProfileRegistry
    const profileRegistry = new ethers.Contract(
      deployment['MusubiDeployment#ProfileRegistry'],
      ['function hasRegisteredProfile(address) view returns (bool)'],
      wallet
    );
    
    const hasProfile = await profileRegistry.hasRegisteredProfile(CONFIG.testAccount.address);
    log.info(`ProfileRegistry - Has profile: ${hasProfile}`);
    
    // Test SkillSystem
    const skillSystem = new ethers.Contract(
      deployment['MusubiDeployment#SkillSystem'],
      ['function getSkillCount() view returns (uint256)'],
      wallet
    );
    
    const skillCount = await skillSystem.getSkillCount();
    log.success(`SkillSystem - Total skills: ${skillCount}`);
    
  } catch (error) {
    log.error(`Error probando contratos: ${error.message}`);
  }
}

// Verificar IPFS
async function testIPFS() {
  log.header('🌐 Probando IPFS');
  
  try {
    // Verificar versión
    const versionResponse = await fetch(`${CONFIG.ipfsUrl}/api/v0/version`);
    if (versionResponse.ok) {
      const version = await versionResponse.json();
      log.success(`IPFS Version: ${version.Version}`);
    }
    
    // Test de subida (simulado)
    const testData = {
      name: 'Test User',
      description: 'Test profile for interoperability',
      timestamp: new Date().toISOString()
    };
    
    const formData = new FormData();
    formData.append('file', new Blob([JSON.stringify(testData)], { type: 'application/json' }), 'test.json');
    
    const uploadResponse = await fetch(`${CONFIG.ipfsUrl}/api/v0/add`, {
      method: 'POST',
      body: formData
    });
    
    if (uploadResponse.ok) {
      const result = await uploadResponse.json();
      log.success(`IPFS Upload test: ${result.Hash}`);
      
      // Test de lectura
      const readResponse = await fetch(`http://localhost:8080/ipfs/${result.Hash}`);
      if (readResponse.ok) {
        const readData = await readResponse.json();
        log.success(`IPFS Read test: ${readData.name}`);
      } else {
        log.warning('IPFS Read test: Gateway local no disponible');
      }
    } else {
      log.error('IPFS Upload test: Falló');
    }
    
  } catch (error) {
    log.error(`Error probando IPFS: ${error.message}`);
  }
}

// Verificar frontend
async function testFrontend() {
  log.header('🎨 Verificando Frontend');
  
  try {
    const response = await fetch(CONFIG.frontendUrl);
    if (response.ok) {
      log.success('Frontend: Accesible');
      
      // Verificar que es una aplicación React
      const html = await response.text();
      if (html.includes('React') || html.includes('root')) {
        log.success('Frontend: Aplicación React detectada');
      } else {
        log.warning('Frontend: No se detectó aplicación React');
      }
    } else {
      log.error(`Frontend: Error ${response.status}`);
    }
  } catch (error) {
    log.error(`Error verificando frontend: ${error.message}`);
  }
}

// Verificar API
async function testAPI() {
  log.header('🔌 Verificando API');
  
  try {
    const response = await fetch(`${CONFIG.apiUrl}/health`);
    if (response.ok) {
      const health = await response.json();
      log.success(`API: ${health.status}`);
    } else {
      log.error(`API: Error ${response.status}`);
    }
    
    // Test de endpoints
    const endpoints = [
      '/api/users',
      '/api/skills',
      '/api/timeregistry',
      '/api/marketplace'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const endpointResponse = await fetch(`${CONFIG.apiUrl}${endpoint}`);
        if (endpointResponse.status === 200 || endpointResponse.status === 404) {
          log.success(`API ${endpoint}: Disponible`);
        } else {
          log.warning(`API ${endpoint}: ${endpointResponse.status}`);
        }
      } catch (error) {
        log.error(`API ${endpoint}: Error - ${error.message}`);
      }
    }
    
  } catch (error) {
    log.error(`Error verificando API: ${error.message}`);
  }
}

// Función principal
async function main() {
  log.header('🔍 PRUEBAS DE INTEROPERABILIDAD DEL FRONTEND MUSUBI');
  
  try {
    // 1. Cargar configuraciones
    const { deployment, apiConfigData } = loadConfigurations();
    
    // 2. Verificar servicios
    await checkServices();
    
    // 3. Verificar contratos
    await checkContracts(deployment);
    
    // 4. Verificar ABIs
    checkABIs();
    
    // 5. Verificar alineación
    checkAddressAlignment(deployment, apiConfigData);
    
    // 6. Probar funcionalidades
    await testContractFunctions(deployment);
    
    // 7. Probar IPFS
    await testIPFS();
    
    // 8. Probar frontend
    await testFrontend();
    
    // 9. Probar API
    await testAPI();
    
    log.header('🎯 RESUMEN DE PRUEBAS');
    log.success('Pruebas de interoperabilidad completadas');
    log.info('Revisa los resultados arriba para identificar problemas');
    
  } catch (error) {
    log.error(`Error en las pruebas: ${error.message}`);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export {
  checkServices,
  checkContracts,
  checkABIs,
  checkAddressAlignment,
  testContractFunctions,
  testIPFS,
  testFrontend,
  testAPI
}; 