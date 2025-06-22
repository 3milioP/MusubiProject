const { ethers } = require("hardhat");

async function main() {
  console.log("🎯 Poblando datos de prueba...");

  // Obtener las direcciones desplegadas
  const deployedAddresses = require("../ignition/deployments/chain-31337/deployed_addresses.json");
  
  const krmTokenAddress = deployedAddresses["MusubiDeployment#KRMToken"];
  const profileRegistryAddress = deployedAddresses["MusubiDeployment#ProfileRegistry"];
  const skillSystemAddress = deployedAddresses["MusubiDeployment#SkillSystem"];
  const timeRegistryAddress = deployedAddresses["MusubiDeployment#TimeRegistry"];
  const profileNFTAddress = deployedAddresses["MusubiDeployment#ProfileNFT"];
  const p2pMarketplaceAddress = deployedAddresses["MusubiDeployment#P2PMarketplace"];

  // Obtener instancias de contratos
  const [deployer, user1, user2, user3, company1, company2] = await ethers.getSigners();
  
  const krmToken = await ethers.getContractAt("KRMToken", krmTokenAddress);
  const profileRegistry = await ethers.getContractAt("ProfileRegistry", profileRegistryAddress);
  const skillSystem = await ethers.getContractAt("SkillSystem", skillSystemAddress);
  const timeRegistry = await ethers.getContractAt("TimeRegistry", timeRegistryAddress);
  const profileNFT = await ethers.getContractAt("ProfileNFT", profileNFTAddress);
  const p2pMarketplace = await ethers.getContractAt("P2PMarketplace", p2pMarketplaceAddress);

  console.log("👥 Creando perfiles...");

  // Registrar perfiles de profesionales
  await profileRegistry.connect(user1).registerProfile(false, "ipfs://profile-user1");
  await profileRegistry.connect(user2).registerProfile(false, "ipfs://profile-user2");
  await profileRegistry.connect(user3).registerProfile(false, "ipfs://profile-user3");

  // Registrar perfiles de empresas
  await profileRegistry.connect(company1).registerProfile(true, "ipfs://profile-company1");
  await profileRegistry.connect(company2).registerProfile(true, "ipfs://profile-company2");

  // Verificar todos los perfiles
  await profileRegistry.verifyProfile(user1.address);
  await profileRegistry.verifyProfile(user2.address);
  await profileRegistry.verifyProfile(user3.address);
  await profileRegistry.verifyProfile(company1.address);
  await profileRegistry.verifyProfile(company2.address);

  console.log("✅ Perfiles creados y verificados");

  console.log("🛠️ Creando habilidades...");

  // Crear habilidades
  await skillSystem.createSkill("JavaScript", "Lenguaje de programación web");
  await skillSystem.createSkill("React", "Framework de JavaScript para UI");
  await skillSystem.createSkill("Node.js", "Runtime de JavaScript para backend");
  await skillSystem.createSkill("Solidity", "Lenguaje para smart contracts");
  await skillSystem.createSkill("Python", "Lenguaje de programación versátil");
  await skillSystem.createSkill("Docker", "Plataforma de contenedores");
  await skillSystem.createSkill("AWS", "Servicios en la nube de Amazon");
  await skillSystem.createSkill("TypeScript", "Superset tipado de JavaScript");

  console.log("✅ Habilidades creadas");

  console.log("📝 Declarando habilidades...");

  // User1: Desarrollador Full Stack
  await skillSystem.connect(user1).declareSkill(0, 3); // JavaScript - Expert
  await skillSystem.connect(user1).declareSkill(1, 3); // React - Expert
  await skillSystem.connect(user1).declareSkill(2, 2); // Node.js - Advanced
  await skillSystem.connect(user1).declareSkill(4, 2); // Python - Advanced

  // User2: Blockchain Developer
  await skillSystem.connect(user2).declareSkill(0, 2); // JavaScript - Advanced
  await skillSystem.connect(user2).declareSkill(3, 3); // Solidity - Expert
  await skillSystem.connect(user2).declareSkill(4, 1); // Python - Intermediate

  // User3: DevOps Engineer
  await skillSystem.connect(user3).declareSkill(4, 3); // Python - Expert
  await skillSystem.connect(user3).declareSkill(5, 3); // Docker - Expert
  await skillSystem.connect(user3).declareSkill(6, 2); // AWS - Advanced
  await skillSystem.connect(user3).declareSkill(7, 1); // TypeScript - Intermediate

  console.log("✅ Habilidades declaradas");

  console.log("✅ Validando habilidades...");

  // Otorgar roles de validación
  const karmaRole = await skillSystem.KARMA_ROLE();
  await skillSystem.grantRole(karmaRole, company1.address);
  await skillSystem.grantRole(karmaRole, company2.address);

  // Validar habilidades de User1
  await skillSystem.connect(company1).validateSkill(user1.address, 0);
  await skillSystem.connect(company1).validateSkill(user1.address, 1);
  await skillSystem.connect(company2).validateSkill(user1.address, 2);
  await skillSystem.connect(company2).validateSkill(user1.address, 4);

  // Validar habilidades de User2
  await skillSystem.connect(company1).validateSkill(user2.address, 0);
  await skillSystem.connect(company1).validateSkill(user2.address, 3);
  await skillSystem.connect(company2).validateSkill(user2.address, 4);

  // Validar habilidades de User3
  await skillSystem.connect(company1).validateSkill(user3.address, 4);
  await skillSystem.connect(company1).validateSkill(user3.address, 5);
  await skillSystem.connect(company2).validateSkill(user3.address, 6);
  await skillSystem.connect(company2).validateSkill(user3.address, 7);

  console.log("✅ Habilidades validadas");

  console.log("🎨 Minteando builds evolutivos...");

  // Mintear builds para todos los usuarios
  await profileNFT.mintBuild(user1.address, "ipfs://build-user1-fullstack");
  await profileNFT.mintBuild(user2.address, "ipfs://build-user2-blockchain");
  await profileNFT.mintBuild(user3.address, "ipfs://build-user3-devops");

  // Evolucionar builds para reflejar las skills validadas
  await profileNFT.evolveBuild(user1.address);
  await profileNFT.evolveBuild(user2.address);
  await profileNFT.evolveBuild(user3.address);

  console.log("✅ Builds minteados y evolucionados");

  console.log("⏰ Registrando tiempo trabajado...");

  // Otorgar roles de validación de tiempo
  const timeKarmaRole = await timeRegistry.KARMA_ROLE();
  await timeRegistry.grantRole(timeKarmaRole, company1.address);
  await timeRegistry.grantRole(timeKarmaRole, company2.address);

  // Registrar tiempo para User1
  await timeRegistry.connect(user1).registerTime(0, company1.address, 1609459200, 1609545600, "Desarrollo frontend con React");
  await timeRegistry.connect(user1).registerTime(2, company2.address, 1609632000, 1609718400, "Desarrollo backend con Node.js");

  // Registrar tiempo para User2
  await timeRegistry.connect(user2).registerTime(3, company1.address, 1609804800, 1609891200, "Desarrollo de smart contracts");

  // Registrar tiempo para User3
  await timeRegistry.connect(user3).registerTime(5, company1.address, 1609977600, 1610064000, "Configuración de contenedores Docker");
  await timeRegistry.connect(user3).registerTime(6, company2.address, 1610150400, 1610236800, "Despliegue en AWS");

  console.log("✅ Tiempo registrado");

  console.log("✅ Validando registros de tiempo...");

  // Validar registros de tiempo
  await timeRegistry.connect(company1).validateTime(0);
  await timeRegistry.connect(company2).validateTime(1);
  await timeRegistry.connect(company1).validateTime(2);
  await timeRegistry.connect(company1).validateTime(3);
  await timeRegistry.connect(company2).validateTime(4);

  console.log("✅ Registros de tiempo validados");

  console.log("🛒 Creando servicios en marketplace...");

  // Crear servicios
  await p2pMarketplace.connect(user1).createService(
    "Desarrollo Full Stack",
    "Desarrollo completo de aplicaciones web con React y Node.js",
    ethers.parseEther("75")
  );

  await p2pMarketplace.connect(user2).createService(
    "Desarrollo Blockchain",
    "Desarrollo de smart contracts y aplicaciones descentralizadas",
    ethers.parseEther("100")
  );

  await p2pMarketplace.connect(user3).createService(
    "DevOps y Cloud",
    "Configuración de infraestructura y despliegue en la nube",
    ethers.parseEther("80")
  );

  console.log("✅ Servicios creados");

  console.log("💰 Distribuyendo tokens KRM...");

  // Transferir tokens a usuarios para pruebas
  await krmToken.transfer(user1.address, ethers.parseEther("1000"));
  await krmToken.transfer(user2.address, ethers.parseEther("1000"));
  await krmToken.transfer(user3.address, ethers.parseEther("1000"));
  await krmToken.transfer(company1.address, ethers.parseEther("2000"));
  await krmToken.transfer(company2.address, ethers.parseEther("2000"));

  console.log("✅ Tokens distribuidos");

  console.log("\n🎉 Datos de prueba poblados exitosamente!");
  console.log("\n📊 Resumen de datos creados:");
  console.log("  👥 3 perfiles de profesionales verificados");
  console.log("  🏢 2 perfiles de empresas verificados");
  console.log("  🛠️ 8 habilidades creadas");
  console.log("  📝 10 habilidades declaradas y validadas");
  console.log("  🎨 3 builds evolutivos minteados");
  console.log("  ⏰ 5 registros de tiempo validados");
  console.log("  🛒 3 servicios en marketplace");
  console.log("  💰 Tokens KRM distribuidos");
  console.log("\n🌐 El sistema está listo para pruebas!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error poblando datos:", error);
    process.exit(1);
  }); 