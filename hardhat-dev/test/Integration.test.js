const { expect } = require("chai");
const { ethers } = require("hardhat");

// Función helper para verificar y declarar habilidades
async function ensureSkillDeclared(skillSystem, professional, validator, skillId, level) {
  try {
    // Verificar si la habilidad ya está declarada
    const declaredSkill = await skillSystem.getDeclaredSkill(professional.address, skillId);
    if (declaredSkill.skillId == 0) {
      // Solo declarar si no existe
      await skillSystem.connect(professional).declareSkill(skillId, level);
      await skillSystem.connect(validator).validateSkill(professional.address, skillId, true);
    }
  } catch (error) {
    // Si hay error, declarar la habilidad
    await skillSystem.connect(professional).declareSkill(skillId, level);
    await skillSystem.connect(validator).validateSkill(professional.address, skillId, true);
  }
}

describe("Integration Tests", function () {
  let KRMToken;
  let ProfileRegistry;
  let SkillSystem;
  let TimeRegistry;
  let P2PMarketplace;
  let ProfileNFT;
  
  let krmToken;
  let profileRegistry;
  let skillSystem;
  let timeRegistry;
  let marketplace;
  let profileNFT;
  
  let owner;
  let professional;
  let company;
  let validator;
  let client;
  let addrs;

  beforeEach(async function () {
    [owner, professional, validator, company, client, ...addrs] = await ethers.getSigners();

    // Desplegar KRMToken
    KRMToken = await ethers.getContractFactory("KRMToken");
    krmToken = await KRMToken.deploy(owner.address);
    await krmToken.waitForDeployment();

    // Desplegar ProfileRegistry
    ProfileRegistry = await ethers.getContractFactory("ProfileRegistry");
    profileRegistry = await ProfileRegistry.deploy();
    await profileRegistry.waitForDeployment();

    // Desplegar SkillSystem
    SkillSystem = await ethers.getContractFactory("SkillSystem");
    skillSystem = await SkillSystem.deploy(await profileRegistry.getAddress());
    await skillSystem.waitForDeployment();

    // Desplegar TimeRegistry
    TimeRegistry = await ethers.getContractFactory("TimeRegistry");
    timeRegistry = await TimeRegistry.deploy(await profileRegistry.getAddress(), await skillSystem.getAddress());
    await timeRegistry.waitForDeployment();

    // Desplegar ProfileNFT
    ProfileNFT = await ethers.getContractFactory("ProfileNFT");
    profileNFT = await ProfileNFT.deploy(await profileRegistry.getAddress(), ethers.ZeroAddress);
    await profileNFT.waitForDeployment();

    // Desplegar P2PMarketplace
    P2PMarketplace = await ethers.getContractFactory("P2PMarketplace");
    marketplace = await P2PMarketplace.deploy(owner.address, await krmToken.getAddress());
    await marketplace.waitForDeployment();

    // Configurar direcciones de contratos
    await marketplace.connect(owner).setContractAddresses(await profileRegistry.getAddress(), await skillSystem.getAddress());

    // Registrar perfiles - IMPORTANTE: Cada uno con su propio perfil
    const metadataURI = "ipfs://QmXnnyufdzAWL5CqZ2RnSNgPbvCc1ALT73s6epPrRnZ1Xy";
    
    // Verificar si los perfiles ya existen antes de registrarlos
    if (!(await profileRegistry.hasRegisteredProfile(owner.address))) {
      await profileRegistry.connect(owner).registerProfile("Admin", "Administrador del sistema", metadataURI, 0, true);
    }
    if (!(await profileRegistry.hasRegisteredProfile(professional.address))) {
      await profileRegistry.connect(professional).registerProfile("Juan Pérez", "Desarrollador", metadataURI, 0, true);
    }
    if (!(await profileRegistry.hasRegisteredProfile(validator.address))) {
      await profileRegistry.connect(validator).registerProfile("Validator", "Validador del sistema", metadataURI, 1, true);
    }
    
    // Otorgar rol de verificador al validator
    const verifierRole = await profileRegistry.VERIFIER_ROLE();
    await profileRegistry.connect(owner).grantRole(verifierRole, validator.address);
    // Otorgar rol de karma al validator en ProfileRegistry
    const karmaRole = await profileRegistry.KARMA_ROLE();
    await profileRegistry.connect(owner).grantRole(karmaRole, validator.address);
    // Otorgar rol de karma al validator en SkillSystem también
    const skillSystemKarmaRole = await skillSystem.KARMA_ROLE();
    await skillSystem.connect(owner).grantRole(skillSystemKarmaRole, validator.address);
    // Otorgar rol de karma al contrato SkillSystem en ProfileRegistry para que pueda actualizar karma
    await profileRegistry.connect(owner).grantRole(karmaRole, await skillSystem.getAddress());
    
    // Verificar perfiles - IMPORTANTE: Cada uno verifica a otros, no a sí mismo
    if (!(await profileRegistry.hasVerifiedProfile(owner.address))) {
      await profileRegistry.connect(validator).verifyProfile(owner.address);
    }
    if (!(await profileRegistry.hasVerifiedProfile(professional.address))) {
      await profileRegistry.connect(owner).verifyProfile(professional.address);
    }
    if (!(await profileRegistry.hasVerifiedProfile(validator.address))) {
      await profileRegistry.connect(owner).verifyProfile(validator.address);
    }
    
    // IMPORTANTE: El validator NO debe declarar habilidades para poder validar las de otros
  });

  describe("Flujo completo de registro y validación", function () {
    it("Debería permitir el flujo completo: registro → verificación → habilidades → NFT", async function () {
      // El profesional y el validador ya tienen perfil y están verificados desde el beforeEach
      // 1. Crear habilidad
      await skillSystem.connect(owner).createSkill("JavaScript", "Programming");
      // 2. Declarar habilidad
      await skillSystem.connect(professional).declareSkill(0, 4);
      // 3. Verificar que el validator tiene el rol KARMA_ROLE
      const karmaRole = await profileRegistry.KARMA_ROLE();
      expect(await profileRegistry.hasRole(karmaRole, validator.address)).to.be.true;
      // 4. Validar habilidad (validator valida al professional)
      await skillSystem.connect(validator).validateSkill(professional.address, 0, true);
      // 5. Mintear NFT de perfil
      const nftMetadataURI = "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
      await profileNFT.connect(owner).mintBuild(professional.address, nftMetadataURI);
      const tokenId = await profileNFT.getBuildTokenId(professional.address);
      // 6. Verificar NFT
      expect(await profileNFT.balanceOf(professional.address)).to.equal(1);
      expect(await profileNFT.tokenURI(tokenId)).to.equal(nftMetadataURI);
    });
  });

  describe("Flujo de marketplace", function () {
    beforeEach(async function () {
      // El provider y el client ya tienen perfil y están verificados desde el beforeEach
      // Crear habilidad y validarla para el professional
      await skillSystem.connect(owner).createSkill("JavaScript", "Programming");
      await skillSystem.connect(professional).declareSkill(0, 4);
      // El validator ya tiene el rol KARMA_ROLE desde el beforeEach principal
      await skillSystem.connect(validator).validateSkill(professional.address, 0, true);
      
      // Asegurar que el cliente tiene un perfil registrado y verificado
      if (!(await profileRegistry.hasProfile(client.address))) {
        const metadataURI = "ipfs://QmXnnyufdzAWL5CqZ2RnSNgPbvCc1ALT73s6epPrRnZ1Xy";
        await profileRegistry.connect(client).registerProfile("Cliente", "Cliente", metadataURI, 0, true);
      }
      if (!(await profileRegistry.hasVerifiedProfile(client.address))) {
        await profileRegistry.connect(owner).verifyProfile(client.address);
      }
      
      // Transferir KRM al cliente
      await krmToken.connect(owner).transfer(client.address, ethers.parseEther("1000"));
      
      // Aprobar tokens KRM al contrato marketplace
      await krmToken.connect(client).approve(await marketplace.getAddress(), ethers.parseEther("1000"));
    });
    it("Debería permitir crear servicio y orden", async function () {
      // La habilidad ya está declarada y validada en el beforeEach
      
      // 1. Crear servicio
      await marketplace.connect(professional).createService(
        "Desarrollo Web",
        "Desarrollo de aplicaciones web con React",
        100, // 100 KRM por hora
        [0] // skillId
      );
      let service = await marketplace.services(0);
      expect(service.title).to.equal("Desarrollo Web");
      expect(service.provider).to.equal(professional.address);
      // 2. Crear orden
      await marketplace.connect(client).createOrder(0, 5, "Proyecto de e-commerce");
      let order = await marketplace.orders(0);
      expect(order.serviceId).to.equal(0);
      expect(order.client).to.equal(client.address);
      expect(order.provider).to.equal(professional.address);
      expect(order.totalPrice).to.equal(500); // 5 horas * 100 KRM
      // 3. Aceptar orden
      await marketplace.connect(professional).acceptOrder(0);
      order = await marketplace.orders(0);
      expect(order.status).to.equal(1); // Accepted
      // 4. Completar orden
      await marketplace.connect(client).completeOrder(0);
      order = await marketplace.orders(0);
      expect(order.status).to.equal(2); // Completed
    });
  });

  describe("Flujo de registro de tiempo", function () {
    beforeEach(async function () {
      // El professional y la company ya tienen perfil y están verificados desde el beforeEach
      // Crear habilidad y validarla para el professional
      await skillSystem.connect(owner).createSkill("JavaScript", "Programming");
      await skillSystem.connect(professional).declareSkill(0, 3);
      // El validator ya tiene el rol KARMA_ROLE desde el beforeEach principal
      await skillSystem.connect(validator).validateSkill(professional.address, 0, true);
      
      // Asegurar que la empresa tiene un perfil registrado
      if (!(await profileRegistry.hasProfile(company.address))) {
        const metadataURI = "ipfs://QmXnnyufdzAWL5CqZ2RnSNgPbvCc1ALT73s6epPrRnZ1Xy";
        await profileRegistry.connect(company).registerProfile("Empresa", "Empresa", metadataURI, 1, true);
      }
      
      // Asegurar que la empresa tiene el rol KARMA_ROLE para poder validar registros de tiempo
      const karmaRole = await profileRegistry.KARMA_ROLE();
      if (!(await profileRegistry.hasRole(karmaRole, company.address))) {
        await profileRegistry.connect(owner).grantRole(karmaRole, company.address);
      }
      
      // Asegurar que el contrato TimeRegistry tiene el rol KARMA_ROLE en ProfileRegistry
      if (!(await profileRegistry.hasRole(karmaRole, await timeRegistry.getAddress()))) {
        await profileRegistry.connect(owner).grantRole(karmaRole, await timeRegistry.getAddress());
      }
    });
    it("Debería permitir registrar y validar tiempo", async function () {
      // La habilidad ya está declarada y validada en el beforeEach
      
      const startTime = Math.floor(Date.now() / 1000) - 3600; // 1 hora atrás
      const endTime = Math.floor(Date.now() / 1000); // ahora
      // 1. Registrar tiempo
      await timeRegistry.connect(professional).recordTime(
        company.address,
        0, // skillId
        startTime,
        endTime,
        "Desarrollo de funcionalidad"
      );
      let record = await timeRegistry.timeRecords(0);
      expect(record.professional).to.equal(professional.address);
      expect(record.company).to.equal(company.address);
      expect(record.totalHours).to.equal(1);
      expect(record.status).to.equal(0); // Pending
      // 2. Validar tiempo
      await timeRegistry.connect(company).validateTimeRecord(0);
      record = await timeRegistry.timeRecords(0);
      expect(record.status).to.equal(1); // Validated
      expect(record.validatedBy).to.equal(company.address);
      // 3. Verificar que se incrementó el karma
      const profile = await profileRegistry.profiles(professional.address);
      expect(profile.karma).to.be.gt(0);
    });
  });

  describe("Interoperabilidad entre contratos", function () {
    it("Debería verificar que los contratos están correctamente conectados", async function () {
      // Verificar que SkillSystem tiene acceso a ProfileRegistry
      const skillSystemProfileRegistry = await skillSystem.profileRegistry();
      expect(skillSystemProfileRegistry).to.equal(await profileRegistry.getAddress());

      // Verificar que TimeRegistry tiene acceso a ambos contratos
      const timeRegistryProfileRegistry = await timeRegistry.profileRegistry();
      const timeRegistrySkillSystem = await timeRegistry.skillSystem();
      expect(timeRegistryProfileRegistry).to.equal(await profileRegistry.getAddress());
      expect(timeRegistrySkillSystem).to.equal(await skillSystem.getAddress());

      // Verificar que Marketplace tiene acceso a los contratos
      const marketplaceProfileRegistry = await marketplace.profileRegistry();
      const marketplaceSkillSystem = await marketplace.skillSystem();
      expect(marketplaceProfileRegistry).to.equal(await profileRegistry.getAddress());
      expect(marketplaceSkillSystem).to.equal(await skillSystem.getAddress());
    });

    it("Debería permitir actualizar karma desde múltiples contratos", async function () {
      // El professional ya tiene perfil y está verificado desde el beforeEach
      // Crear habilidad y validarla
      await skillSystem.connect(owner).createSkill("JavaScript", "Programming");
      await skillSystem.connect(professional).declareSkill(0, 4);
      // El validator ya tiene el rol KARMA_ROLE desde el beforeEach principal
      await skillSystem.connect(validator).validateSkill(professional.address, 0, true);
      
      let profile = await profileRegistry.profiles(professional.address);
      expect(profile.karma).to.be.gt(0);
      
      // Actualizar karma directamente desde ProfileRegistry
      await profileRegistry.connect(owner).updateKarma(professional.address, 100);
      
      profile = await profileRegistry.profiles(professional.address);
      expect(profile.karma).to.equal(100);
    });
  });

  describe("Gestión de roles y permisos", function () {
    it("Debería verificar que los roles están correctamente configurados", async function () {
      // Verificar roles en ProfileRegistry
      const verifierRole = await profileRegistry.VERIFIER_ROLE();
      const karmaRole = await profileRegistry.KARMA_ROLE();
      expect(await profileRegistry.hasRole(verifierRole, owner.address)).to.be.true;
      expect(await profileRegistry.hasRole(karmaRole, owner.address)).to.be.true;

      // Verificar roles en SkillSystem
      const skillSystemKarmaRole = await skillSystem.KARMA_ROLE();
      expect(await skillSystem.hasRole(skillSystemKarmaRole, owner.address)).to.be.true;

      // Verificar roles en TimeRegistry
      const timeRegistryKarmaRole = await timeRegistry.KARMA_ROLE();
      expect(await timeRegistry.hasRole(timeRegistryKarmaRole, owner.address)).to.be.true;

      // Verificar roles en Marketplace
      const feeManagerRole = await marketplace.FEE_MANAGER_ROLE();
      expect(await marketplace.hasRole(feeManagerRole, owner.address)).to.be.true;

      // Verificar roles en ProfileNFT
      const minterRole = await profileNFT.MINTER_ROLE();
      expect(await profileNFT.hasRole(minterRole, owner.address)).to.be.true;
    });

    it("Debería permitir otorgar roles a otros usuarios", async function () {
      const verifierRole = await profileRegistry.VERIFIER_ROLE();
      await profileRegistry.connect(owner).grantRole(verifierRole, validator.address);
      
      expect(await profileRegistry.hasRole(verifierRole, validator.address)).to.be.true;
      
      // Verificar que el nuevo validador puede verificar perfiles
      // Usar un nuevo profesional de addrs para evitar conflictos
      const newProfessional = addrs[0];
      const metadataURI = "ipfs://QmXnnyufdzAWL5CqZ2RnSNgPbvCc1ALT73s6epPrRnZ1Xy";
      await profileRegistry.connect(newProfessional).registerProfile("Nuevo Profesional", "Desarrollador", metadataURI, 0, true);
      
      await profileRegistry.connect(validator).verifyProfile(newProfessional.address);
      
      const profile = await profileRegistry.profiles(newProfessional.address);
      expect(profile.isVerified).to.be.true;
    });
  });
}); 