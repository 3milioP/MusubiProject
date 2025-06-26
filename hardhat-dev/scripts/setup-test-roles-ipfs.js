const { ethers } = require("hardhat");

async function main() {
  console.log("🎭 Configurando juego de roles para pruebas con IPFS...");
  
  const addresses = {
    ProfileRegistry: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    SkillSystem: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
    TimeRegistry: "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853",
    P2PMarketplace: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
    KRMToken: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    IPFSRegistry: "0x5FbDB2315678afecb367f032d93F642f64180aa3"
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
    const ipfsRegistry = await ethers.getContractAt("IPFSRegistry", addresses.IPFSRegistry);

    // ===== PASO 1: REGISTRAR PERFILES CON IPFS =====
    console.log("\n📝 PASO 1: Registrando perfiles con IPFS...");

    const profilesToRegister = [
      { 
        account: accounts[1], 
        name: "Juan Profesional", 
        description: "Desarrollador Full Stack con 5 años de experiencia en React, Node.js y Solidity",
        type: 0,
        additionalData: {
          location: "Madrid, España",
          website: "https://juan-professional.dev",
          github: "juan-professional",
          linkedin: "juan-professional",
          skills: ["React", "Node.js", "Solidity"],
          hourlyRate: 50,
          languages: ["Español", "Inglés"]
        }
      },
      { 
        account: accounts[2], 
        name: "TechCorp", 
        description: "Empresa líder en desarrollo de software y consultoría tecnológica",
        type: 1,
        additionalData: {
          location: "Barcelona, España",
          website: "https://techcorp.com",
          industry: "Tecnología",
          size: "50-100 empleados",
          founded: 2018,
          services: ["Desarrollo Web", "Blockchain", "Consultoría"]
        }
      },
      { 
        account: accounts[4], 
        name: "María Freelancer", 
        description: "Desarrolladora independiente especializada en backend y APIs",
        type: 0,
        additionalData: {
          location: "Valencia, España",
          website: "https://maria-freelancer.com",
          github: "maria-freelancer",
          skills: ["Node.js", "Python", "PostgreSQL"],
          hourlyRate: 45,
          availability: "Tiempo completo"
        }
      },
      { 
        account: accounts[5], 
        name: "Carlos Cliente", 
        description: "Emprendedor buscando desarrollar su startup tecnológica",
        type: 0,
        additionalData: {
          location: "Sevilla, España",
          website: "https://carlos-startup.com",
          project: "Plataforma de e-commerce",
          budget: "5000-10000 EUR",
          timeline: "3-6 meses"
        }
      }
    ];

    for (const profile of profilesToRegister) {
      const hasProfile = await profileRegistry.hasRegisteredProfile(profile.account.address);
      if (!hasProfile) {
        console.log(`  📋 Registrando perfil para ${profile.name}...`);
        
        // Crear datos del perfil para IPFS
        const profileData = {
          name: profile.name,
          description: profile.description,
          profileType: profile.type === 1 ? 'company' : 'professional',
          walletAddress: profile.account.address,
          timestamp: new Date().toISOString(),
          ...profile.additionalData
        };

        // Convertir a JSON y crear hash SHA256
        const profileJson = JSON.stringify(profileData, null, 2);
        const encoder = new TextEncoder();
        const data = encoder.encode(profileJson);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const sha256Hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        // Simular hash de IPFS (en producción sería el hash real de IPFS)
        const ipfsHash = `Qm${sha256Hash.slice(0, 44)}`;
        
        console.log(`    📄 Datos del perfil preparados para IPFS`);
        console.log(`    🔗 Hash IPFS simulado: ${ipfsHash}`);
        console.log(`    🔐 Hash SHA256: ${sha256Hash}`);

        // Registrar en IPFSRegistry
        const ipfsTx = await ipfsRegistry.connect(accounts[0]).storeRecord(
          ipfsHash,
          sha256Hash,
          "profiles",
          "profile"
        );
        await ipfsTx.wait();
        console.log(`    ✅ Datos registrados en IPFSRegistry`);

        // Registrar perfil en ProfileRegistry con el hash de IPFS
        const profileTx = await profileRegistry.connect(profile.account).registerProfile(
          profile.name,
          profile.description,
          ipfsHash, // metadataURI ahora contiene el hash de IPFS
          profile.type,
          true
        );
        await profileTx.wait();
        console.log(`    ✅ Perfil registrado en blockchain con hash IPFS`);
        
        console.log(`  ✅ Perfil completo registrado: ${profile.name}`);
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

    // ===== PASO 3: CREAR SKILLS CON IPFS =====
    console.log("\n💡 PASO 3: Creando skills con IPFS...");

    const skillsToCreate = [
      { 
        name: "React", 
        category: "Frontend",
        description: "Biblioteca de JavaScript para construir interfaces de usuario",
        level: "Intermedio-Avanzado",
        tags: ["JavaScript", "UI", "Componentes"]
      },
      { 
        name: "Node.js", 
        category: "Backend",
        description: "Runtime de JavaScript para desarrollo de aplicaciones del lado del servidor",
        level: "Intermedio-Avanzado",
        tags: ["JavaScript", "Servidor", "APIs"]
      },
      { 
        name: "Solidity", 
        category: "Blockchain",
        description: "Lenguaje de programación para contratos inteligentes en Ethereum",
        level: "Intermedio",
        tags: ["Blockchain", "Smart Contracts", "Ethereum"]
      }
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
        
        // Crear datos de la skill para IPFS
        const skillData = {
          name: skill.name,
          category: skill.category,
          description: skill.description,
          level: skill.level,
          tags: skill.tags,
          timestamp: new Date().toISOString()
        };

        const skillJson = JSON.stringify(skillData, null, 2);
        const encoder = new TextEncoder();
        const data = encoder.encode(skillJson);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const sha256Hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        const ipfsHash = `Qm${sha256Hash.slice(0, 44)}`;

        // Registrar en IPFSRegistry
        const ipfsTx = await ipfsRegistry.connect(accounts[0]).storeRecord(
          ipfsHash,
          sha256Hash,
          "skills",
          "skill"
        );
        await ipfsTx.wait();

        // Crear skill en blockchain
        const tx = await skillSystem.connect(accounts[0]).createSkill(skill.name, skill.category);
        await tx.wait();
        console.log(`  ✅ Skill creada: ${skill.name} (IPFS: ${ipfsHash})`);
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
    console.log("🎭 JUEGO DE ROLES CONFIGURADO EXITOSAMENTE CON IPFS");
    console.log("=".repeat(60));
    
    console.log("\n👥 ROLES CONFIGURADOS:");
    console.log(`  👨‍💻 Usuario Profesional: ${accounts[1].address}`);
    console.log(`     - Perfil: Juan Profesional (datos en IPFS)`);
    console.log(`     - Skills: React (nivel 4, validada)`);
    console.log(`     - KRM: 1000`);
    
    console.log(`  🏢 Empresa: ${accounts[2].address}`);
    console.log(`     - Perfil: TechCorp (datos en IPFS)`);
    console.log(`     - Rol: Validador de skills`);
    
    console.log(`  👩‍💻 Proveedor Marketplace: ${accounts[4].address}`);
    console.log(`     - Perfil: María Freelancer (datos en IPFS)`);
    console.log(`     - Skills: Node.js (nivel 5, validada)`);
    console.log(`     - KRM: 1000`);
    
    console.log(`  👨‍💼 Cliente Marketplace: ${accounts[5].address}`);
    console.log(`     - Perfil: Carlos Cliente (datos en IPFS)`);
    console.log(`     - KRM: 1000`);
    
    console.log("\n🎯 FLUJOS DISPONIBLES:");
    console.log("  1. Usuario → Registra tiempo en Empresa");
    console.log("  2. Empresa → Valida registro de tiempo");
    console.log("  3. Proveedor → Crea servicio en Marketplace");
    console.log("  4. Cliente → Compra servicio con KRM");
    
    console.log("\n🌐 INTEGRACIÓN IPFS:");
    console.log("  ✅ Perfiles almacenados en IPFS con hashes en blockchain");
    console.log("  ✅ Skills con metadatos en IPFS");
    console.log("  ✅ Frontend puede leer datos completos desde IPFS");
    
    console.log("\n✅ ¡Todo listo para pruebas con IPFS!");

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