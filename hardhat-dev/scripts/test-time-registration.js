const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Probando registro de tiempo...");
  
  const addresses = {
    TimeRegistry: "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853",
    SkillSystem: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9"
  };

  const accounts = await ethers.getSigners();
  const user1 = accounts[1]; // Profesional
  const company = accounts[2]; // Empresa: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC

  console.log(`\n👤 Cuentas de prueba:`);
  console.log(`  Profesional: ${user1.address}`);
  console.log(`  Empresa: ${company.address}`);

  try {
    const timeRegistry = await ethers.getContractAt("TimeRegistry", addresses.TimeRegistry);
    const skillSystem = await ethers.getContractAt("SkillSystem", addresses.SkillSystem);

    console.log("\n🔍 Verificando skills disponibles...");
    // Intentar crear una skill directamente
    try {
      console.log("  ⚠️ Creando skill de prueba...");
      const createSkillTx = await skillSystem.connect(accounts[0]).createSkill("QmTestSkillHash");
      await createSkillTx.wait();
      console.log("  ✅ Skill creada");
    } catch (error) {
      console.log("  ⚠️ Skill ya existe o error al crear:", error.message);
    }

    console.log("\n🔍 Verificando perfil del profesional...");
    const profileRegistry = await ethers.getContractAt("ProfileRegistry", "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0");
    const hasProfile = await profileRegistry.hasRegisteredProfile(user1.address);
    console.log(`  ✅ Profesional tiene perfil: ${hasProfile}`);

    if (!hasProfile) {
      console.log("  ⚠️ Profesional no tiene perfil, creando uno...");
      const registerProfileTx = await profileRegistry.connect(user1).registerProfile(
        "QmTestProfileHash",
        0 // Professional
      );
      await registerProfileTx.wait();
      console.log("  ✅ Perfil de profesional creado");
    }

    console.log("\n🔍 Verificando perfil de la empresa...");
    const companyHasProfile = await profileRegistry.hasRegisteredProfile(company.address);
    console.log(`  ✅ Empresa tiene perfil: ${companyHasProfile}`);

    if (!companyHasProfile) {
      console.log("  ⚠️ Empresa no tiene perfil, creando uno...");
      const registerCompanyTx = await profileRegistry.connect(company).registerProfile(
        "QmTestCompanyHash",
        1 // Company
      );
      await registerCompanyTx.wait();
      console.log("  ✅ Perfil de empresa creado");
    }

    console.log("\n🔍 Verificando skills declaradas por el profesional...");
    const userSkills = await skillSystem.getProfessionalSkills(user1.address);
    console.log(`  ✅ Skills declaradas: ${userSkills.length}`);

    if (userSkills.length === 0) {
      console.log("  ⚠️ Profesional no tiene skills declaradas, declarando skill 0...");
      const declareSkillTx = await skillSystem.connect(user1).declareSkill(0, 3); // skillId 0, nivel 3
      await declareSkillTx.wait();
      console.log("  ✅ Skill declarada por el profesional");
    }

    console.log("\n🔍 Verificando validación de la skill...");
    const declaredSkill = await skillSystem.getDeclaredSkill(user1.address, 0);
    console.log(`  ✅ Skill declarada: ${declaredSkill.isActive}`);
    console.log(`  ✅ Skill validada: ${declaredSkill.isValidated}`);

    if (!declaredSkill.isValidated) {
      console.log("  ⚠️ Skill no está validada, validándola...");
      // El deployer (accounts[0]) tiene rol KARMA_ROLE y puede validar
      const validateSkillTx = await skillSystem.connect(accounts[0]).validateSkill(user1.address, 0, true);
      await validateSkillTx.wait();
      console.log("  ✅ Skill validada exitosamente");
    }

    console.log("\n🔍 Intentando registrar tiempo...");
    // Crear hash de IPFS de prueba
    const timeDataHash = "QmYJV925CZsW5f7Rp6vpjk5ynM3QSkp8jy3QD4eYv3udQe";
    const hoursWorked = 1;
    const hourlyRate = 50; // 50 wei por hora

    console.log(`  📝 Parámetros:`);
    console.log(`    Skill ID: 0`);
    console.log(`    Time Data Hash: ${timeDataHash}`);
    console.log(`    Hours Worked: ${hoursWorked}`);
    console.log(`    Hourly Rate: ${hourlyRate} wei`);

    // Usar registerTime con los parámetros correctos
    const registerTimeTx = await timeRegistry.connect(user1).registerTime(
      0, // skillId
      timeDataHash,
      hoursWorked,
      hourlyRate
    );
    
    console.log("  ✅ Transacción enviada, esperando confirmación...");
    const receipt = await registerTimeTx.wait();
    console.log(`  ✅ Registro de tiempo creado exitosamente!`);
    console.log(`  📋 Transaction hash: ${receipt.hash}`);

    console.log("\n🔍 Verificando registros de tiempo...");
    const userEntries = await timeRegistry.getProfessionalEntries(user1.address);
    console.log(`  ✅ Registros totales del usuario: ${userEntries.length}`);

    if (userEntries.length > 0) {
      const latestEntry = await timeRegistry.getTimeEntry(userEntries[userEntries.length - 1]);
      console.log(`  📋 Último registro:`);
      console.log(`    ID: ${userEntries[userEntries.length - 1]}`);
      console.log(`    Professional: ${latestEntry[1]}`);
      console.log(`    Skill ID: ${latestEntry[2]}`);
      console.log(`    Time Data Hash: ${latestEntry[3]}`);
      console.log(`    Hours Worked: ${latestEntry[4]}`);
      console.log(`    Hourly Rate: ${latestEntry[5]}`);
      console.log(`    Total Amount: ${latestEntry[6]}`);
      console.log(`    Is Validated: ${latestEntry[7]}`);
    }

    console.log("\n🎉 ¡Prueba de registro de tiempo completada exitosamente!");

  } catch (error) {
    console.error("❌ Error en la prueba:", error.message);
    console.error("Stack trace:", error.stack);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 