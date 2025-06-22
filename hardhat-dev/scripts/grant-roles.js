const { ethers } = require("hardhat");

async function main() {
  console.log("🔧 Otorgando roles a la cuenta del frontend...");

  // La cuenta que estás usando en el frontend
  const userAccount = "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65";
  
  // Obtener las direcciones de los contratos desplegados
  const deployedAddresses = require("../ignition/deployments/chain-31337/deployed_addresses.json");
  
  const SkillSystem = deployedAddresses["MusubiDeployment#SkillSystem"];
  const TimeRegistry = deployedAddresses["MusubiDeployment#TimeRegistry"];
  const P2PMarketplace = deployedAddresses["MusubiDeployment#P2PMarketplace"];

  // Obtener instancias de contratos
  const skillSystem = await ethers.getContractAt("SkillSystem", SkillSystem);
  const timeRegistry = await ethers.getContractAt("TimeRegistry", TimeRegistry);
  const p2pMarketplace = await ethers.getContractAt("P2PMarketplace", P2PMarketplace);

  // Roles conocidos (estos son los hashes de los roles)
  const ADMIN_ROLE = "0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775";
  const KARMA_ROLE = "0x8f4f2da22e8ac8f11e15f9fc141cddbb5deea889018e81cd3914fb644a70760";
  const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";

  console.log("🔑 Otorgando roles en SkillSystem...");
  
  try {
    // Verificar si ya tiene el rol
    const hasAdminRole = await skillSystem.hasRole(ADMIN_ROLE, userAccount);
    if (!hasAdminRole) {
      const tx = await skillSystem.grantRole(ADMIN_ROLE, userAccount);
      await tx.wait();
      console.log("✅ ADMIN_ROLE otorgado en SkillSystem");
    } else {
      console.log("ℹ️  ADMIN_ROLE ya otorgado en SkillSystem");
    }
  } catch (error) {
    console.log("❌ Error otorgando ADMIN_ROLE en SkillSystem:", error.message);
  }

  try {
    const hasKarmaRole = await skillSystem.hasRole(KARMA_ROLE, userAccount);
    if (!hasKarmaRole) {
      const tx = await skillSystem.grantRole(KARMA_ROLE, userAccount);
      await tx.wait();
      console.log("✅ KARMA_ROLE otorgado en SkillSystem");
    } else {
      console.log("ℹ️  KARMA_ROLE ya otorgado en SkillSystem");
    }
  } catch (error) {
    console.log("❌ Error otorgando KARMA_ROLE en SkillSystem:", error.message);
  }

  console.log("🔑 Otorgando roles en TimeRegistry...");
  
  try {
    const hasAdminRole = await timeRegistry.hasRole(DEFAULT_ADMIN_ROLE, userAccount);
    if (!hasAdminRole) {
      const tx = await timeRegistry.grantRole(DEFAULT_ADMIN_ROLE, userAccount);
      await tx.wait();
      console.log("✅ DEFAULT_ADMIN_ROLE otorgado en TimeRegistry");
    } else {
      console.log("ℹ️  DEFAULT_ADMIN_ROLE ya otorgado en TimeRegistry");
    }
  } catch (error) {
    console.log("❌ Error otorgando DEFAULT_ADMIN_ROLE en TimeRegistry:", error.message);
  }

  console.log("🔑 Otorgando roles en P2PMarketplace...");
  
  try {
    const hasAdminRole = await p2pMarketplace.hasRole(DEFAULT_ADMIN_ROLE, userAccount);
    if (!hasAdminRole) {
      const tx = await p2pMarketplace.grantRole(DEFAULT_ADMIN_ROLE, userAccount);
      await tx.wait();
      console.log("✅ DEFAULT_ADMIN_ROLE otorgado en P2PMarketplace");
    } else {
      console.log("ℹ️  DEFAULT_ADMIN_ROLE ya otorgado en P2PMarketplace");
    }
  } catch (error) {
    console.log("❌ Error otorgando DEFAULT_ADMIN_ROLE en P2PMarketplace:", error.message);
  }

  console.log("\n🎉 Roles otorgados!");
  console.log("👤 Usuario:", userAccount);
  console.log("🌐 Ahora puedes probar el frontend en http://localhost:5174/");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  }); 