const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("P2PMarketplace Contract", function () {
  let KRMToken;
  let krmToken;
  let P2PMarketplace;
  let marketplace;
  let owner;
  let provider;
  let client;
  let addrs;

  beforeEach(async function () {
    // Obtener los signers de prueba
    [owner, provider, client, ...addrs] = await ethers.getSigners();

    // Desplegar el contrato KRMToken
    KRMToken = await ethers.getContractFactory("KRMToken");
    krmToken = await KRMToken.deploy(owner.address); // Treasury wallet
    await krmToken.waitForDeployment();

    // Desplegar el contrato P2PMarketplace
    P2PMarketplace = await ethers.getContractFactory("P2PMarketplace");
    marketplace = await P2PMarketplace.deploy(owner.address, await krmToken.getAddress());
    await marketplace.waitForDeployment();

    // Transferir tokens a los usuarios para las pruebas
    await krmToken.transfer(client.address, ethers.parseEther("1000"));
    await krmToken.transfer(provider.address, ethers.parseEther("500"));
  });

  describe("Creación de servicios", function () {
    it("Debería permitir crear un servicio", async function () {
      await marketplace.connect(provider).createService(
        "Desarrollo Web",
        "Desarrollo de aplicaciones web con React y Node.js",
        ethers.parseEther("50"), // 50 KRM por hora
        [1, 2, 3] // IDs de habilidades
      );

      const service = await marketplace.services(0);
      expect(service.provider).to.equal(provider.address);
      expect(service.title).to.equal("Desarrollo Web");
      expect(service.description).to.equal("Desarrollo de aplicaciones web con React y Node.js");
      expect(service.pricePerHour).to.equal(ethers.parseEther("50"));
      expect(service.status).to.equal(0); // Active
    });

    it("No debería permitir crear un servicio con precio cero", async function () {
      await expect(
        marketplace.connect(provider).createService(
          "Desarrollo Web",
          "Descripción",
          0,
          [1, 2]
        )
      ).to.be.revertedWith("Price must be greater than zero");
    });

    it("No debería permitir crear un servicio con título vacío", async function () {
      await expect(
        marketplace.connect(provider).createService(
          "",
          "Descripción",
          ethers.parseEther("50"),
          [1, 2]
        )
      ).to.be.revertedWith("Title cannot be empty");
    });

    it("Debería emitir un evento al crear un servicio", async function () {
      await expect(
        marketplace.connect(provider).createService(
          "Desarrollo Web",
          "Descripción",
          ethers.parseEther("50"),
          [1, 2]
        )
      ).to.emit(marketplace, "ServiceCreated")
       .withArgs(0, provider.address);
    });
  });

  describe("Gestión de servicios", function () {
    beforeEach(async function () {
      await marketplace.connect(provider).createService(
        "Desarrollo Web",
        "Descripción",
        ethers.parseEther("50"),
        [1, 2]
      );
    });

    it("Debería permitir al proveedor actualizar su servicio", async function () {
      await marketplace.connect(provider).updateService(
        0,
        "Desarrollo Web Avanzado",
        "Nueva descripción",
        ethers.parseEther("75"),
        [1, 2, 3]
      );

      const service = await marketplace.services(0);
      expect(service.title).to.equal("Desarrollo Web Avanzado");
      expect(service.description).to.equal("Nueva descripción");
      expect(service.pricePerHour).to.equal(ethers.parseEther("75"));
    });

    it("No debería permitir a otros usuarios actualizar el servicio", async function () {
      await expect(
        marketplace.connect(client).updateService(
          0,
          "Título",
          "Descripción",
          ethers.parseEther("100"),
          [1]
        )
      ).to.be.revertedWith("Not service provider");
    });

    it("Debería mantener el servicio activo por defecto", async function () {
      const service = await marketplace.services(0);
      expect(service.status).to.equal(0); // Active
    });

    it("Debería permitir consultar información del servicio", async function () {
      const service = await marketplace.services(0);
      expect(service.provider).to.equal(provider.address);
      expect(service.title).to.equal("Desarrollo Web");
      expect(service.status).to.equal(0); // Active
    });
  });

  describe("Creación de órdenes", function () {
    beforeEach(async function () {
      await marketplace.connect(provider).createService(
        "Desarrollo Web",
        "Descripción",
        ethers.parseEther("50"),
        [1, 2]
      );
      
      // Aprobar tokens para el marketplace
      await krmToken.connect(client).approve(await marketplace.getAddress(), ethers.parseEther("500"));
    });

    it("Debería permitir crear una orden", async function () {
      await marketplace.connect(client).createOrder(
        0, // serviceId
        5, // 5 horas
        "Necesito una página web para mi negocio"
      );

      const order = await marketplace.orders(0);
      expect(order.serviceId).to.equal(0);
      expect(order.client).to.equal(client.address);
      expect(order.provider).to.equal(provider.address);
      expect(order.numHours).to.equal(5);
      expect(order.totalPrice).to.equal(ethers.parseEther("250")); // 50 * 5
      expect(order.status).to.equal(0); // Created
    });

    it("No debería permitir crear una orden con 0 horas", async function () {
      await expect(
        marketplace.connect(client).createOrder(0, 0, "Detalles")
      ).to.be.revertedWith("Hours must be greater than zero");
    });

    it("Debería emitir un evento al crear una orden", async function () {
      await expect(
        marketplace.connect(client).createOrder(0, 5, "Detalles")
      ).to.emit(marketplace, "OrderCreated")
       .withArgs(0, 0, client.address);
    });
  });

  describe("Gestión de órdenes", function () {
    beforeEach(async function () {
      await marketplace.connect(provider).createService(
        "Desarrollo Web",
        "Descripción",
        ethers.parseEther("50"),
        [1, 2]
      );
      
      await krmToken.connect(client).approve(await marketplace.getAddress(), ethers.parseEther("500"));
      
      await marketplace.connect(client).createOrder(0, 5, "Detalles");
    });

    it("Debería permitir al proveedor aceptar una orden", async function () {
      await marketplace.connect(provider).acceptOrder(0);

      const order = await marketplace.orders(0);
      expect(order.status).to.equal(1); // Accepted
    });

    it("No debería permitir a otros usuarios aceptar la orden", async function () {
      await expect(
        marketplace.connect(client).acceptOrder(0)
      ).to.be.revertedWith("Not service provider");
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
      expect(order.status).to.equal(3); // Cancelled (ajustado al enum real)
    });

    it("Debería emitir eventos al gestionar órdenes", async function () {
      await expect(marketplace.connect(provider).acceptOrder(0))
        .to.emit(marketplace, "OrderAccepted")
        .withArgs(0);

      await expect(marketplace.connect(client).completeOrder(0))
        .to.emit(marketplace, "OrderCompleted")
        .withArgs(0);
    });
  });

  describe("Gestión de comisiones", function () {
    beforeEach(async function () {
      // Otorgar rol FEE_MANAGER_ROLE al owner
      const FEE_MANAGER_ROLE = await marketplace.FEE_MANAGER_ROLE();
      await marketplace.grantRole(FEE_MANAGER_ROLE, owner.address);
    });

    it("Debería permitir al fee manager actualizar la comisión", async function () {
      await marketplace.updatePlatformFee(200); // 2%

      expect(await marketplace.platformFee()).to.equal(200);
    });

    it("No debería permitir comisiones mayores al 10%", async function () {
      await expect(
        marketplace.updatePlatformFee(1001) // 10.01%
      ).to.be.revertedWith("Fee too high");
    });

    it("No debería permitir a usuarios no autorizados cambiar comisiones", async function () {
      await expect(
        marketplace.connect(client).updatePlatformFee(200)
      ).to.be.reverted;
    });

    it("Debería emitir un evento al actualizar la comisión", async function () {
      await expect(marketplace.updatePlatformFee(200))
        .to.emit(marketplace, "FeeUpdated")
        .withArgs(200);
    });
  });

  describe("Control de acceso", function () {
    it("Debería verificar que el owner tiene el rol DEFAULT_ADMIN_ROLE", async function () {
      const DEFAULT_ADMIN_ROLE = await marketplace.DEFAULT_ADMIN_ROLE();
      expect(await marketplace.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
    });

    it("Debería verificar que el owner tiene el rol FEE_MANAGER_ROLE", async function () {
      const FEE_MANAGER_ROLE = await marketplace.FEE_MANAGER_ROLE();
      expect(await marketplace.hasRole(FEE_MANAGER_ROLE, owner.address)).to.be.true;
    });

    it("Debería permitir otorgar roles a otros usuarios", async function () {
      const ADMIN_ROLE = await marketplace.ADMIN_ROLE();
      await marketplace.grantRole(ADMIN_ROLE, provider.address);
      
      expect(await marketplace.hasRole(ADMIN_ROLE, provider.address)).to.be.true;
    });
  });

  describe("Pausabilidad", function () {
    beforeEach(async function () {
      // Otorgar rol ADMIN_ROLE al owner para pausar
      const ADMIN_ROLE = await marketplace.ADMIN_ROLE();
      await marketplace.grantRole(ADMIN_ROLE, owner.address);
    });

    it("Debería permitir al admin pausar el contrato", async function () {
      await marketplace.pause();
      expect(await marketplace.paused()).to.be.true;
    });

    it("No debería permitir crear servicios cuando está pausado", async function () {
      await marketplace.pause();
      
      await expect(
        marketplace.connect(provider).createService(
          "Servicio",
          "Descripción",
          ethers.parseEther("50"),
          [1]
        )
      ).to.be.revertedWith("Pausable: paused");
    });

    it("Debería permitir al admin despausar el contrato", async function () {
      await marketplace.pause();
      await marketplace.unpause();
      expect(await marketplace.paused()).to.be.false;
    });
  });

  describe("Consulta de datos", function () {
    beforeEach(async function () {
      await marketplace.connect(provider).createService(
        "Desarrollo Web",
        "Descripción",
        ethers.parseEther("50"),
        [1, 2]
      );
      
      await krmToken.connect(client).approve(await marketplace.getAddress(), ethers.parseEther("500"));
      await marketplace.connect(client).createOrder(0, 5, "Detalles");
    });

    it("Debería obtener información de servicios", async function () {
      const service = await marketplace.services(0);
      expect(service.provider).to.equal(provider.address);
      expect(service.title).to.equal("Desarrollo Web");
      expect(service.status).to.equal(0); // Active
    });

    it("Debería obtener información de órdenes", async function () {
      const order = await marketplace.orders(0);
      expect(order.client).to.equal(client.address);
      expect(order.provider).to.equal(provider.address);
      expect(order.status).to.equal(0); // Created
    });

    it("Debería verificar configuración del marketplace", async function () {
      expect(await marketplace.platformFee()).to.equal(100); // 1%
      expect(await marketplace.feeCollector()).to.equal(owner.address);
      expect(await marketplace.krmTokenAddress()).to.equal(await krmToken.getAddress());
    });
  });

  describe("Estados de órdenes", function () {
    beforeEach(async function () {
      await marketplace.connect(provider).createService(
        "Desarrollo Web",
        "Descripción",
        ethers.parseEther("50"),
        [1, 2]
      );
      
      await krmToken.connect(client).approve(await marketplace.getAddress(), ethers.parseEther("500"));
      await marketplace.connect(client).createOrder(0, 5, "Detalles");
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

