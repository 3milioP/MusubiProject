const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Diagnóstico específico del problema de habilidades del usuario...");
  
  try {
    // 1. Obtener el contrato SkillSystem
    const SkillSystem = await ethers.getContractFactory("SkillSystem");
    const skillSystem = await SkillSystem.attach("0xa85233C63b9Ee964Add6F2cffe00Fd84eb32338f");
    
    console.log("✅ Contrato SkillSystem obtenido en:", skillSystem.address);
    
    // 2. Obtener signers
    const [signer1, signer2] = await ethers.getSigners();
    console.log("👤 Signer 1:", signer1.address);
    console.log("👤 Signer 2:", signer2.address);
    
    // 3. Verificar skills del usuario 1 usando getProfessionalSkills
    console.log("\n🔍 Verificando skills del usuario 1 con getProfessionalSkills...");
    try {
      const user1Skills = await skillSystem.getProfessionalSkills(signer1.address);
      console.log("✅ Skills del usuario 1 (getProfessionalSkills):", user1Skills);
      console.log("📊 Cantidad de skills del usuario 1:", user1Skills.length);
    } catch (error) {
      console.error("❌ Error con getProfessionalSkills:", error.message);
    }
    
    // 4. Verificar si hay declaraciones usando getDeclaredSkill para las primeras 5 skills
    console.log("\n🔍 Verificando declaraciones individuales...");
    for (let i = 0; i < 5; i++) {
      try {
        const declaration = await skillSystem.getDeclaredSkill(signer1.address, i);
        console.log(`📋 Declaración para skill ${i}:`, {
          isActive: declaration.isActive,
          level: declaration.level.toString(),
          isValidated: declaration.isValidated,
          validatedBy: declaration.validatedBy,
          declaredAt: new Date(Number(declaration.declaredAt) * 1000)
        });
      } catch (error) {
        console.log(`❌ Error obteniendo declaración para skill ${i}:`, error.message);
      }
    }
    
    // 5. Verificar si hay skills creadas
    console.log("\n🔍 Verificando skills creadas...");
    for (let i = 0; i < 5; i++) {
      try {
        const skill = await skillSystem.getSkill(i);
        if (skill && skill.creator !== ethers.ZeroAddress) {
          console.log(`📋 Skill ${i} existe:`, {
            creator: skill.creator,
            skillDataHash: skill.skillDataHash,
            isActive: skill.isActive,
            createdAt: new Date(Number(skill.createdAt) * 1000)
          });
        } else {
          console.log(`❌ Skill ${i} no existe o está vacía`);
        }
      } catch (error) {
        console.log(`❌ Error obteniendo skill ${i}:`, error.message);
      }
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