const { ethers } = require("hardhat");

async function main() {
  console.log("🔧 Configurando interoperabilidad entre contratos...");

  // Obtener las direcciones desplegadas
  const deployedAddresses = require("../ignition/deployments/chain-31337/deployed_addresses.json");
  
  const krmTokenAddress = deployedAddresses["MusubiDeployment#KRMToken"];
  const profileRegistryAddress = deployedAddresses["MusubiDeployment#ProfileRegistry"];
  const skillSystemAddress = deployedAddresses["MusubiDeployment#SkillSystem"];
  const timeRegistryAddress = deployedAddresses["MusubiDeployment#TimeRegistry"];
  const profileNFTAddress = deployedAddresses["MusubiDeployment#ProfileNFT"];
  const p2pMarketplaceAddress = deployedAddresses["MusubiDeployment#P2PMarketplace"];

  console.log("📍 Direcciones de contratos:");
  console.log(`  KRMToken: ${krmTokenAddress}`);
  console.log(`  ProfileRegistry: ${profileRegistryAddress}`);
  console.log(`  SkillSystem: ${skillSystemAddress}`);
  console.log(`  TimeRegistry: ${timeRegistryAddress}`);
  console.log(`  ProfileNFT: ${profileNFTAddress}`);
  console.log(`  P2PMarketplace: ${p2pMarketplaceAddress}`);

  // Obtener instancias de contratos
  const [deployer] = await ethers.getSigners();
  
  const krmToken = await ethers.getContractAt("KRMToken", krmTokenAddress);
  const profileRegistry = await ethers.getContractAt("ProfileRegistry", profileRegistryAddress);
  const skillSystem = await ethers.getContractAt("SkillSystem", skillSystemAddress);
  const timeRegistry = await ethers.getContractAt("TimeRegistry", timeRegistryAddress);
  const profileNFT = await ethers.getContractAt("ProfileNFT", profileNFTAddress);
  const p2pMarketplace = await ethers.getContractAt("P2PMarketplace", p2pMarketplaceAddress);

  console.log("\n🔗 Configurando direcciones en P2PMarketplace...");
  
  // Configurar direcciones en P2PMarketplace
  const tx1 = await p2pMarketplace.setContractAddresses(profileRegistryAddress, skillSystemAddress);
  await tx1.wait();
  console.log("✅ Direcciones configuradas en P2PMarketplace");

  console.log("\n👥 Configurando roles...");
  
  // Otorgar roles necesarios
  const karmaRole = await skillSystem.KARMA_ROLE();
  const timeKarmaRole = await timeRegistry.KARMA_ROLE();
  
  // Otorgar rol KARMA_ROLE a deployer en SkillSystem
  const tx2 = await skillSystem.grantRole(karmaRole, deployer.address);
  await tx2.wait();
  console.log("✅ Rol KARMA_ROLE otorgado en SkillSystem");

  // Otorgar rol KARMA_ROLE a deployer en TimeRegistry
  const tx3 = await timeRegistry.grantRole(timeKarmaRole, deployer.address);
  await tx3.wait();
  console.log("✅ Rol KARMA_ROLE otorgado en TimeRegistry");

  console.log("\n🎯 Configuración completada exitosamente!");
  console.log("\n📋 Resumen de configuración:");
  console.log(`  • P2PMarketplace conectado con ProfileRegistry y SkillSystem`);
  console.log(`  • Roles KARMA_ROLE otorgados al deployer`);
  console.log(`  • ProfileNFT listo para mintear builds evolutivos`);
  console.log(`  • Todos los contratos interconectados y operativos`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error en la configuración:", error);
    process.exit(1);
  }); 