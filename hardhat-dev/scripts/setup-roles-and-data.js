const { ethers } = require("hardhat");

async function main() {
  console.log("🔧 Configurando roles y datos iniciales...");

  // Obtener las cuentas
  const [owner, user1, user2, user3, user4, user5] = await ethers.getSigners();
  
  // La cuenta que estás usando en el frontend
  const userAccount = "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65";
  
  console.log("👤 Owner:", owner.address);
  console.log("👤 Usuario frontend:", userAccount);

  // Usar las direcciones correctas de los contratos recién desplegados
  const KRMToken = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  const ProfileRegistry = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
  const SkillSystem = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";
  const TimeRegistry = "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853";
  const P2PMarketplace = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";

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

  // 1. Otorgar roles correctos
  console.log("\n🔑 Otorgando roles KARMA_ROLE...");
  const KARMA_ROLE = ethers.keccak256(ethers.toUtf8Bytes("KARMA_ROLE"));
  const DEFAULT_ADMIN_ROLE = "0x" + "0".repeat(64);
  try {
    // KARMA_ROLE en SkillSystem
    await skillSystem.grantRole(KARMA_ROLE, userAccount);
    console.log("✅ KARMA_ROLE otorgado en SkillSystem a", userAccount);
  } catch (error) {
    console.log("❌ Error otorgando KARMA_ROLE en SkillSystem:", error.message);
  }
  try {
    // KARMA_ROLE en TimeRegistry
    await timeRegistry.grantRole(KARMA_ROLE, userAccount);
    console.log("✅ KARMA_ROLE otorgado en TimeRegistry a", userAccount);
  } catch (error) {
    console.log("❌ Error otorgando KARMA_ROLE en TimeRegistry:", error.message);
  }
  try {
    // DEFAULT_ADMIN_ROLE en P2PMarketplace
    await p2pMarketplace.grantRole(DEFAULT_ADMIN_ROLE, userAccount);
    console.log("✅ DEFAULT_ADMIN_ROLE otorgado en P2PMarketplace a", userAccount);
  } catch (error) {
    console.log("❌ Error otorgando DEFAULT_ADMIN_ROLE en P2PMarketplace:", error.message);
  }

  // 2. Crear habilidades iniciales
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

  // 3. Registrar perfiles de prueba
  console.log("\n👤 Registrando perfiles de prueba...");
  const testProfiles = [
    { signer: user1, name: "Juan Profesional", description: "Desarrollador", metadata: "ipfs://QmProfile1", profileType: 0 },
    { signer: user2, name: "Empresa S.A.", description: "Empresa de tecnología", metadata: "ipfs://QmCompany1", profileType: 1 },
    { signer: user3, name: "Ana Experta", description: "Especialista en datos", metadata: "ipfs://QmProfile2", profileType: 0 }
  ];
  for (const profile of testProfiles) {
    try {
      const profileContract = profileRegistry.connect(profile.signer);
      const tx = await profileContract.registerProfile(
        profile.name,
        profile.description,
        profile.metadata,
        profile.profileType,
        true // acceptDisclaimer
      );
      await tx.wait();
      console.log(`✅ Perfil registrado: ${profile.name} (${profile.profileType === 0 ? 'Profesional' : 'Empresa'})`);
    } catch (error) {
      console.log(`❌ Error registrando perfil ${profile.name}:`, error.message);
    }
  }

  // 4. Crear servicios de prueba
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

  // 5. Crear registros de tiempo de prueba
  console.log("\n⏰ Creando registros de tiempo de prueba...");
  const now = Math.floor(Date.now() / 1000);
  const testTimeRecords = [
    { signer: user1, company: user2.address, skillId: 0, startTime: now - 3600, endTime: now, description: "Desarrollo de frontend" },
    { signer: user3, company: user2.address, skillId: 4, startTime: now - 7200, endTime: now - 3600, description: "Reunión de planificación" }
  ];
  for (const record of testTimeRecords) {
    try {
      const timeContract = timeRegistry.connect(record.signer);
      const tx = await timeContract.recordTime(
        record.company,
        record.skillId,
        record.startTime,
        record.endTime,
        record.description
      );
      await tx.wait();
      console.log(`✅ Registro de tiempo creado: ${record.description}`);
    } catch (error) {
      console.log(`❌ Error creando registro de tiempo:`, error.message);
    }
  }

  // 6. Distribuir tokens KRM
  console.log("\n💰 Distribuyendo tokens KRM...");
  const recipients = [user1.address, user2.address, user3.address, user4.address, user5.address];
  for (const recipient of recipients) {
    try {
      // Mint 1000 KRM a cada cuenta (si tienes el rol)
      const tx = await krmToken.mint(recipient, ethers.parseEther("1000"));
      await tx.wait();
      console.log(`✅ KRM minteados a ${recipient}`);
    } catch (error) {
      console.log(`❌ Error minteando KRM a ${recipient}:`, error.message);
    }
  }

  // 7. Verificar balances finales
  console.log("\n📊 Verificando balances finales...");
  for (const recipient of recipients) {
    try {
      const balance = await krmToken.balanceOf(recipient);
      console.log(`💰 Balance de ${recipient}:`, ethers.formatEther(balance));
    } catch (error) {
      console.log(`❌ Error verificando balance de ${recipient}:`, error.message);
    }
  }

  console.log("\n🎉 Configuración completada!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 