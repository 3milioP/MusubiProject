const { ethers } = require("hardhat");

async function main() {
  console.log("🎭 Configurando juego de roles para pruebas...");
  
  const addresses = {
    ProfileRegistry: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    SkillSystem: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
    TimeRegistry: "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853",
    P2PMarketplace: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
    KRMToken: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
  };

  const accounts = await ethers.getSigners();
  
  console.log("\n👥 Cuentas de Hardhat disponibles:");
  console.log(`  Deployer (Admin): ${accounts[0].address}`);
  console.log(`  Usuario Profesional: ${accounts[1].address}`);
  console.log(`  Empresa: ${accounts[2].address}`);
  console.log(`  Proveedor Marketplace: ${accounts[4].address}`);
  console.log(`  Cliente Marketplace: ${accounts[5].address}`);

  try {
    const profileRegistry = await ethers.getContractAt("ProfileRegistry", addresses.ProfileRegistry);
    const skillSystem = await ethers.getContractAt("SkillSystem", addresses.SkillSystem);
    const krmToken = await ethers.getContractAt("KRMToken", addresses.KRMToken);

    // ===== PASO 1: REGISTRAR PERFILES PARA TODAS LAS CUENTAS =====
    console.log("\n📝 PASO 1: Registrando perfiles...");

    const profilesToRegister = [
      { account: accounts[1], name: "Juan Profesional", description: "Desarrollador Full Stack", type: 0 },
      { account: accounts[2], name: "TechCorp", description: "Empresa de tecnología", type: 1 },
      { account: accounts[4], name: "María Freelancer", description: "Desarrolladora independiente", type: 0 },
      { account: accounts[5], name: "Carlos Cliente", description: "Emprendedor", type: 0 }
    ];

    for (const profile of profilesToRegister) {
      const hasProfile = await profileRegistry.hasRegisteredProfile(profile.account.address);
      if (!hasProfile) {
        console.log(`  📋 Registrando perfil para ${profile.name}...`);
        const tx = await profileRegistry.connect(profile.account).registerProfile(
          profile.name,
          profile.description,
          "",
          profile.type, // 0 = Professional, 1 = Company
          true
        );
        await tx.wait();
        console.log(`  ✅ Perfil registrado: ${profile.name}`);
      } else {
        console.log(`  ✅ Perfil ya existe: ${profile.name}`);
      }
    }

    // ===== PASO 2: ASIGNAR ROL KARMA_ROLE A TODAS LAS CUENTAS =====
    console.log("\n🔐 PASO 2: Asignando rol KARMA_ROLE...");

    const karmaRole = await skillSystem.KARMA_ROLE();
    const accountsToGrantRole = [accounts[1], accounts[2], accounts[4], accounts[5]];

    for (const account of accountsToGrantRole) {
      const hasRole = await skillSystem.hasRole(karmaRole, account.address);
      if (!hasRole) {
        console.log(`  🔑 Asignando KARMA_ROLE a ${account.address}...`);
        const tx = await skillSystem.connect(accounts[0]).grantRole(karmaRole, account.address);
        await tx.wait();
        console.log(`  ✅ KARMA_ROLE asignado`);
      } else {
        console.log(`  ✅ KARMA_ROLE ya asignado`);
      }
    }

    // Asignar KARMA_ROLE también al ProfileRegistry para que SkillSystem y TimeRegistry puedan actualizar karma
    console.log(`  🔑 Asignando KARMA_ROLE al ProfileRegistry...`);
    const profileKarmaRole = await profileRegistry.KARMA_ROLE();
    const skillSystemHasRole = await profileRegistry.hasRole(profileKarmaRole, addresses.SkillSystem);
    const timeRegistryHasRole = await profileRegistry.hasRole(profileKarmaRole, addresses.TimeRegistry);
    
    if (!skillSystemHasRole) {
      const tx1 = await profileRegistry.connect(accounts[0]).grantRole(profileKarmaRole, addresses.SkillSystem);
      await tx1.wait();
      console.log(`  ✅ KARMA_ROLE asignado al SkillSystem`);
    }
    
    if (!timeRegistryHasRole) {
      const tx2 = await profileRegistry.connect(accounts[0]).grantRole(profileKarmaRole, addresses.TimeRegistry);
      await tx2.wait();
      console.log(`  ✅ KARMA_ROLE asignado al TimeRegistry`);
    }

    // ===== PASO 3: CREAR SKILLS =====
    console.log("\n💡 PASO 3: Creando skills...");

    const skillsToCreate = [
      { name: "React", category: "Frontend" },
      { name: "Node.js", category: "Backend" },
      { name: "Solidity", category: "Blockchain" }
    ];

    for (const skill of skillsToCreate) {
      const skillCount = await skillSystem.getSkillCount();
      let skillExists = false;
      
      // Verificar si la skill ya existe
      for (let i = 0; i < skillCount; i++) {
        try {
          const existingSkill = await skillSystem.skills(i);
          if (existingSkill.name === skill.name) {
            skillExists = true;
            break;
          }
        } catch (error) {
          break;
        }
      }

      if (!skillExists) {
        console.log(`  🆕 Creando skill: ${skill.name}...`);
        const tx = await skillSystem.connect(accounts[0]).createSkill(skill.name, skill.category);
        await tx.wait();
        console.log(`  ✅ Skill creada: ${skill.name}`);
      } else {
        console.log(`  ✅ Skill ya existe: ${skill.name}`);
      }
    }

    // ===== PASO 4: DECLARAR Y VALIDAR SKILLS =====
    console.log("\n🎯 PASO 4: Declarando y validando skills...");

    // Usuario profesional declara React
    const userSkills = await skillSystem.getProfessionalSkills(accounts[1].address);
    if (userSkills.length === 0) {
      console.log(`  📝 ${accounts[1].address} declara skill React...`);
      const declareTx = await skillSystem.connect(accounts[1]).declareSkill(0, 4); // React, nivel 4
      await declareTx.wait();
      console.log(`  ✅ Skill React declarada`);
    }

    // Empresa valida la skill del usuario
    const declaredSkill = await skillSystem.getDeclaredSkill(accounts[1].address, 0);
    if (!declaredSkill.isValidated) {
      console.log(`  ✅ ${accounts[2].address} (Empresa) valida skill React del usuario...`);
      const validateTx = await skillSystem.connect(accounts[2]).validateSkill(accounts[1].address, 0, true);
      await validateTx.wait();
      console.log(`  ✅ Skill React validada`);
    }

    // Proveedor declara Node.js
    const providerSkills = await skillSystem.getProfessionalSkills(accounts[4].address);
    if (providerSkills.length === 0) {
      console.log(`  📝 ${accounts[4].address} declara skill Node.js...`);
      const declareTx = await skillSystem.connect(accounts[4]).declareSkill(1, 5); // Node.js, nivel 5
      await declareTx.wait();
      console.log(`  ✅ Skill Node.js declarada`);
    }

    // Cliente valida la skill del proveedor
    const providerDeclaredSkill = await skillSystem.getDeclaredSkill(accounts[4].address, 1);
    if (!providerDeclaredSkill.isValidated) {
      console.log(`  ✅ ${accounts[5].address} (Cliente) valida skill Node.js del proveedor...`);
      const validateTx = await skillSystem.connect(accounts[5]).validateSkill(accounts[4].address, 1, true);
      await validateTx.wait();
      console.log(`  ✅ Skill Node.js validada`);
    }

    // ===== PASO 5: DISTRIBUIR KRM =====
    console.log("\n💰 PASO 5: Distribuyendo KRM...");

    const accountsToFund = [accounts[1], accounts[4], accounts[5]]; // Usuario, Proveedor, Cliente
    const krmAmount = ethers.parseEther("1000"); // 1000 KRM cada uno

    for (const account of accountsToFund) {
      const balance = await krmToken.balanceOf(account.address);
      if (balance < krmAmount) {
        console.log(`  💸 Enviando 1000 KRM a ${account.address}...`);
        const tx = await krmToken.connect(accounts[0]).transfer(account.address, krmAmount);
        await tx.wait();
        console.log(`  ✅ 1000 KRM enviados`);
      } else {
        console.log(`  ✅ ${account.address} ya tiene suficientes KRM`);
      }
    }

    // ===== PASO 6: CONFIGURAR MARKETPLACE =====
    console.log("\n🛒 PASO 6: Configurando marketplace...");

    // Configurar direcciones en el marketplace
    const marketplace = await ethers.getContractAt("P2PMarketplace", addresses.P2PMarketplace);
    const currentProfileRegistry = await marketplace.profileRegistry();
    
    if (currentProfileRegistry === "0x0000000000000000000000000000000000000000") {
      console.log(`  🔧 Configurando direcciones en marketplace...`);
      const tx = await marketplace.connect(accounts[0]).setContractAddresses(addresses.ProfileRegistry, addresses.SkillSystem);
      await tx.wait();
      console.log(`  ✅ Marketplace configurado`);
    } else {
      console.log(`  ✅ Marketplace ya configurado`);
    }

    // ===== RESUMEN FINAL =====
    console.log("\n" + "=".repeat(60));
    console.log("🎭 JUEGO DE ROLES CONFIGURADO EXITOSAMENTE");
    console.log("=".repeat(60));
    
    console.log("\n👥 ROLES CONFIGURADOS:");
    console.log(`  👨‍💻 Usuario Profesional: ${accounts[1].address}`);
    console.log(`     - Perfil: Juan Profesional`);
    console.log(`     - Skills: React (nivel 4, validada)`);
    console.log(`     - KRM: 1000`);
    
    console.log(`  🏢 Empresa: ${accounts[2].address}`);
    console.log(`     - Perfil: TechCorp`);
    console.log(`     - Rol: Validador de skills`);
    
    console.log(`  👩‍💻 Proveedor Marketplace: ${accounts[4].address}`);
    console.log(`     - Perfil: María Freelancer`);
    console.log(`     - Skills: Node.js (nivel 5, validada)`);
    console.log(`     - KRM: 1000`);
    
    console.log(`  👨‍💼 Cliente Marketplace: ${accounts[5].address}`);
    console.log(`     - Perfil: Carlos Cliente`);
    console.log(`     - KRM: 1000`);
    
    console.log("\n🎯 FLUJOS DISPONIBLES:");
    console.log("  1. Usuario → Registra tiempo en Empresa");
    console.log("  2. Empresa → Valida registro de tiempo");
    console.log("  3. Proveedor → Crea servicio en Marketplace");
    console.log("  4. Cliente → Compra servicio con KRM");
    
    console.log("\n✅ ¡Todo listo para pruebas!");

  } catch (error) {
    console.error("❌ Error en la configuración:", error.message);
    console.error("Stack trace:", error.stack);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 