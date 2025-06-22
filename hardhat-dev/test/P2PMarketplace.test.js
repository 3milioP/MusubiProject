const { expect } = require("chai");
const { ethers } = require("hardhat");

// Función helper para verificar y declarar habilidades
async function ensureSkillDeclared(skillSystem, professional, validator, skillId, level) {
  try {
    // Verificar si la habilidad ya está declarada
    const declaredSkillBefore = await skillSystem.getDeclaredSkill(professional.address, skillId);
    console.log('Antes:', professional.address, skillId, declaredSkillBefore);
    if (declaredSkillBefore.skillId == 0) {
      // Solo declarar si no existe
      await skillSystem.connect(professional).declareSkill(skillId, level);
      await skillSystem.connect(validator).validateSkill(professional.address, skillId, true);
    }
    const declaredSkillAfter = await skillSystem.getDeclaredSkill(professional.address, skillId);
    console.log('Después:', professional.address, skillId, declaredSkillAfter);
  } catch (error) {
    console.log('Error en ensureSkillDeclared:', error);
    // Si hay error, declarar la habilidad
    await skillSystem.connect(professional).declareSkill(skillId, level);
    await skillSystem.connect(validator).validateSkill(professional.address, skillId, true);
  }
}

describe("P2PMarketplace Contract", function () {
  let KRMToken;
  let ProfileRegistry;
  let SkillSystem;
  let P2PMarketplace;
  let krmToken;
  let profileRegistry;
  let skillSystem;
  let marketplace;
  let owner;
  let provider;
  let client;
  let addrs;
  let feeManager;
  let validator;

  beforeEach(async function () {
    [owner, provider, validator, client, feeManager, ...addrs] = await ethers.getSigners();

    const ProfileRegistry = await ethers.getContractFactory("ProfileRegistry");
    profileRegistry = await ProfileRegistry.deploy();
    await profileRegistry.waitForDeployment();
    
    const SkillSystem = await ethers.getContractFactory("SkillSystem");
    skillSystem = await SkillSystem.deploy(profileRegistry.target);
    await skillSystem.waitForDeployment();
    
    const KRMToken = await ethers.getContractFactory("KRMToken");
    krmToken = await KRMToken.deploy(owner.address);
    await krmToken.waitForDeployment();
    
    const P2PMarketplace = await ethers.getContractFactory("P2PMarketplace");
    marketplace = await P2PMarketplace.deploy(owner.address, krmToken.target);
    await marketplace.waitForDeployment();
    
    // Configurar direcciones de contratos
    await marketplace.connect(owner).setContractAddresses(profileRegistry.target, skillSystem.target);
    
    // Registrar perfiles - IMPORTANTE: Cada uno con su propio perfil
    const metadataURI = "ipfs://QmXnnyufdzAWL5CqZ2RnSNgPbvCc1ALT73s6epPrRnZ1Xy";
    await profileRegistry.connect(provider).registerProfile("Juan Pérez", "Desarrollador", metadataURI, 0, true); // Professional
    await profileRegistry.connect(client).registerProfile("María García", "Cliente", metadataURI, 0, true); // Professional
    await profileRegistry.connect(validator).registerProfile("Validator", "Validador", metadataURI, 1, true); // Validator
    
    // Verificar perfiles - IMPORTANTE: Cada uno verifica a otros, no a sí mismo
    await profileRegistry.connect(owner).verifyProfile(provider.address);
    await profileRegistry.connect(owner).verifyProfile(client.address);
    await profileRegistry.connect(owner).verifyProfile(validator.address);
    
    // Otorgar rol de karma a todos los perfiles relevantes para que puedan validar
    const karmaRole = await profileRegistry.KARMA_ROLE();
    await profileRegistry.connect(owner).grantRole(karmaRole, provider.address);
    await profileRegistry.connect(owner).grantRole(karmaRole, client.address);
    await profileRegistry.connect(owner).grantRole(karmaRole, validator.address);
    
    // Otorgar rol de karma al contrato SkillSystem en ProfileRegistry para que pueda actualizar karma
    await profileRegistry.connect(owner).grantRole(karmaRole, await skillSystem.getAddress());
    
    // Otorgar rol de karma al validator en SkillSystem también
    const skillSystemKarmaRole = await skillSystem.KARMA_ROLE();
    await skillSystem.connect(owner).grantRole(skillSystemKarmaRole, validator.address);
    await skillSystem.connect(owner).grantRole(skillSystemKarmaRole, provider.address);
    await skillSystem.connect(owner).grantRole(skillSystemKarmaRole, client.address);
    
    // Crear y declarar habilidades para el provider (solo aquí)
    await skillSystem.connect(owner).createSkill("JavaScript", "Programming");
    await skillSystem.connect(provider).declareSkill(0, 4);
    await skillSystem.connect(validator).validateSkill(provider.address, 0, true); // Validator valida al provider
    
    // Otorgar rol FEE_MANAGER_ROLE al feeManager
    const feeManagerRole = await marketplace.FEE_MANAGER_ROLE();
    await marketplace.connect(owner).grantRole(feeManagerRole, feeManager.address);
    
    // Transferir KRM al cliente para que pueda crear órdenes
    await krmToken.connect(owner).transfer(client.address, ethers.parseEther("10000"));
    
    // Aprobar tokens KRM al contrato marketplace
    await krmToken.connect(client).approve(await marketplace.getAddress(), ethers.parseEther("10000"));
  });

  describe("Creación de servicios", function () {
    it("Debería permitir crear un servicio", async function () {
      // La habilidad ya está declarada y validada en el beforeEach
      await marketplace.connect(provider).createService(
        "Desarrollo Web",
        "Desarrollo de aplicaciones web con React",
        100, // 100 KRM por hora
        [0] // skillId
      );
      
      const service = await marketplace.services(0);
      expect(service.title).to.equal("Desarrollo Web");
      expect(service.description).to.equal("Desarrollo de aplicaciones web con React");
      expect(service.pricePerHour).to.equal(100);
      expect(service.provider).to.equal(provider.address);
    });

    it("No debería permitir crear un servicio con precio cero", async function () {
      await expect(
        marketplace.connect(provider).createService(
          "Desarrollo Web",
          "Desarrollo de aplicaciones web",
          0, // precio cero
          [0]
        )
      ).to.be.revertedWith("Price must be greater than zero");
    });

    it("No debería permitir crear un servicio con título vacío", async function () {
      await expect(
        marketplace.connect(provider).createService(
          "", // título vacío
          "Descripción",
          100,
          [0]
        )
      ).to.be.revertedWith("Title cannot be empty");
    });

    it("Debería emitir un evento al crear un servicio", async function () {
      // La habilidad ya está declarada y validada en el beforeEach
      await expect(
        marketplace.connect(provider).createService(
          "Desarrollo Web",
          "Desarrollo de aplicaciones web",
          100,
          [0]
        )
      )
        .to.emit(marketplace, "ServiceCreated")
        .withArgs(0, provider.address);
    });
  });

  describe("Gestión de servicios", function () {
    beforeEach(async function () {
      // La habilidad ya está declarada y validada en el beforeEach global
      await marketplace.connect(provider).createService(
        "Desarrollo Web",
        "Desarrollo de aplicaciones web",
        100,
        [0]
      );
    });

    it("Debería permitir al proveedor actualizar su servicio", async function () {
      await marketplace.connect(provider).updateService(
        0, // serviceId
        "Desarrollo Web Actualizado",
        "Nueva descripción",
        150, // nuevo precio
        [0]
      );
      
      const service = await marketplace.services(0);
      expect(service.title).to.equal("Desarrollo Web Actualizado");
      expect(service.pricePerHour).to.equal(150);
    });

    it("No debería permitir a otros usuarios actualizar el servicio", async function () {
      await expect(
        marketplace.connect(client).updateService(
          0,
          "Título modificado",
          "Descripción",
          100,
          [0]
        )
      ).to.be.revertedWith("Not service provider");
    });

    it("Debería mantener el servicio activo por defecto", async function () {
      const service = await marketplace.services(0);
      expect(service.status).to.equal(0); // Active
    });

    it("Debería permitir consultar información del servicio", async function () {
      const service = await marketplace.services(0);
      expect(service.title).to.equal("Desarrollo Web");
      expect(service.provider).to.equal(provider.address);
      expect(service.pricePerHour).to.equal(100);
    });
  });

  describe("Creación de órdenes", function () {
    beforeEach(async function () {
      // La habilidad ya está declarada y validada en el beforeEach global
      await marketplace.connect(provider).createService(
        "Desarrollo Web",
        "Desarrollo de aplicaciones web",
        100,
        [0]
      );
    });

    it("Debería permitir crear una orden", async function () {
      await marketplace.connect(client).createOrder(0, 5, "Proyecto de e-commerce");
      
      const order = await marketplace.orders(0);
      expect(order.serviceId).to.equal(0);
      expect(order.client).to.equal(client.address);
      expect(order.provider).to.equal(provider.address);
      expect(order.numHours).to.equal(5);
      expect(order.totalPrice).to.equal(500); // 5 horas * 100 KRM
    });

    it("No debería permitir crear una orden con 0 horas", async function () {
      await expect(
        marketplace.connect(client).createOrder(0, 0, "Proyecto")
      ).to.be.revertedWith("Hours must be greater than zero");
    });

    it("Debería emitir un evento al crear una orden", async function () {
      await expect(
        marketplace.connect(client).createOrder(0, 5, "Proyecto")
      )
        .to.emit(marketplace, "OrderCreated")
        .withArgs(0, 0, client.address);
    });
  });

  describe("Gestión de órdenes", function () {
    beforeEach(async function () {
      // La habilidad ya está declarada y validada en el beforeEach global
      await marketplace.connect(provider).createService(
        "Desarrollo Web",
        "Desarrollo de aplicaciones web",
        100,
        [0]
      );
      await marketplace.connect(client).createOrder(0, 5, "Proyecto");
    });

    it("Debería permitir al proveedor aceptar una orden", async function () {
      await marketplace.connect(provider).acceptOrder(0);
      
      const order = await marketplace.orders(0);
      expect(order.status).to.equal(1); // Accepted
    });

    it("No debería permitir a otros usuarios aceptar la orden", async function () {
      await expect(
        marketplace.connect(client).acceptOrder(0)
      ).to.be.revertedWith("Not order provider");
    });

    it("Debería permitir al cliente completar una orden aceptada", async function () {
      await marketplace.connect(provider).acceptOrder(0);
      await marketplace.connect(client).completeOrder(0);
      
      const order = await marketplace.orders(0);
      expect(order.status).to.equal(2); // Completed
    });

    it("Debería permitir al cliente cancelar una orden no aceptada", async function () {
      await marketplace.connect(client).cancelOrder(0);
      
      const order = await marketplace.orders(0);
      expect(order.status).to.equal(3); // Cancelled
    });

    it("Debería emitir eventos al gestionar órdenes", async function () {
      await expect(marketplace.connect(provider).acceptOrder(0))
        .to.emit(marketplace, "OrderAccepted")
        .withArgs(0);
    });

    it("No debería permitir crear servicios cuando está pausado", async function () {
      await marketplace.connect(owner).pause();
      
      // La habilidad ya está declarada y validada en el beforeEach global
      await expect(
        marketplace.connect(provider).createService(
          "Servicio",
          "Descripción",
          100,
          [0]
        )
      ).to.be.revertedWith("Pausable: paused");
    });
  });

  describe("Gestión de comisiones", function () {
    it("Debería permitir al fee manager actualizar la comisión", async function () {
      await marketplace.connect(owner).updatePlatformFee(200); // 2%
      
      expect(await marketplace.platformFee()).to.equal(200);
    });

    it("No debería permitir comisiones mayores al 10%", async function () {
      await expect(
        marketplace.connect(owner).updatePlatformFee(1100) // 11%
      ).to.be.revertedWith("Fee too high");
    });

    it("No debería permitir a usuarios no autorizados cambiar comisiones", async function () {
      await expect(
        marketplace.connect(client).updatePlatformFee(200)
      ).to.be.reverted;
    });

    it("Debería emitir un evento al actualizar la comisión", async function () {
      await expect(marketplace.connect(owner).updatePlatformFee(200))
        .to.emit(marketplace, "FeeUpdated")
        .withArgs(200);
    });
  });

  describe("Control de acceso", function () {
    it("Debería verificar que el owner tiene el rol DEFAULT_ADMIN_ROLE", async function () {
      const adminRole = await marketplace.DEFAULT_ADMIN_ROLE();
      expect(await marketplace.hasRole(adminRole, owner.address)).to.be.true;
    });

    it("Debería verificar que el owner tiene el rol FEE_MANAGER_ROLE", async function () {
      const feeManagerRole = await marketplace.FEE_MANAGER_ROLE();
      expect(await marketplace.hasRole(feeManagerRole, owner.address)).to.be.true;
    });

    it("Debería permitir otorgar roles a otros usuarios", async function () {
      const feeManagerRole = await marketplace.FEE_MANAGER_ROLE();
      await marketplace.connect(owner).grantRole(feeManagerRole, provider.address);
      expect(await marketplace.hasRole(feeManagerRole, provider.address)).to.be.true;
    });
  });

  describe("Pausabilidad", function () {
    it("Debería permitir al admin pausar el contrato", async function () {
      await marketplace.connect(owner).pause();
      expect(await marketplace.paused()).to.be.true;
    });

    it("Debería permitir al admin despausar el contrato", async function () {
      await marketplace.connect(owner).pause();
      await marketplace.connect(owner).unpause();
      expect(await marketplace.paused()).to.be.false;
    });
  });

  describe("Consulta de datos", function () {
    beforeEach(async function () {
      // La habilidad ya está declarada y validada en el beforeEach global
      await marketplace.connect(provider).createService(
        "Desarrollo Web",
        "Desarrollo de aplicaciones web",
        100,
        [0]
      );
      await marketplace.connect(client).createOrder(0, 5, "Proyecto");
    });

    it("Debería obtener información de servicios", async function () {
      const service = await marketplace.services(0);
      expect(service.title).to.equal("Desarrollo Web");
      expect(service.provider).to.equal(provider.address);
    });

    it("Debería obtener información de órdenes", async function () {
      const order = await marketplace.orders(0);
      expect(order.serviceId).to.equal(0);
      expect(order.client).to.equal(client.address);
    });

    it("Debería verificar configuración del marketplace", async function () {
      expect(await marketplace.platformFee()).to.equal(100); // 1%
      expect(await marketplace.feeCollector()).to.equal(owner.address);
    });
  });

  describe("Estados de órdenes", function () {
    beforeEach(async function () {
      // La habilidad ya está declarada y validada en el beforeEach global
      await marketplace.connect(provider).createService(
        "Desarrollo Web",
        "Desarrollo de aplicaciones web",
        100,
        [0]
      );
      await marketplace.connect(client).createOrder(0, 5, "Proyecto");
    });

    it("Debería crear órdenes en estado Created por defecto", async function () {
      const order = await marketplace.orders(0);
      expect(order.status).to.equal(0); // Created
    });

    it("Debería cambiar estado a Accepted después de aceptación", async function () {
      await marketplace.connect(provider).acceptOrder(0);
      
      const order = await marketplace.orders(0);
      expect(order.status).to.equal(1); // Accepted
    });

    it("Debería cambiar estado a Completed después de completar", async function () {
      await marketplace.connect(provider).acceptOrder(0);
      await marketplace.connect(client).completeOrder(0);
      
      const order = await marketplace.orders(0);
      expect(order.status).to.equal(2); // Completed
    });
  });
});

