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
    krmToken = await KRMToken.deploy();
    await krmToken.deployed();

    // Desplegar el contrato P2PMarketplace
    P2PMarketplace = await ethers.getContractFactory("P2PMarketplace");
    marketplace = await P2PMarketplace.deploy(owner.address, krmToken.address);
    await marketplace.deployed();

    // Transferir tokens a los usuarios para las pruebas
    await krmToken.transfer(client.address, ethers.utils.parseEther("1000"));
    await krmToken.transfer(provider.address, ethers.utils.parseEther("500"));

    // Aprobar al marketplace para gastar tokens
    await krmToken.connect(client).approve(marketplace.address, ethers.utils.parseEther("1000"));
    await krmToken.connect(provider).approve(marketplace.address, ethers.utils.parseEther("500"));
  });

  describe("Creación de servicios", function () {
    it("Debería permitir crear un servicio", async function () {
      await marketplace.connect(provider).createService(
        "Desarrollo Web",
        "Desarrollo de sitios web con React",
        ethers.utils.parseEther("50"),
        ["React", "JavaScript", "CSS"]
      );

      const service = await marketplace.getService(1);
      expect(service.title).to.equal("Desarrollo Web");
      expect(service.description).to.equal("Desarrollo de sitios web con React");
      expect(service.pricePerHour).to.equal(ethers.utils.parseEther("50"));
      expect(service.provider).to.equal(provider.address);
      expect(service.isActive).to.equal(true);
      expect(service.skills[0]).to.equal("React");
      expect(service.skills[1]).to.equal("JavaScript");
      expect(service.skills[2]).to.equal("CSS");
    });

    it("Debería incrementar el contador de servicios", async function () {
      await marketplace.connect(provider).createService(
        "Desarrollo Web",
        "Desarrollo de sitios web con React",
        ethers.utils.parseEther("50"),
        ["React", "JavaScript", "CSS"]
      );

      expect(await marketplace.serviceCount()).to.equal(1);

      await marketplace.connect(provider).createService(
        "Diseño UI/UX",
        "Diseño de interfaces de usuario",
        ethers.utils.parseEther("60"),
        ["Figma", "UI/UX", "Design"]
      );

      expect(await marketplace.serviceCount()).to.equal(2);
    });

    it("No debería permitir crear un servicio con precio cero", async function () {
      await expect(
        marketplace.connect(provider).createService(
          "Desarrollo Web",
          "Desarrollo de sitios web con React",
          0,
          ["React", "JavaScript", "CSS"]
        )
      ).to.be.revertedWith("Price must be greater than zero");
    });

    it("Debería emitir un evento al crear un servicio", async function () {
      await expect(
        marketplace.connect(provider).createService(
          "Desarrollo Web",
          "Desarrollo de sitios web con React",
          ethers.utils.parseEther("50"),
          ["React", "JavaScript", "CSS"]
        )
      )
        .to.emit(marketplace, "ServiceCreated")
        .withArgs(1, provider.address, "Desarrollo Web");
    });
  });

  describe("Actualización de servicios", function () {
    beforeEach(async function () {
      // Crear un servicio para las pruebas
      await marketplace.connect(provider).createService(
        "Desarrollo Web",
        "Desarrollo de sitios web con React",
        ethers.utils.parseEther("50"),
        ["React", "JavaScript", "CSS"]
      );
    });

    it("Debería permitir actualizar un servicio", async function () {
      await marketplace.connect(provider).updateService(
        1,
        "Desarrollo Web Full Stack",
        "Desarrollo de sitios web con React y Node.js",
        ethers.utils.parseEther("60"),
        ["React", "JavaScript", "Node.js", "Express"]
      );

      const service = await marketplace.getService(1);
      expect(service.title).to.equal("Desarrollo Web Full Stack");
      expect(service.description).to.equal("Desarrollo de sitios web con React y Node.js");
      expect(service.pricePerHour).to.equal(ethers.utils.parseEther("60"));
      expect(service.skills[0]).to.equal("React");
      expect(service.skills[2]).to.equal("Node.js");
    });

    it("No debería permitir actualizar un servicio inexistente", async function () {
      await expect(
        marketplace.connect(provider).updateService(
          2,
          "Desarrollo Web Full Stack",
          "Desarrollo de sitios web con React y Node.js",
          ethers.utils.parseEther("60"),
          ["React", "JavaScript", "Node.js", "Express"]
        )
      ).to.be.revertedWith("Service does not exist");
    });

    it("No debería permitir actualizar un servicio de otro proveedor", async function () {
      await expect(
        marketplace.connect(client).updateService(
          1,
          "Desarrollo Web Full Stack",
          "Desarrollo de sitios web con React y Node.js",
          ethers.utils.parseEther("60"),
          ["React", "JavaScript", "Node.js", "Express"]
        )
      ).to.be.revertedWith("Only the provider can update the service");
    });

    it("Debería emitir un evento al actualizar un servicio", async function () {
      await expect(
        marketplace.connect(provider).updateService(
          1,
          "Desarrollo Web Full Stack",
          "Desarrollo de sitios web con React y Node.js",
          ethers.utils.parseEther("60"),
          ["React", "JavaScript", "Node.js", "Express"]
        )
      )
        .to.emit(marketplace, "ServiceUpdated")
        .withArgs(1, provider.address, "Desarrollo Web Full Stack");
    });
  });

  describe("Desactivación de servicios", function () {
    beforeEach(async function () {
      // Crear un servicio para las pruebas
      await marketplace.connect(provider).createService(
        "Desarrollo Web",
        "Desarrollo de sitios web con React",
        ethers.utils.parseEther("50"),
        ["React", "JavaScript", "CSS"]
      );
    });

    it("Debería permitir desactivar un servicio", async function () {
      await marketplace.connect(provider).toggleServiceStatus(1);

      const service = await marketplace.getService(1);
      expect(service.isActive).to.equal(false);
    });

    it("Debería permitir reactivar un servicio desactivado", async function () {
      await marketplace.connect(provider).toggleServiceStatus(1);
      await marketplace.connect(provider).toggleServiceStatus(1);

      const service = await marketplace.getService(1);
      expect(service.isActive).to.equal(true);
    });

    it("No debería permitir desactivar un servicio inexistente", async function () {
      await expect(
        marketplace.connect(provider).toggleServiceStatus(2)
      ).to.be.revertedWith("Service does not exist");
    });

    it("No debería permitir desactivar un servicio de otro proveedor", async function () {
      await expect(
        marketplace.connect(client).toggleServiceStatus(1)
      ).to.be.revertedWith("Only the provider can toggle service status");
    });

    it("Debería emitir un evento al cambiar el estado de un servicio", async function () {
      await expect(
        marketplace.connect(provider).toggleServiceStatus(1)
      )
        .to.emit(marketplace, "ServiceStatusChanged")
        .withArgs(1, provider.address, false);
    });
  });

  describe("Contratación de servicios", function () {
    beforeEach(async function () {
      // Crear un servicio para las pruebas
      await marketplace.connect(provider).createService(
        "Desarrollo Web",
        "Desarrollo de sitios web con React",
        ethers.utils.parseEther("50"),
        ["React", "JavaScript", "CSS"]
      );
    });

    it("Debería permitir contratar un servicio", async function () {
      await marketplace.connect(client).hireService(1, 10, "Desarrollo de tienda online");

      const contract = await marketplace.getContract(1);
      expect(contract.serviceId).to.equal(1);
      expect(contract.client).to.equal(client.address);
      expect(contract.provider).to.equal(provider.address);
      expect(contract.hours).to.equal(10);
      expect(contract.totalPrice).to.equal(ethers.utils.parseEther("500")); // 50 * 10
      expect(contract.description).to.equal("Desarrollo de tienda online");
      expect(contract.status).to.equal(1); // PENDING
    });

    it("No debería permitir contratar un servicio inexistente", async function () {
      await expect(
        marketplace.connect(client).hireService(2, 10, "Desarrollo de tienda online")
      ).to.be.revertedWith("Service does not exist");
    });

    it("No debería permitir contratar un servicio inactivo", async function () {
      await marketplace.connect(provider).toggleServiceStatus(1);

      await expect(
        marketplace.connect(client).hireService(1, 10, "Desarrollo de tienda online")
      ).to.be.revertedWith("Service is not active");
    });

    it("No debería permitir contratar un servicio con horas <= 0", async function () {
      await expect(
        marketplace.connect(client).hireService(1, 0, "Desarrollo de tienda online")
      ).to.be.revertedWith("Hours must be greater than zero");
    });

    it("No debería permitir contratar un servicio sin fondos suficientes", async function () {
      // Crear un cliente sin fondos suficientes
      await expect(
        marketplace.connect(addrs[0]).hireService(1, 10, "Desarrollo de tienda online")
      ).to.be.revertedWith("ERC20: insufficient allowance");
    });

    it("Debería transferir los tokens al contrato al contratar un servicio", async function () {
      const initialBalance = await krmToken.balanceOf(client.address);
      
      await marketplace.connect(client).hireService(1, 10, "Desarrollo de tienda online");
      
      const finalBalance = await krmToken.balanceOf(client.address);
      expect(initialBalance.sub(finalBalance)).to.equal(ethers.utils.parseEther("500"));
      
      const contractBalance = await krmToken.balanceOf(marketplace.address);
      expect(contractBalance).to.equal(ethers.utils.parseEther("500"));
    });

    it("Debería emitir un evento al contratar un servicio", async function () {
      await expect(
        marketplace.connect(client).hireService(1, 10, "Desarrollo de tienda online")
      )
        .to.emit(marketplace, "ContractCreated")
        .withArgs(1, 1, client.address, provider.address);
    });
  });

  describe("Gestión de contratos", function () {
    beforeEach(async function () {
      // Crear un servicio para las pruebas
      await marketplace.connect(provider).createService(
        "Desarrollo Web",
        "Desarrollo de sitios web con React",
        ethers.utils.parseEther("50"),
        ["React", "JavaScript", "CSS"]
      );
      
      // Contratar el servicio
      await marketplace.connect(client).hireService(1, 10, "Desarrollo de tienda online");
    });

    it("Debería permitir al proveedor aceptar un contrato", async function () {
      await marketplace.connect(provider).acceptContract(1);
      
      const contract = await marketplace.getContract(1);
      expect(contract.status).to.equal(2); // ACCEPTED
    });

    it("No debería permitir aceptar un contrato a alguien que no sea el proveedor", async function () {
      await expect(
        marketplace.connect(client).acceptContract(1)
      ).to.be.revertedWith("Only the provider can accept the contract");
    });

    it("No debería permitir aceptar un contrato que no está pendiente", async function () {
      await marketplace.connect(provider).acceptContract(1);
      
      await expect(
        marketplace.connect(provider).acceptContract(1)
      ).to.be.revertedWith("Contract is not in PENDING status");
    });

    it("Debería permitir al proveedor rechazar un contrato", async function () {
      await marketplace.connect(provider).rejectContract(1);
      
      const contract = await marketplace.getContract(1);
      expect(contract.status).to.equal(5); // REJECTED
    });

    it("Debería devolver los tokens al cliente cuando se rechaza un contrato", async function () {
      const initialBalance = await krmToken.balanceOf(client.address);
      
      await marketplace.connect(provider).rejectContract(1);
      
      const finalBalance = await krmToken.balanceOf(client.address);
      expect(finalBalance.sub(initialBalance)).to.equal(ethers.utils.parseEther("500"));
    });

    it("Debería permitir al proveedor completar un contrato aceptado", async function () {
      await marketplace.connect(provider).acceptContract(1);
      await marketplace.connect(provider).completeContract(1);
      
      const contract = await marketplace.getContract(1);
      expect(contract.status).to.equal(3); // COMPLETED
    });

    it("Debería permitir al cliente confirmar un contrato completado", async function () {
      await marketplace.connect(provider).acceptContract(1);
      await marketplace.connect(provider).completeContract(1);
      await marketplace.connect(client).confirmContract(1);
      
      const contract = await marketplace.getContract(1);
      expect(contract.status).to.equal(4); // CONFIRMED
    });

    it("Debería transferir los tokens al proveedor cuando se confirma un contrato", async function () {
      const initialBalance = await krmToken.balanceOf(provider.address);
      
      await marketplace.connect(provider).acceptContract(1);
      await marketplace.connect(provider).completeContract(1);
      await marketplace.connect(client).confirmContract(1);
      
      const finalBalance = await krmToken.balanceOf(provider.address);
      expect(finalBalance.sub(initialBalance)).to.equal(ethers.utils.parseEther("500"));
    });

    it("Debería emitir eventos apropiados en cada cambio de estado del contrato", async function () {
      await expect(
        marketplace.connect(provider).acceptContract(1)
      )
        .to.emit(marketplace, "ContractStatusChanged")
        .withArgs(1, 2); // ACCEPTED
      
      await expect(
        marketplace.connect(provider).completeContract(1)
      )
        .to.emit(marketplace, "ContractStatusChanged")
        .withArgs(1, 3); // COMPLETED
      
      await expect(
        marketplace.connect(client).confirmContract(1)
      )
        .to.emit(marketplace, "ContractStatusChanged")
        .withArgs(1, 4); // CONFIRMED
    });
  });

  describe("Consulta de servicios y contratos", function () {
    beforeEach(async function () {
      // Crear varios servicios para las pruebas
      await marketplace.connect(provider).createService(
        "Desarrollo Web",
        "Desarrollo de sitios web con React",
        ethers.utils.parseEther("50"),
        ["React", "JavaScript", "CSS"]
      );
      
      await marketplace.connect(provider).createService(
        "Diseño UI/UX",
        "Diseño de interfaces de usuario",
        ethers.utils.parseEther("60"),
        ["Figma", "UI/UX", "Design"]
      );
      
      await marketplace.connect(addrs[0]).createService(
        "Marketing Digital",
        "Estrategias de marketing en redes sociales",
        ethers.utils.parseEther("40"),
        ["Marketing", "Social Media"]
      );
      
      // Contratar servicios
      await marketplace.connect(client).hireService(1, 10, "Desarrollo de tienda online");
      await marketplace.connect(client).hireService(2, 5, "Diseño de landing page");
    });

    it("Debería obtener los servicios de un proveedor", async function () {
      const services = await marketplace.getServicesByProvider(provider.address);
      expect(services.length).to.equal(2);
      expect(services[0]).to.equal(1);
      expect(services[1]).to.equal(2);
    });

    it("Debería obtener los contratos de un cliente", async function () {
      const contracts = await marketplace.getContractsByClient(client.address);
      expect(contracts.length).to.equal(2);
      expect(contracts[0]).to.equal(1);
      expect(contracts[1]).to.equal(2);
    });

    it("Debería obtener los contratos de un proveedor", async function () {
      const contracts = await marketplace.getContractsByProvider(provider.address);
      expect(contracts.length).to.equal(2);
      expect(contracts[0]).to.equal(1);
      expect(contracts[1]).to.equal(2);
    });

    it("Debería obtener los servicios por habilidad", async function () {
      const services = await marketplace.getServicesBySkill("React");
      expect(services.length).to.equal(1);
      expect(services[0]).to.equal(1);
      
      const designServices = await marketplace.getServicesBySkill("Design");
      expect(designServices.length).to.equal(1);
      expect(designServices[0]).to.equal(2);
    });

    it("Debería obtener los servicios activos", async function () {
      // Desactivar un servicio
      await marketplace.connect(provider).toggleServiceStatus(1);
      
      const activeServices = await marketplace.getActiveServices();
      expect(activeServices.length).to.equal(2);
      expect(activeServices[0]).to.equal(2);
      expect(activeServices[1]).to.equal(3);
    });
  });
});
