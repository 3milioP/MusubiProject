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
  let KRMToken, krmToken;
  let ProfileRegistry, profileRegistry;
  let SkillSystem, skillSystem;
  let TimeRegistry, timeRegistry;
  let ProfileNFT, profileNFT;
  let P2PMarketplace, marketplace;
  let IPFSRegistry, ipfsRegistry;
  
  let owner;
  let professional;
  let validator;
  let company;
  let client;
  let addrs;

  beforeEach(async function () {
    [owner, professional, validator, company, client, ...addrs] = await ethers.getSigners();

    // Desplegar IPFSRegistry primero (sin parámetros)
    IPFSRegistry = await ethers.getContractFactory("IPFSRegistry");
    ipfsRegistry = await IPFSRegistry.deploy();
    await ipfsRegistry.waitForDeployment();

    // Desplegar KRMToken (necesita treasury wallet)
    KRMToken = await ethers.getContractFactory("KRMToken");
    krmToken = await KRMToken.deploy(owner.address);
    await krmToken.waitForDeployment();

    // Desplegar ProfileRegistry (necesita IPFSRegistry)
    ProfileRegistry = await ethers.getContractFactory("ProfileRegistry");
    profileRegistry = await ProfileRegistry.deploy(await ipfsRegistry.getAddress());
    await profileRegistry.waitForDeployment();

    // Desplegar SkillSystem (necesita IPFSRegistry)
    SkillSystem = await ethers.getContractFactory("SkillSystem");
    skillSystem = await SkillSystem.deploy(await ipfsRegistry.getAddress());
    await skillSystem.waitForDeployment();

    // Desplegar TimeRegistry (necesita IPFSRegistry y SkillSystem)
    TimeRegistry = await ethers.getContractFactory("TimeRegistry");
    timeRegistry = await TimeRegistry.deploy(await ipfsRegistry.getAddress(), await skillSystem.getAddress());
    await timeRegistry.waitForDeployment();

    // Desplegar ProfileNFT (necesita ProfileRegistry y SkillSystem)
    ProfileNFT = await ethers.getContractFactory("ProfileNFT");
    profileNFT = await ProfileNFT.deploy(await profileRegistry.getAddress(), await skillSystem.getAddress());
    await profileNFT.waitForDeployment();

    // Desplegar P2PMarketplace (necesita owner y KRM token)
    P2PMarketplace = await ethers.getContractFactory("P2PMarketplace");
    marketplace = await P2PMarketplace.deploy(owner.address, await krmToken.getAddress());
    await marketplace.waitForDeployment();

    // Configurar direcciones de contratos en marketplace
    await marketplace.connect(owner).setContractAddresses(await profileRegistry.getAddress(), await skillSystem.getAddress(), await ipfsRegistry.getAddress());

    // Registrar algunos hashes de IPFS para las pruebas
    const profileHash = "ipfs://QmXnnyufdzAWL5CqZ2RnSNgPbvCc1ALT73s6epPrRnZ1Xy";
    const skillHash = "ipfs://QmSkillHash123456789";
    const declarationHash = "ipfs://QmDeclarationHash123456789";
    const timeHash = "ipfs://QmTimeHash123456789";
    const serviceHash = "ipfs://QmServiceHash123456789";
    const orderHash = "ipfs://QmOrderHash123456789";
    const nftHash = "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";

    // Registrar hashes en IPFSRegistry
    await ipfsRegistry.connect(owner).storeRecord(profileHash, "sha256hash1", "profiles", "profile");
    await ipfsRegistry.connect(owner).storeRecord(skillHash, "sha256hash2", "skills", "skill");
    await ipfsRegistry.connect(owner).storeRecord(declarationHash, "sha256hash3", "declarations", "declaration");
    await ipfsRegistry.connect(owner).storeRecord(timeHash, "sha256hash4", "time", "time");
    await ipfsRegistry.connect(owner).storeRecord(serviceHash, "sha256hash5", "services", "service");
    await ipfsRegistry.connect(owner).storeRecord(orderHash, "sha256hash6", "orders", "order");
    await ipfsRegistry.connect(owner).storeRecord(nftHash, "sha256hash7", "nfts", "nft");

    // Registrar perfiles - IMPORTANTE: Cada uno con su propio perfil
    // Verificar si los perfiles ya existen antes de registrarlos
    if (!(await profileRegistry.hasRegisteredProfile(owner.address))) {
      await profileRegistry.connect(owner).registerProfile(profileHash, 0); // Individual
    }
    if (!(await profileRegistry.hasRegisteredProfile(professional.address))) {
      await profileRegistry.connect(professional).registerProfile(profileHash, 1); // Professional
    }
    if (!(await profileRegistry.hasRegisteredProfile(validator.address))) {
      await profileRegistry.connect(validator).registerProfile(profileHash, 0); // Individual
    }
    
    // Otorgar rol VERIFIER_ROLE al validator en ProfileRegistry
    const verifierRole = await profileRegistry.VERIFIER_ROLE();
    await profileRegistry.connect(owner).grantRole(verifierRole, validator.address);
    // Otorgar rol de karma al validator en ProfileRegistry
    const karmaRole = await profileRegistry.KARMA_ROLE();
    await profileRegistry.connect(owner).grantRole(karmaRole, validator.address);
    // Otorgar rol de karma al validator en SkillSystem también
    const skillSystemKarmaRole = await skillSystem.KARMA_ROLE();
    await skillSystem.connect(owner).grantRole(skillSystemKarmaRole, validator.address);
    // Otorgar rol VALIDATOR_ROLE al validator en SkillSystem
    const skillSystemValidatorRole = await skillSystem.VALIDATOR_ROLE();
    await skillSystem.connect(owner).grantRole(skillSystemValidatorRole, validator.address);
    // Otorgar rol de karma al contrato SkillSystem en ProfileRegistry para que pueda actualizar karma
    await profileRegistry.connect(owner).grantRole(karmaRole, await skillSystem.getAddress());
    
    // Verificar perfiles - IMPORTANTE: Cada uno verifica a otros, no a sí mismo
    if (!(await profileRegistry.hasVerifiedProfile(owner.address))) {
      // Cambiar estado a activo antes de verificar
      await profileRegistry.connect(owner).changeProfileStatus(owner.address, 1); // Active
      await profileRegistry.connect(validator).verifyProfile(owner.address, 100);
    }
    if (!(await profileRegistry.hasVerifiedProfile(professional.address))) {
      // Cambiar estado a activo antes de verificar
      await profileRegistry.connect(owner).changeProfileStatus(professional.address, 1); // Active
      await profileRegistry.connect(validator).verifyProfile(professional.address, 100);
    }
    if (!(await profileRegistry.hasVerifiedProfile(validator.address))) {
      // Cambiar estado a activo antes de verificar
      await profileRegistry.connect(owner).changeProfileStatus(validator.address, 1); // Active
      // El owner verifica al validator, no el validator a sí mismo
      await profileRegistry.connect(owner).verifyProfile(validator.address, 100);
    }
    
    // IMPORTANTE: El validator NO debe declarar habilidades para poder validar las de otros
  });

  describe("Flujo completo de registro y validación", function () {
    it("Debería permitir el flujo completo: registro → verificación → habilidades → NFT", async function () {
      // El profesional y el validador ya tienen perfil y están verificados desde el beforeEach
      // 1. Crear habilidad
      await skillSystem.connect(owner).createSkill("ipfs://QmSkillHash123456789");
      // 2. Declarar habilidad
      await skillSystem.connect(professional).declareSkill(0, "ipfs://QmDeclarationHash123456789", 4);
      // 3. Verificar que el validator tiene el rol KARMA_ROLE
      const karmaRole = await profileRegistry.KARMA_ROLE();
      expect(await profileRegistry.hasRole(karmaRole, validator.address)).to.be.true;
      // 4. Validar habilidad (validator valida al professional)
      await skillSystem.connect(validator).validateSkill(professional.address, 0, 4);
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
      await skillSystem.connect(owner).createSkill("ipfs://QmSkillHash123456789");
      await skillSystem.connect(professional).declareSkill(0, "ipfs://QmDeclarationHash123456789", 4);
      // El validator ya tiene el rol KARMA_ROLE desde el beforeEach principal
      await skillSystem.connect(validator).validateSkill(professional.address, 0, 4);
      
      // Asegurar que el cliente tiene un perfil registrado y verificado
      if (!(await profileRegistry.hasRegisteredProfile(client.address))) {
        await profileRegistry.connect(client).registerProfile("ipfs://QmXnnyufdzAWL5CqZ2RnSNgPbvCc1ALT73s6epPrRnZ1Xy", 0);
      }
      if (!(await profileRegistry.hasVerifiedProfile(client.address))) {
        // Cambiar estado a activo antes de verificar
        await profileRegistry.connect(owner).changeProfileStatus(client.address, 1); // Active
        await profileRegistry.connect(owner).verifyProfile(client.address, 100);
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
        "ipfs://QmServiceHash123456789",
        100, // 100 KRM por hora
        [0] // skillId
      );
      let service = await marketplace.services(0);
      expect(service.provider).to.equal(professional.address);
      // 2. Crear orden
      await marketplace.connect(client).createOrder(0, 5, "ipfs://QmOrderHash123456789");
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
      await skillSystem.connect(owner).createSkill("ipfs://QmSkillHash123456789");
      await skillSystem.connect(professional).declareSkill(0, "ipfs://QmDeclarationHash123456789", 3);
      // El validator ya tiene el rol KARMA_ROLE desde el beforeEach principal
      await skillSystem.connect(validator).validateSkill(professional.address, 0, 3);
      
      // Asegurar que la empresa tiene un perfil registrado
      if (!(await profileRegistry.hasRegisteredProfile(company.address))) {
        await profileRegistry.connect(company).registerProfile("ipfs://QmXnnyufdzAWL5CqZ2RnSNgPbvCc1ALT73s6epPrRnZ1Xy", 2); // Company
      }
      
      // Asegurar que la empresa tiene el rol KARMA_ROLE para poder validar registros de tiempo
      const karmaRole = await profileRegistry.KARMA_ROLE();
      if (!(await profileRegistry.hasRole(karmaRole, company.address))) {
        await profileRegistry.connect(owner).grantRole(karmaRole, company.address);
      }
      
      // Asegurar que la empresa tiene el rol VALIDATOR_ROLE en TimeRegistry
      const timeRegistryValidatorRole = await timeRegistry.VALIDATOR_ROLE();
      if (!(await timeRegistry.hasRole(timeRegistryValidatorRole, company.address))) {
        await timeRegistry.connect(owner).grantRole(timeRegistryValidatorRole, company.address);
      }
      
      // Asegurar que el contrato TimeRegistry tiene el rol KARMA_ROLE en ProfileRegistry
      if (!(await profileRegistry.hasRole(karmaRole, await timeRegistry.getAddress()))) {
        await profileRegistry.connect(owner).grantRole(karmaRole, await timeRegistry.getAddress());
      }
    });
    it("Debería permitir registrar y validar tiempo", async function () {
      // La habilidad ya está declarada y validada en el beforeEach
      
      // 1. Registrar tiempo
      await timeRegistry.connect(professional).registerTime(
        0, // skillId
        "ipfs://QmTimeHash123456789",
        5, // hoursWorked
        100 // hourlyRate
      );
      let record = await timeRegistry.timeEntries(0);
      expect(record.professional).to.equal(professional.address);
      expect(record.skillId).to.equal(0);
      expect(record.hoursWorked).to.equal(5);
      expect(record.totalAmount).to.equal(500); // 5 * 100
      expect(record.isValidated).to.equal(false);
      
      // 2. Validar tiempo
      await timeRegistry.connect(company).validateTimeEntry(0);
      record = await timeRegistry.timeEntries(0);
      expect(record.isValidated).to.equal(true);
      expect(record.validatedBy).to.equal(company.address);
    });
  });

  describe("Interoperabilidad entre contratos", function () {
    it("Debería verificar que los contratos están correctamente conectados", async function () {
      // Verificar que SkillSystem tiene acceso a IPFSRegistry
      const skillSystemIpfsRegistry = await skillSystem.ipfsRegistry();
      expect(skillSystemIpfsRegistry).to.equal(await ipfsRegistry.getAddress());

      // Verificar que TimeRegistry tiene acceso a ambos contratos
      const timeRegistryIpfsRegistry = await timeRegistry.ipfsRegistry();
      const timeRegistrySkillSystem = await timeRegistry.skillSystem();
      expect(timeRegistryIpfsRegistry).to.equal(await ipfsRegistry.getAddress());
      expect(timeRegistrySkillSystem).to.equal(await skillSystem.getAddress());

      // Verificar que Marketplace tiene acceso a los contratos
      const marketplaceIpfsRegistry = await marketplace.ipfsRegistry();
      const marketplaceSkillSystem = await marketplace.skillSystem();
      expect(marketplaceIpfsRegistry).to.equal(await ipfsRegistry.getAddress());
      expect(marketplaceSkillSystem).to.equal(await skillSystem.getAddress());
    });

    it("Debería permitir actualizar karma desde múltiples contratos", async function () {
      // El professional ya tiene perfil y está verificado desde el beforeEach
      // Crear habilidad y validarla
      await skillSystem.connect(owner).createSkill("ipfs://QmSkillHash123456789");
      await skillSystem.connect(professional).declareSkill(0, "ipfs://QmDeclarationHash123456789", 4);
      // El validator ya tiene el rol KARMA_ROLE desde el beforeEach principal
      await skillSystem.connect(validator).validateSkill(professional.address, 0, 4);
      
      let profile = await profileRegistry.profiles(professional.address);
      expect(profile.karmaScore).to.be.gt(0);
      
      // Actualizar karma directamente desde ProfileRegistry
      await profileRegistry.connect(owner).updateKarmaScore(professional.address, 100);
      
      profile = await profileRegistry.profiles(professional.address);
      expect(profile.karmaScore).to.equal(100);
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
      // Crear un nuevo usuario
      const newUser = addrs[0];
      
      // Registrar perfil para el nuevo usuario
      const profileHash = "ipfs://QmXnnyufdzAWL5CqZ2RnSNgPbvCc1ALT73s6epPrRnZ1Xy";
      await ipfsRegistry.connect(owner).storeRecord(profileHash, "sha256hash1", "profiles", "profile");
      await profileRegistry.connect(newUser).registerProfile(profileHash, 0);
      
      // Otorgar rol VERIFIER_ROLE al nuevo usuario
      const verifierRole = await profileRegistry.VERIFIER_ROLE();
      await profileRegistry.connect(owner).grantRole(verifierRole, newUser.address);
      
      // Verificar que tiene el rol
      expect(await profileRegistry.hasRole(verifierRole, newUser.address)).to.be.true;
    });
  });

  describe("Interoperabilidad IPFS/API/Blockchain", function () {
    it("Debería permitir el flujo completo: subir a IPFS, registrar en blockchain y consultar vía API", async function () {
      // 1. Simular subida a IPFS (mock: generamos un hash)
      const ipfsProfileHash = "ipfs://QmInteroperabilidadTestHash";
      const sha256Profile = "sha256interoperabilidad";
      // 2. Registrar el hash en IPFSRegistry (simula lo que haría la API tras subir a IPFS)
      await ipfsRegistry.connect(owner).storeRecord(ipfsProfileHash, sha256Profile, "profiles", "profile");
      // 3. Registrar el perfil en ProfileRegistry usando el hash de IPFS
      await profileRegistry.connect(client).registerProfile(ipfsProfileHash, 0); // Individual
      expect(await profileRegistry.hasRegisteredProfile(client.address)).to.be.true;
      // 4. Simular consulta a la API (mock): la API devolvería el hash y los datos de IPFS
      // (En un test real, aquí se haría una petición HTTP a la API, pero aquí solo comprobamos que el hash está en IPFSRegistry)
      const record = await ipfsRegistry.getRecordByHash(ipfsProfileHash);
      expect(record.ipfsHash).to.equal(ipfsProfileHash);
      expect(record.sha256Hash).to.equal(sha256Profile);
      // 5. Verificar que el dato es consistente entre IPFSRegistry y ProfileRegistry
      const profile = await profileRegistry.getProfile(client.address);
      expect(profile.profileDataHash).to.equal(ipfsProfileHash);
    });
  });
}); 