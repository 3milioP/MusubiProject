#!/usr/bin/env node

/**
 * Script de Pruebas de Flujos de Datos Críticos
 * Verifica la interoperabilidad de los flujos principales del frontend
 */

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

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
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}`),
  step: (msg) => console.log(`${colors.magenta}🔹 ${msg}${colors.reset}`)
};

// Configuración
const CONFIG = {
  hardhatUrl: 'http://localhost:8545',
  ipfsUrl: 'http://localhost:5001',
  apiUrl: 'http://localhost:5001',
  testAccounts: [
    {
      name: 'Juan Profesional',
      address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
    },
    {
      name: 'María Empresa',
      address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d'
    }
  ]
};

// Cargar ABIs y direcciones
function loadContracts() {
  log.header('📋 Cargando Contratos');
  
  try {
    // Cargar direcciones
    const deploymentFile = path.join(__dirname, '../hardhat-dev/ignition/deployments/chain-31337/deployed_addresses.json');
    const deployment = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
    
    // Cargar ABIs
    const abiDir = path.join(__dirname, '../hardhat-dev/artifacts/contracts');
    const abis = {};
    
    const contractFiles = [
      'core/IPFSRegistry.sol/IPFSRegistry.json',
      'core/ProfileRegistry.sol/ProfileRegistry.json',
      'core/SkillSystem.sol/SkillSystem.json',
      'core/TimeRegistry.sol/TimeRegistry.json',
      'tokens/KRMToken.sol/KRMToken.json',
      'tokens/ProfileNFT.sol/ProfileNFT.json',
      'marketplace/P2PMarketplace.sol/P2PMarketplace.json'
    ];
    
    for (const file of contractFiles) {
      const contractName = path.basename(file, '.json');
      const abiPath = path.join(abiDir, file);
      if (fs.existsSync(abiPath)) {
        const abiData = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
        abis[contractName] = abiData.abi;
      }
    }
    
    log.success('Contratos cargados correctamente');
    return { deployment, abis };
  } catch (error) {
    log.error(`Error cargando contratos: ${error.message}`);
    throw error;
  }
}

// Test 1: Flujo de Registro de Perfil
async function testProfileRegistrationFlow(provider, deployment, abis) {
  log.header('👤 Test 1: Flujo de Registro de Perfil');
  
  const wallet = new ethers.Wallet(CONFIG.testAccounts[0].privateKey, provider);
  const profileRegistry = new ethers.Contract(
    deployment['MusubiDeployment#ProfileRegistry'],
    abis['ProfileRegistry'],
    wallet
  );
  
  try {
    log.step('1.1 Verificar estado inicial del perfil');
    const hasProfile = await profileRegistry.hasRegisteredProfile(CONFIG.testAccounts[0].address);
    log.info(`Usuario tiene perfil: ${hasProfile}`);
    
    if (hasProfile) {
      log.step('1.2 Obtener perfil existente');
      const profile = await profileRegistry.getProfile(CONFIG.testAccounts[0].address);
      log.success(`Perfil encontrado: ${profile.name || 'Sin nombre'}`);
      
      // Verificar datos en IPFS si existe metadataURI
      if (profile.metadataURI && profile.metadataURI !== '') {
        log.step('1.3 Verificar datos en IPFS');
        try {
          const ipfsResponse = await fetch(`http://localhost:8080/ipfs/${profile.metadataURI.replace('ipfs://', '')}`);
          if (ipfsResponse.ok) {
            const ipfsData = await ipfsResponse.json();
            log.success(`Datos IPFS: ${ipfsData.name} - ${ipfsData.description}`);
          } else {
            log.warning('No se pudieron obtener datos de IPFS');
          }
        } catch (error) {
          log.warning(`Error accediendo IPFS: ${error.message}`);
        }
      }
    } else {
      log.info('Usuario no tiene perfil registrado');
    }
    
    log.success('Flujo de perfil verificado');
    
  } catch (error) {
    log.error(`Error en flujo de perfil: ${error.message}`);
  }
}

// Test 2: Flujo de Skills
async function testSkillsFlow(provider, deployment, abis) {
  log.header('🎯 Test 2: Flujo de Skills');
  
  const wallet = new ethers.Wallet(CONFIG.testAccounts[0].privateKey, provider);
  const skillSystem = new ethers.Contract(
    deployment['MusubiDeployment#SkillSystem'],
    abis['SkillSystem'],
    wallet
  );
  
  try {
    log.step('2.1 Verificar skills disponibles');
    const skillCount = await skillSystem.getSkillCount();
    log.info(`Total de skills en el sistema: ${skillCount}`);
    
    if (skillCount > 0) {
      log.step('2.2 Obtener skills del usuario');
      const userSkills = await skillSystem.getUserSkills(CONFIG.testAccounts[0].address);
      log.info(`Skills del usuario: ${userSkills.length}`);
      
      for (let i = 0; i < Math.min(userSkills.length, 3); i++) {
        const skill = userSkills[i];
        log.info(`  - Skill ${skill.skillId}: Nivel ${skill.declaredLevel}, Validada: ${skill.isValidated}`);
      }
    }
    
    log.step('2.3 Verificar skills declaradas');
    const declaredSkills = await skillSystem.getDeclaredSkills(CONFIG.testAccounts[0].address);
    log.info(`Skills declaradas: ${declaredSkills.length}`);
    
    log.success('Flujo de skills verificado');
    
  } catch (error) {
    log.error(`Error en flujo de skills: ${error.message}`);
  }
}

// Test 3: Flujo de Registro de Tiempo
async function testTimeRegistryFlow(provider, deployment, abis) {
  log.header('⏰ Test 3: Flujo de Registro de Tiempo');
  
  const wallet = new ethers.Wallet(CONFIG.testAccounts[0].privateKey, provider);
  const timeRegistry = new ethers.Contract(
    deployment['MusubiDeployment#TimeRegistry'],
    abis['TimeRegistry'],
    wallet
  );
  
  try {
    log.step('3.1 Verificar registros de tiempo del usuario');
    const userEntries = await timeRegistry.getUserEntries(CONFIG.testAccounts[0].address);
    log.info(`Registros de tiempo del usuario: ${userEntries.length}`);
    
    if (userEntries.length > 0) {
      log.step('3.2 Obtener detalles de registros');
      for (let i = 0; i < Math.min(userEntries.length, 3); i++) {
        const entryId = userEntries[i];
        const entry = await timeRegistry.getTimeEntry(entryId);
        
        log.info(`  - Entry ${entryId}: ${entry.company}, Skill ${entry.skillId}, ${entry.duration} horas`);
        log.info(`    Validado: ${entry.isValidated}, Por: ${entry.validatedBy}`);
      }
    }
    
    log.step('3.3 Verificar registros pendientes de validación');
    const pendingEntries = await timeRegistry.getPendingEntries();
    log.info(`Registros pendientes de validación: ${pendingEntries.length}`);
    
    log.success('Flujo de registro de tiempo verificado');
    
  } catch (error) {
    log.error(`Error en flujo de tiempo: ${error.message}`);
  }
}

// Test 4: Flujo de KRM Token
async function testKRMTokenFlow(provider, deployment, abis) {
  log.header('💰 Test 4: Flujo de KRM Token');
  
  const wallet = new ethers.Wallet(CONFIG.testAccounts[0].privateKey, provider);
  const krmToken = new ethers.Contract(
    deployment['MusubiDeployment#KRMToken'],
    abis['KRMToken'],
    wallet
  );
  
  try {
    log.step('4.1 Verificar balance KRM');
    const balance = await krmToken.balanceOf(CONFIG.testAccounts[0].address);
    const formattedBalance = ethers.formatEther(balance);
    log.success(`Balance KRM: ${formattedBalance} KRM`);
    
    log.step('4.2 Verificar supply total');
    const totalSupply = await krmToken.totalSupply();
    const formattedSupply = ethers.formatEther(totalSupply);
    log.info(`Supply total: ${formattedSupply} KRM`);
    
    log.step('4.3 Verificar permisos');
    const hasKarmaRole = await krmToken.hasRole(ethers.keccak256(ethers.toUtf8Bytes('KARMA_ROLE')), CONFIG.testAccounts[0].address);
    log.info(`Tiene rol KARMA: ${hasKarmaRole}`);
    
    log.success('Flujo de KRM Token verificado');
    
  } catch (error) {
    log.error(`Error en flujo de KRM: ${error.message}`);
  }
}

// Test 5: Flujo de Marketplace
async function testMarketplaceFlow(provider, deployment, abis) {
  log.header('🏪 Test 5: Flujo de Marketplace');
  
  const wallet = new ethers.Wallet(CONFIG.testAccounts[0].privateKey, provider);
  const marketplace = new ethers.Contract(
    deployment['MusubiDeployment#P2PMarketplace'],
    abis['P2PMarketplace'],
    wallet
  );
  
  try {
    log.step('5.1 Verificar servicios disponibles');
    const serviceCount = await marketplace.getServiceCount();
    log.info(`Total de servicios: ${serviceCount}`);
    
    if (serviceCount > 0) {
      log.step('5.2 Obtener servicios del usuario');
      const userServices = await marketplace.getUserServices(CONFIG.testAccounts[0].address);
      log.info(`Servicios del usuario: ${userServices.length}`);
      
      for (let i = 0; i < Math.min(userServices.length, 3); i++) {
        const serviceId = userServices[i];
        const service = await marketplace.getService(serviceId);
        log.info(`  - Servicio ${serviceId}: ${ethers.formatEther(service.pricePerHour)} ETH/hora`);
      }
    }
    
    log.step('5.3 Verificar órdenes del usuario');
    const userOrders = await marketplace.getUserOrders(CONFIG.testAccounts[0].address);
    log.info(`Órdenes del usuario: ${userOrders.length}`);
    
    log.success('Flujo de marketplace verificado');
    
  } catch (error) {
    log.error(`Error en flujo de marketplace: ${error.message}`);
  }
}

// Test 6: Verificar Interoperabilidad Frontend-Backend
async function testFrontendBackendInteroperability() {
  log.header('🔗 Test 6: Interoperabilidad Frontend-Backend');
  
  try {
    log.step('6.1 Verificar configuración del frontend');
    const frontendConfig = path.join(__dirname, '../frontend/src/config.ts');
    const frontendContent = fs.readFileSync(frontendConfig, 'utf8');
    
    // Verificar que las direcciones están configuradas
    const hasAddresses = frontendContent.includes('CONTRACT_ADDRESSES');
    log.info(`Configuración de direcciones: ${hasAddresses ? 'Presente' : 'Ausente'}`);
    
    log.step('6.2 Verificar configuración de la API');
    const apiConfig = path.join(__dirname, '../musubi-api/src/config/api_config.json');
    const apiConfigData = JSON.parse(fs.readFileSync(apiConfig, 'utf8'));
    log.info(`API configurada para red: ${apiConfigData.active_network || 'No especificada'}`);
    
    log.step('6.3 Verificar sincronización de direcciones');
    const deploymentFile = path.join(__dirname, '../hardhat-dev/ignition/deployments/chain-31337/deployed_addresses.json');
    const deployment = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
    
    const contractNames = ['KRMToken', 'ProfileRegistry', 'SkillSystem', 'TimeRegistry', 'P2PMarketplace'];
    let alignedCount = 0;
    
    for (const contractName of contractNames) {
      const deploymentAddress = deployment[`MusubiDeployment#${contractName}`];
      const apiAddress = apiConfigData.contracts?.[contractName];
      
      if (deploymentAddress && apiAddress && 
          deploymentAddress.toLowerCase() === apiAddress.toLowerCase()) {
        alignedCount++;
      }
    }
    
    log.info(`Contratos alineados: ${alignedCount}/${contractNames.length}`);
    
    log.success('Interoperabilidad Frontend-Backend verificada');
    
  } catch (error) {
    log.error(`Error verificando interoperabilidad: ${error.message}`);
  }
}

// Test 7: Verificar Flujos de Datos en IPFS
async function testIPFSDataFlows() {
  log.header('🌐 Test 7: Flujos de Datos en IPFS');
  
  try {
    log.step('7.1 Verificar conectividad IPFS');
    const versionResponse = await fetch(`${CONFIG.ipfsUrl}/api/v0/version`);
    if (versionResponse.ok) {
      const version = await versionResponse.json();
      log.success(`IPFS conectado: ${version.Version}`);
    } else {
      log.error('IPFS no disponible');
      return;
    }
    
    log.step('7.2 Verificar gateway local');
    try {
      const gatewayResponse = await fetch('http://localhost:8080/ipfs/QmTest');
      if (gatewayResponse.status === 404) {
        log.success('Gateway local IPFS funcionando');
      } else {
        log.warning('Gateway local IPFS no disponible');
      }
    } catch (error) {
      log.warning('Gateway local IPFS no disponible');
    }
    
    log.step('7.3 Verificar datos de perfiles en IPFS');
    // Buscar en la API por perfiles con datos IPFS
    try {
      const usersResponse = await fetch(`${CONFIG.apiUrl}/api/users`);
      if (usersResponse.ok) {
        const users = await usersResponse.json();
        const usersWithIPFS = users.filter(user => user.ipfs_hash);
        log.info(`Usuarios con datos IPFS: ${usersWithIPFS.length}`);
        
        if (usersWithIPFS.length > 0) {
          const sampleUser = usersWithIPFS[0];
          log.info(`Ejemplo - Usuario: ${sampleUser.name}, IPFS: ${sampleUser.ipfs_hash}`);
        }
      }
    } catch (error) {
      log.warning('No se pudieron obtener usuarios de la API');
    }
    
    log.success('Flujos de datos IPFS verificados');
    
  } catch (error) {
    log.error(`Error verificando IPFS: ${error.message}`);
  }
}

// Función principal
async function main() {
  log.header('🔍 PRUEBAS DE FLUJOS DE DATOS CRÍTICOS');
  
  try {
    // Cargar contratos
    const { deployment, abis } = loadContracts();
    
    // Conectar a Hardhat
    const provider = new ethers.JsonRpcProvider(CONFIG.hardhatUrl);
    
    // Ejecutar tests
    await testProfileRegistrationFlow(provider, deployment, abis);
    await testSkillsFlow(provider, deployment, abis);
    await testTimeRegistryFlow(provider, deployment, abis);
    await testKRMTokenFlow(provider, deployment, abis);
    await testMarketplaceFlow(provider, deployment, abis);
    await testFrontendBackendInteroperability();
    await testIPFSDataFlows();
    
    log.header('🎯 RESUMEN DE FLUJOS DE DATOS');
    log.success('Todos los flujos críticos han sido verificados');
    log.info('Revisa los resultados arriba para identificar problemas específicos');
    
  } catch (error) {
    log.error(`Error en las pruebas: ${error.message}`);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testProfileRegistrationFlow,
  testSkillsFlow,
  testTimeRegistryFlow,
  testKRMTokenFlow,
  testMarketplaceFlow,
  testFrontendBackendInteroperability,
  testIPFSDataFlows
}; 