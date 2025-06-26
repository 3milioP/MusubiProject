const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Probando interoperabilidad de contratos...");
  
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
  const user2 = accounts[2];

  console.log(`\n👤 Cuentas de prueba:`);
  console.log(`  Deployer: ${deployer.address}`);
  console.log(`  User1: ${user1.address}`);
  console.log(`  User2: ${user2.address}`);

  // Test 1: KRMToken
  console.log("\n🔍 Test 1: KRMToken");
  try {
    const krmToken = await ethers.getContractAt("KRMToken", addresses.KRMToken);
    
    // Verificar balance
    const balance = await krmToken.balanceOf(user1.address);
    console.log(`  ✅ Balance de User1: ${ethers.formatEther(balance)} KRM`);
    
    // Verificar total supply
    const totalSupply = await krmToken.totalSupply();
    console.log(`  ✅ Total Supply: ${ethers.formatEther(totalSupply)} KRM`);
    
    // Verificar que se puede transferir
    const transferAmount = ethers.parseEther("10");
    const tx = await krmToken.connect(deployer).transfer(user2.address, transferAmount);
    await tx.wait();
    console.log(`  ✅ Transferencia exitosa: 10 KRM de Deployer a User2`);
    
  } catch (error) {
    console.log(`  ❌ Error en KRMToken: ${error.message}`);
  }

  // Test 2: ProfileRegistry
  console.log("\n🔍 Test 2: ProfileRegistry");
  try {
    const profileRegistry = await ethers.getContractAt("ProfileRegistry", addresses.ProfileRegistry);
    
    // Verificar si User1 tiene perfil
    const profile = await profileRegistry.getProfile(user1.address);
    console.log(`  ✅ Perfil de User1 obtenido: ${profile.name}`);
    
    // Verificar funciones de roles
    const hasRole = await profileRegistry.hasRole(await profileRegistry.DEFAULT_ADMIN_ROLE(), deployer.address);
    console.log(`  ✅ Deployer tiene rol admin: ${hasRole}`);
    
  } catch (error) {
    console.log(`  ❌ Error en ProfileRegistry: ${error.message}`);
  }

  // Test 3: SkillSystem
  console.log("\n🔍 Test 3: SkillSystem");
  try {
    const skillSystem = await ethers.getContractAt("SkillSystem", addresses.SkillSystem);
    
    // Verificar skills count
    const skillsCount = await skillSystem.getSkillCount();
    console.log(`  ✅ Número de skills: ${skillsCount}`);
    
    // Verificar que se puede crear una skill
    const tx = await skillSystem.connect(deployer).createSkill("JavaScript", "Programming");
    await tx.wait();
    console.log(`  ✅ Skill "JavaScript" creada`);
    
    // Verificar skills del usuario
    const userSkills = await skillSystem.getProfessionalSkills(user1.address);
    console.log(`  ✅ Skills declaradas por User1: ${userSkills.length}`);
    
  } catch (error) {
    console.log(`  ❌ Error en SkillSystem: ${error.message}`);
  }

  // Test 4: TimeRegistry
  console.log("\n🔍 Test 4: TimeRegistry");
  try {
    const timeRegistry = await ethers.getContractAt("TimeRegistry", addresses.TimeRegistry);
    
    // Verificar registros de tiempo del usuario
    const timeRecords = await timeRegistry.getUserTimeRecords(user1.address);
    console.log(`  ✅ Registros de tiempo de User1: ${timeRecords.length}`);
    
    // Verificar que se puede registrar tiempo (solo si User1 tiene skills validadas)
    try {
      const startTime = Math.floor(Date.now() / 1000) - 3600; // 1 hora atrás
      const endTime = Math.floor(Date.now() / 1000); // ahora
      const tx = await timeRegistry.connect(user1).recordTime(
        user2.address, // company
        0, // skillId (asumiendo que existe)
        startTime,
        endTime,
        "Trabajo de prueba"
      );
      await tx.wait();
      console.log(`  ✅ Registro de tiempo creado`);
    } catch (recordError) {
      console.log(`  ⚠️ No se pudo crear registro de tiempo: ${recordError.message}`);
    }
    
  } catch (error) {
    console.log(`  ❌ Error en TimeRegistry: ${error.message}`);
  }

  // Test 5: P2PMarketplace
  console.log("\n🔍 Test 5: P2PMarketplace");
  try {
    const marketplace = await ethers.getContractAt("P2PMarketplace", addresses.P2PMarketplace);
    
    // Verificar servicios del usuario
    const userServices = await marketplace.getProviderServices(user1.address);
    console.log(`  ✅ Servicios de User1: ${userServices.length}`);
    
    // Verificar órdenes del usuario
    const userOrders = await marketplace.getClientOrders(user1.address);
    console.log(`  ✅ Órdenes de User1: ${userOrders.length}`);
    
  } catch (error) {
    console.log(`  ❌ Error en P2PMarketplace: ${error.message}`);
  }

  // Test 6: ProfileNFT
  console.log("\n🔍 Test 6: ProfileNFT");
  try {
    const profileNFT = await ethers.getContractAt("ProfileNFT", addresses.ProfileNFT);
    
    // Verificar si User1 tiene NFT
    const hasBuild = await profileNFT.hasBuild(user1.address);
    console.log(`  ✅ User1 tiene NFT: ${hasBuild}`);
    
    // Verificar build count
    const buildCount = await profileNFT.getBuildCount();
    console.log(`  ✅ Número total de NFTs: ${buildCount}`);
    
  } catch (error) {
    console.log(`  ❌ Error en ProfileNFT: ${error.message}`);
  }

  // Test 7: IPFSRegistry
  console.log("\n🔍 Test 7: IPFSRegistry");
  try {
    const ipfsRegistry = await ethers.getContractAt("IPFSRegistry", addresses.IPFSRegistry);
    
    // Verificar que se puede registrar contenido
    const contentHash = "QmTestHash123";
    const sha256Hash = "sha256test123";
    const tx = await ipfsRegistry.connect(deployer).storeRecord(
      contentHash,
      sha256Hash,
      "test-collection",
      "test-data"
    );
    await tx.wait();
    console.log(`  ✅ Contenido IPFS registrado: ${contentHash}`);
    
    // Verificar que se puede obtener contenido
    const record = await ipfsRegistry.getRecordByHash(contentHash);
    console.log(`  ✅ Contenido obtenido: ${record.ipfsHash}`);
    
  } catch (error) {
    console.log(`  ❌ Error en IPFSRegistry: ${error.message}`);
  }

  console.log("\n✅ Tests de interoperabilidad completados");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 