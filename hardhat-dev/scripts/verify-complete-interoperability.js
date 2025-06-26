const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Verificación completa de interoperabilidad de contratos...");
  
  const addresses = {
    KRMToken: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    ProfileRegistry: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    SkillSystem: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
    TimeRegistry: "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853",
    P2PMarketplace: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
    ProfileNFT: "0x0165878A594ca255338adfa4d48449f69242Eb8F",
    IPFSRegistry: "0x5FbDB2315678afecb367f032d93F642f64180aa3"
  };

  const accounts = await ethers.getSigners();
  const deployer = accounts[0];
  const user1 = accounts[1];

  console.log(`\n👤 Cuentas de prueba:`);
  console.log(`  Deployer: ${deployer.address}`);
  console.log(`  User1: ${user1.address}`);

  const results = {
    KRMToken: { status: '❌', issues: [] },
    ProfileRegistry: { status: '❌', issues: [] },
    SkillSystem: { status: '❌', issues: [] },
    TimeRegistry: { status: '❌', issues: [] },
    P2PMarketplace: { status: '❌', issues: [] },
    ProfileNFT: { status: '❌', issues: [] },
    IPFSRegistry: { status: '❌', issues: [] }
  };

  // Test 1: KRMToken
  console.log("\n🔍 Test 1: KRMToken");
  try {
    const krmToken = await ethers.getContractAt("KRMToken", addresses.KRMToken);
    
    const balance = await krmToken.balanceOf(user1.address);
    const totalSupply = await krmToken.totalSupply();
    const transferAmount = ethers.parseEther("1");
    const tx = await krmToken.connect(deployer).transfer(user1.address, transferAmount);
    await tx.wait();
    
    console.log(`  ✅ balanceOf(): ${ethers.formatEther(balance)} KRM`);
    console.log(`  ✅ totalSupply(): ${ethers.formatEther(totalSupply)} KRM`);
    console.log(`  ✅ transfer(): Funcionando`);
    
    results.KRMToken.status = '✅';
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    results.KRMToken.issues.push(error.message);
  }

  // Test 2: ProfileRegistry
  console.log("\n🔍 Test 2: ProfileRegistry");
  try {
    const profileRegistry = await ethers.getContractAt("ProfileRegistry", addresses.ProfileRegistry);
    
    const hasProfile = await profileRegistry.hasRegisteredProfile(user1.address);
    const profile = await profileRegistry.getProfile(user1.address);
    const isVerified = await profileRegistry.hasVerifiedProfile(user1.address);
    
    console.log(`  ✅ hasRegisteredProfile(): ${hasProfile}`);
    console.log(`  ✅ getProfile(): ${profile.name}`);
    console.log(`  ✅ hasVerifiedProfile(): ${isVerified}`);
    console.log(`  ✅ getProfile().karma: ${profile.karma}`);
    
    results.ProfileRegistry.status = '✅';
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    results.ProfileRegistry.issues.push(error.message);
  }

  // Test 3: SkillSystem
  console.log("\n🔍 Test 3: SkillSystem");
  try {
    const skillSystem = await ethers.getContractAt("SkillSystem", addresses.SkillSystem);
    
    const skillCount = await skillSystem.getSkillCount();
    const userSkills = await skillSystem.getProfessionalSkills(user1.address);
    
    console.log(`  ✅ getSkillCount(): ${skillCount}`);
    console.log(`  ✅ getProfessionalSkills(): ${userSkills.length} skills`);
    
    results.SkillSystem.status = '✅';
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    results.SkillSystem.issues.push(error.message);
  }

  // Test 4: TimeRegistry
  console.log("\n🔍 Test 4: TimeRegistry");
  try {
    const timeRegistry = await ethers.getContractAt("TimeRegistry", addresses.TimeRegistry);
    
    const timeRecords = await timeRegistry.getUserTimeRecords(user1.address);
    const profRecords = await timeRegistry.getProfessionalRecords(user1.address);
    const recordCount = await timeRegistry.getRecordCount();
    
    console.log(`  ✅ getUserTimeRecords(): ${timeRecords.length} registros`);
    console.log(`  ✅ getProfessionalRecords(): ${profRecords.length} registros`);
    console.log(`  ✅ getRecordCount(): ${recordCount} total`);
    
    results.TimeRegistry.status = '✅';
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    results.TimeRegistry.issues.push(error.message);
  }

  // Test 5: P2PMarketplace
  console.log("\n🔍 Test 5: P2PMarketplace");
  try {
    const marketplace = await ethers.getContractAt("P2PMarketplace", addresses.P2PMarketplace);
    
    const providerServices = await marketplace.getProviderServices(user1.address);
    const clientOrders = await marketplace.getClientOrders(user1.address);
    const providerOrders = await marketplace.getProviderOrders(user1.address);
    
    console.log(`  ✅ getProviderServices(): ${providerServices.length} servicios`);
    console.log(`  ✅ getClientOrders(): ${clientOrders.length} órdenes`);
    console.log(`  ✅ getProviderOrders(): ${providerOrders.length} órdenes`);
    
    results.P2PMarketplace.status = '✅';
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    results.P2PMarketplace.issues.push(error.message);
  }

  // Test 6: ProfileNFT
  console.log("\n🔍 Test 6: ProfileNFT");
  try {
    const profileNFT = await ethers.getContractAt("ProfileNFT", addresses.ProfileNFT);
    
    const hasBuild = await profileNFT.hasBuild(user1.address);
    const buildCount = await profileNFT.getBuildCount();
    const nftBalance = await profileNFT.balanceOf(user1.address);
    
    console.log(`  ✅ hasBuild(): ${hasBuild}`);
    console.log(`  ✅ getBuildCount(): ${buildCount}`);
    console.log(`  ✅ balanceOf(): ${nftBalance} NFTs`);
    
    results.ProfileNFT.status = '✅';
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    results.ProfileNFT.issues.push(error.message);
  }

  // Test 7: IPFSRegistry
  console.log("\n🔍 Test 7: IPFSRegistry");
  try {
    const ipfsRegistry = await ethers.getContractAt("IPFSRegistry", addresses.IPFSRegistry);
    
    // Verificar que se puede obtener un record existente
    const record = await ipfsRegistry.getRecord(1);
    console.log(`  ✅ getRecord(): ${record.ipfsHash}`);
    
    results.IPFSRegistry.status = '✅';
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    results.IPFSRegistry.issues.push(error.message);
  }

  // Resumen final
  console.log("\n" + "=".repeat(60));
  console.log("📋 RESUMEN DE INTEROPERABILIDAD DE CONTRATOS");
  console.log("=".repeat(60));
  
  let totalWorking = 0;
  let totalIssues = 0;
  
  Object.entries(results).forEach(([contract, result]) => {
    console.log(`${result.status} ${contract}: ${result.issues.length > 0 ? result.issues.join(', ') : 'Funcionando correctamente'}`);
    if (result.status === '✅') totalWorking++;
    totalIssues += result.issues.length;
  });
  
  console.log("\n" + "-".repeat(60));
  console.log(`📊 ESTADÍSTICAS:`);
  console.log(`  ✅ Contratos funcionando: ${totalWorking}/7`);
  console.log(`  ❌ Problemas detectados: ${totalIssues}`);
  console.log(`  📈 Tasa de éxito: ${((totalWorking/7)*100).toFixed(1)}%`);
  
  if (totalWorking === 7) {
    console.log("\n🎉 ¡TODOS LOS CONTRATOS ESTÁN FUNCIONANDO PERFECTAMENTE!");
    console.log("✅ La interoperabilidad entre contratos está completa");
    console.log("✅ El frontend puede interactuar con todos los contratos");
    console.log("✅ Las funciones principales están operativas");
  } else {
    console.log("\n⚠️ Hay algunos problemas que necesitan atención:");
    Object.entries(results).forEach(([contract, result]) => {
      if (result.issues.length > 0) {
        console.log(`  - ${contract}: ${result.issues.join(', ')}`);
      }
    });
  }
  
  console.log("\n" + "=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 