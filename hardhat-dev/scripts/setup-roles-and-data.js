const { ethers } = require("hardhat");

async function main() {
  console.log("🔧 Configurando roles y datos iniciales...");

  // Obtener las cuentas
  const [owner, user1, user2, user3, user4, user5] = await ethers.getSigners();
  
  // La cuenta que estás usando en el frontend
  const userAccount = "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65";
  
  console.log("👤 Owner:", owner.address);
  console.log("👤 Usuario frontend:", userAccount);

  // Obtener las direcciones de los contratos desplegados
  const deployedAddresses = require("../ignition/deployments/chain-31337/deployed_addresses.json");
  
  const KRMToken = deployedAddresses["MusubiDeployment#KRMToken"];
  const ProfileRegistry = deployedAddresses["MusubiDeployment#ProfileRegistry"];
  const SkillSystem = deployedAddresses["MusubiDeployment#SkillSystem"];
  const TimeRegistry = deployedAddresses["MusubiDeployment#TimeRegistry"];
  const P2PMarketplace = deployedAddresses["MusubiDeployment#P2PMarketplace"];

  console.log("📋 Direcciones de contratos:");
  console.log("  KRMToken:", KRMToken);
  console.log("  ProfileRegistry:", ProfileRegistry);
  console.log("  SkillSystem:", SkillSystem);
  console.log("  TimeRegistry:", TimeRegistry);
  console.log("  P2PMarketplace:", P2PMarketplace);

  // Obtener instancias de contratos
  const krmToken = await ethers.getContractAt("KRMToken", KRMToken);
  const profileRegistry = await ethers.getContractAt("ProfileRegistry", ProfileRegistry);
  const skillSystem = await ethers.getContractAt("SkillSystem", SkillSystem);
  const timeRegistry = await ethers.getContractAt("TimeRegistry", TimeRegistry);
  const p2pMarketplace = await ethers.getContractAt("P2PMarketplace", P2PMarketplace);

  // 1. Otorgar roles ADMIN_ROLE a la cuenta del usuario
  console.log("\n🔑 Otorgando roles ADMIN_ROLE...");
  
  try {
    const adminRole = await skillSystem.ADMIN_ROLE();
    const hasRole = await skillSystem.hasRole(adminRole, userAccount);
    
    if (!hasRole) {
      const tx = await skillSystem.grantRole(adminRole, userAccount);
      await tx.wait();
      console.log("✅ ADMIN_ROLE otorgado a", userAccount);
    } else {
      console.log("ℹ️  ADMIN_ROLE ya otorgado a", userAccount);
    }
  } catch (error) {
    console.log("❌ Error otorgando ADMIN_ROLE:", error.message);
  }

  // 2. Otorgar roles KARMA_ROLE a la cuenta del usuario
  console.log("\n🔑 Otorgando roles KARMA_ROLE...");
  
  try {
    const karmaRole = await skillSystem.KARMA_ROLE();
    const hasRole = await skillSystem.hasRole(karmaRole, userAccount);
    
    if (!hasRole) {
      const tx = await skillSystem.grantRole(karmaRole, userAccount);
      await tx.wait();
      console.log("✅ KARMA_ROLE otorgado a", userAccount);
    } else {
      console.log("ℹ️  KARMA_ROLE ya otorgado a", userAccount);
    }
  } catch (error) {
    console.log("❌ Error otorgando KARMA_ROLE:", error.message);
  }

  // 3. Otorgar roles en TimeRegistry
  console.log("\n🔑 Otorgando roles en TimeRegistry...");
  
  try {
    const adminRole = await timeRegistry.DEFAULT_ADMIN_ROLE();
    const hasRole = await timeRegistry.hasRole(adminRole, userAccount);
    
    if (!hasRole) {
      const tx = await timeRegistry.grantRole(adminRole, userAccount);
      await tx.wait();
      console.log("✅ DEFAULT_ADMIN_ROLE otorgado en TimeRegistry a", userAccount);
    } else {
      console.log("ℹ️  DEFAULT_ADMIN_ROLE ya otorgado en TimeRegistry a", userAccount);
    }
  } catch (error) {
    console.log("❌ Error otorgando roles en TimeRegistry:", error.message);
  }

  // 4. Otorgar roles en P2PMarketplace
  console.log("\n🔑 Otorgando roles en P2PMarketplace...");
  
  try {
    const adminRole = await p2pMarketplace.DEFAULT_ADMIN_ROLE();
    const hasRole = await p2pMarketplace.hasRole(adminRole, userAccount);
    
    if (!hasRole) {
      const tx = await p2pMarketplace.grantRole(adminRole, userAccount);
      await tx.wait();
      console.log("✅ DEFAULT_ADMIN_ROLE otorgado en P2PMarketplace a", userAccount);
    } else {
      console.log("ℹ️  DEFAULT_ADMIN_ROLE ya otorgado en P2PMarketplace a", userAccount);
    }
  } catch (error) {
    console.log("❌ Error otorgando roles en P2PMarketplace:", error.message);
  }

  // 5. Crear habilidades iniciales
  console.log("\n🎯 Creando habilidades iniciales...");
  
  const initialSkills = [
    { name: "JavaScript", category: "Programming" },
    { name: "React", category: "Frontend" },
    { name: "Solidity", category: "Blockchain" },
    { name: "Node.js", category: "Backend" },
    { name: "Python", category: "Programming" },
    { name: "Marketing Digital", category: "Marketing" },
    { name: "Diseño UX/UI", category: "Design" },
    { name: "Análisis de Datos", category: "Analytics" }
  ];

  for (const skill of initialSkills) {
    try {
      const tx = await skillSystem.createSkill(skill.name, skill.category);
      await tx.wait();
      console.log(`✅ Habilidad creada: ${skill.name} (${skill.category})`);
    } catch (error) {
      console.log(`❌ Error creando habilidad ${skill.name}:`, error.message);
    }
  }

  // 6. Registrar perfiles de prueba
  console.log("\n👤 Registrando perfiles de prueba...");
  
  const testProfiles = [
    { address: user1.address, isCompany: false, metadata: "ipfs://QmProfile1" },
    { address: user2.address, isCompany: true, metadata: "ipfs://QmCompany1" },
    { address: user3.address, isCompany: false, metadata: "ipfs://QmProfile2" }
  ];

  for (const profile of testProfiles) {
    try {
      // Usar el signer correspondiente
      const signer = await ethers.getSigner(profile.address);
      const profileContract = profileRegistry.connect(signer);
      
      const tx = await profileContract.registerProfile(profile.isCompany, profile.metadata);
      await tx.wait();
      console.log(`✅ Perfil registrado: ${profile.address} (${profile.isCompany ? 'Empresa' : 'Profesional'})`);
    } catch (error) {
      console.log(`❌ Error registrando perfil ${profile.address}:`, error.message);
    }
  }

  // 7. Crear servicios de prueba
  console.log("\n🛒 Creando servicios de prueba...");
  
  const testServices = [
    { title: "Desarrollo Web Full Stack", description: "Desarrollo completo de aplicaciones web", pricePerHour: ethers.parseEther("50"), skillIds: [0, 1, 3] },
    { title: "Consultoría Blockchain", description: "Asesoramiento en proyectos blockchain", pricePerHour: ethers.parseEther("100"), skillIds: [2] },
    { title: "Marketing Digital", description: "Estrategias de marketing digital", pricePerHour: ethers.parseEther("75"), skillIds: [5] }
  ];

  for (const service of testServices) {
    try {
      const tx = await p2pMarketplace.createService(
        service.title,
        service.description,
        service.pricePerHour,
        service.skillIds
      );
      await tx.wait();
      console.log(`✅ Servicio creado: ${service.title}`);
    } catch (error) {
      console.log(`❌ Error creando servicio ${service.title}:`, error.message);
    }
  }

  // 8. Crear registros de tiempo de prueba
  console.log("\n⏰ Creando registros de tiempo de prueba...");
  
  const now = Math.floor(Date.now() / 1000);
  const testTimeRecords = [
    { company: user2.address, startTime: now - 3600, endTime: now, description: "Desarrollo de frontend", skillIds: [0, 1] },
    { company: user2.address, startTime: now - 7200, endTime: now - 3600, description: "Reunión de planificación", skillIds: [] }
  ];

  for (const record of testTimeRecords) {
    try {
      const tx = await timeRegistry.registerTime(
        record.company,
        record.startTime,
        record.endTime,
        record.description,
        record.skillIds
      );
      await tx.wait();
      console.log(`✅ Registro de tiempo creado: ${record.description}`);
    } catch (error) {
      console.log(`❌ Error creando registro de tiempo:`, error.message);
    }
  }

  console.log("\n🎉 Configuración completada!");
  console.log("\n📋 Resumen:");
  console.log("  ✅ Roles otorgados a la cuenta del frontend");
  console.log("  ✅ Habilidades iniciales creadas");
  console.log("  ✅ Perfiles de prueba registrados");
  console.log("  ✅ Servicios de prueba creados");
  console.log("  ✅ Registros de tiempo de prueba creados");
  
  console.log("\n🌐 Ahora puedes probar el frontend en  http://localhost:5174/");
  console.log("👤 Usa la cuenta:", userAccount);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  }); 