const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Validando contratos desplegados...");
  
  const addresses = {
    KRMToken: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    ProfileRegistry: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    SkillSystem: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
    TimeRegistry: "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853",
    P2PMarketplace: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
    ProfileNFT: "0x0165878A594ca255338adfa4d48449f69242Eb8F",
    IPFSRegistry: "0x5FbDB2315678afecb367f032d93F642f64180aa3"
  };

  for (const [name, address] of Object.entries(addresses)) {
    try {
      console.log(`\n🔍 Verificando ${name} en ${address}...`);
      
      // Verificar que el código existe en la dirección
      const code = await ethers.provider.getCode(address);
      
      if (code === "0x") {
        console.log(`❌ ${name}: No hay código en la dirección`);
      } else {
        console.log(`✅ ${name}: Contrato desplegado correctamente`);
        
        // Intentar obtener el balance de KRM si es el token
        if (name === "KRMToken") {
          try {
            const [deployer] = await ethers.getSigners();
            const krmToken = await ethers.getContractAt("KRMToken", address);
            const balance = await krmToken.balanceOf(deployer.address);
            console.log(`💰 Balance KRM del deployer: ${ethers.utils.formatEther(balance)} KRM`);
          } catch (error) {
            console.log(`⚠️ No se pudo obtener balance KRM: ${error.message}`);
          }
        }
      }
    } catch (error) {
      console.log(`❌ Error verificando ${name}: ${error.message}`);
    }
  }
  
  console.log("\n✅ Validación completada");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 