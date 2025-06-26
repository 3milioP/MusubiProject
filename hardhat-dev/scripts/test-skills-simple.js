const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Probando métodos del contrato SkillSystem...");
  
  try {
    // Obtener el contrato SkillSystem
    const SkillSystem = await ethers.getContractFactory("SkillSystem");
    const skillSystem = await SkillSystem.attach("0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9");
    
    console.log("✅ Contrato SkillSystem obtenido");
    
    // Probar método totalSkills
    try {
      const totalSkills = await skillSystem.totalSkills();
      console.log("✅ totalSkills():", totalSkills.toString());
    } catch (error) {
      console.log("❌ Error en totalSkills():", error.message);
    }
    
    // Probar método getProfessionalSkills
    try {
      const [signer] = await ethers.getSigners();
      const userAddress = signer.address;
      console.log("👤 Usuario:", userAddress);
      
      const professionalSkills = await skillSystem.getProfessionalSkills(userAddress);
      console.log("✅ getProfessionalSkills():", professionalSkills);
    } catch (error) {
      console.log("❌ Error en getProfessionalSkills():", error.message);
    }
    
    // Listar todos los métodos disponibles
    console.log("\n📋 Métodos disponibles en el contrato:");
    const contractInterface = skillSystem.interface;
    const functions = contractInterface.fragments.filter(f => f.type === 'function');
    
    functions.forEach(func => {
      console.log(`   - ${func.name}(${func.inputs.map(i => i.type).join(', ')})`);
    });
    
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