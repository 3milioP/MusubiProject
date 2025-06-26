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
    const skillCount = await skillSystem.getSkillCount();
    console.log(`  ✅ Skills disponibles: ${skillCount}`);

    if (skillCount === 0) {
      console.log("  ⚠️ No hay skills disponibles, creando una...");
      const createSkillTx = await skillSystem.connect(accounts[0]).createSkill("React", "Frontend");
      await createSkillTx.wait();
      console.log("  ✅ Skill 'React' creada");
    }

    console.log("\n🔍 Verificando perfil del profesional...");
    const profileRegistry = await ethers.getContractAt("ProfileRegistry", "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0");
    const hasProfile = await profileRegistry.hasRegisteredProfile(user1.address);
    console.log(`  ✅ Profesional tiene perfil: ${hasProfile}`);

    if (!hasProfile) {
      console.log("  ⚠️ Profesional no tiene perfil, creando uno...");
      const registerProfileTx = await profileRegistry.connect(user1).registerProfile(
        "Test Professional",
        "Profesional de prueba",
        "",
        0, // Professional
        true
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
        "Test Company",
        "Empresa de prueba",
        "",
        1, // Company
        true
      );
      await registerCompanyTx.wait();
      console.log("  ✅ Perfil de empresa creado");
    }

    console.log("\n🔍 Verificando skills declaradas por el profesional...");
    const userSkills = await skillSystem.getProfessionalSkills(user1.address);
    console.log(`  ✅ Skills declaradas: ${userSkills.length}`);

    if (userSkills.length === 0) {
      console.log("  ⚠️ Profesional no tiene skills declaradas, declarando React...");
      const declareSkillTx = await skillSystem.connect(user1).declareSkill(0, 3); // skillId 0, nivel 3
      await declareSkillTx.wait();
      console.log("  ✅ Skill 'React' declarada por el profesional");
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
      console.log("  ✅ Skill 'React' validada exitosamente");
    }

    console.log("\n🔍 Intentando registrar tiempo...");
    const startTime = Math.floor(Date.now() / 1000) - 3600; // 1 hora atrás
    const endTime = Math.floor(Date.now() / 1000); // ahora
    const description = "Desarrollo de componente React para Musubi";

    console.log(`  📝 Parámetros:`);
    console.log(`    Empresa: ${company.address}`);
    console.log(`    Skill ID: 0`);
    console.log(`    Start Time: ${startTime} (${new Date(startTime * 1000).toLocaleString()})`);
    console.log(`    End Time: ${endTime} (${new Date(endTime * 1000).toLocaleString()})`);
    console.log(`    Description: ${description}`);

    const registerTimeTx = await timeRegistry.connect(user1).recordTime(
      company.address,
      0, // skillId
      startTime,
      endTime,
      description
    );
    
    console.log("  ✅ Transacción enviada, esperando confirmación...");
    const receipt = await registerTimeTx.wait();
    console.log(`  ✅ Registro de tiempo creado exitosamente!`);
    console.log(`  📋 Transaction hash: ${receipt.hash}`);

    console.log("\n🔍 Verificando registros de tiempo...");
    const timeRecords = await timeRegistry.getUserTimeRecords(user1.address);
    console.log(`  ✅ Registros totales del usuario: ${timeRecords.length}`);

    if (timeRecords.length > 0) {
      const latestRecord = await timeRegistry.getTimeRecord(timeRecords[timeRecords.length - 1]);
      console.log(`  📋 Último registro:`);
      console.log(`    ID: ${latestRecord.id}`);
      console.log(`    Empresa: ${latestRecord.company}`);
      console.log(`    Skill ID: ${latestRecord.skillId}`);
      console.log(`    Horas: ${latestRecord.totalHours}`);
      console.log(`    Descripción: ${latestRecord.description}`);
      console.log(`    Estado: ${latestRecord.status}`);
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