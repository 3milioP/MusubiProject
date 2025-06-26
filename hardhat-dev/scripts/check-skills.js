const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Verificando estado de las skills...");
  
  // Obtener el contrato SkillSystem
  const SkillSystem = await ethers.getContractFactory("SkillSystem");
  const skillSystem = await SkillSystem.attach("0x5FbDB2315678afecb367f032d93F642f64180aa3");
  
  try {
    // Obtener el total de skills
    const totalSkills = await skillSystem.totalSkills();
    console.log("📊 Total de skills registradas:", totalSkills.toString());
    
    if (totalSkills > 0) {
      console.log("\n🔍 Detalles de las skills:");
      
      for (let i = 0; i < totalSkills; i++) {
        try {
          const skill = await skillSystem.getSkill(i);
          console.log(`\n📋 Skill ${i}:`);
          console.log(`   - ID: ${skill.id}`);
          console.log(`   - Creator: ${skill.creator}`);
          console.log(`   - Skill Data Hash: ${skill.skillDataHash}`);
          console.log(`   - Is Active: ${skill.isActive}`);
          console.log(`   - Created At: ${new Date(Number(skill.createdAt) * 1000)}`);
          
          // Verificar si el hash existe en IPFS
          if (skill.skillDataHash && skill.skillDataHash !== "") {
            console.log(`   - Hash IPFS: ${skill.skillDataHash}`);
            
            // Intentar obtener datos de IPFS
            try {
              const response = await fetch(`http://localhost:8080/ipfs/${skill.skillDataHash}`);
              if (response.ok) {
                const data = await response.json();
                console.log(`   ✅ Datos IPFS encontrados:`, data);
              } else {
                console.log(`   ❌ Datos IPFS no encontrados`);
              }
            } catch (ipfsError) {
              console.log(`   ❌ Error accediendo a IPFS:`, ipfsError.message);
            }
          }
        } catch (error) {
          console.log(`   ❌ Error obteniendo skill ${i}:`, error.message);
        }
      }
    } else {
      console.log("📭 No hay skills registradas");
    }
    
    // Verificar declaraciones de skills
    console.log("\n🔍 Verificando declaraciones de skills...");
    const [signer] = await ethers.getSigners();
    const userAddress = signer.address;
    
    try {
      const userDeclarationsCount = await skillSystem.getUserDeclarationsCount(userAddress);
      console.log(`📊 Declaraciones del usuario ${userAddress}:`, userDeclarationsCount.toString());
      
      if (userDeclarationsCount > 0) {
        for (let i = 0; i < userDeclarationsCount; i++) {
          const declaration = await skillSystem.getUserDeclaration(userAddress, i);
          console.log(`\n📋 Declaración ${i}:`);
          console.log(`   - Skill ID: ${declaration.skillId}`);
          console.log(`   - Level: ${declaration.level}`);
          console.log(`   - Is Active: ${declaration.isActive}`);
          console.log(`   - Is Validated: ${declaration.isValidated}`);
          console.log(`   - Validated By: ${declaration.validatedBy}`);
          console.log(`   - Declared At: ${new Date(Number(declaration.declaredAt) * 1000)}`);
        }
      }
    } catch (error) {
      console.log("❌ Error obteniendo declaraciones:", error.message);
    }
    
  } catch (error) {
    console.error("❌ Error general:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 