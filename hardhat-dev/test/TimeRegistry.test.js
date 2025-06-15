const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TimeRegistry Contract", function () {
  let TimeRegistry;
  let timeRegistry;
  let owner;
  let professional;
  let company;
  let addrs;

  beforeEach(async function () {
    // Obtener los signers de prueba
    [owner, professional, company, ...addrs] = await ethers.getSigners();

    // Desplegar el contrato TimeRegistry
    TimeRegistry = await ethers.getContractFactory("TimeRegistry");
    timeRegistry = await TimeRegistry.deploy();
    await timeRegistry.waitForDeployment();
    
    // Otorgar rol ADMIN_ROLE al owner para pausar
    const ADMIN_ROLE = await timeRegistry.ADMIN_ROLE();
    await timeRegistry.grantRole(ADMIN_ROLE, owner.address);
  });

  describe("Registro de tiempo", function () {
    it("Debería permitir a un profesional registrar tiempo", async function () {
      const startTime = Math.floor(Date.now() / 1000);
      const endTime = startTime + 3600; // 1 hora después
      
      await timeRegistry.connect(professional).registerTime(
        company.address,
        startTime,
        endTime,
        "Desarrollo de frontend",
        [1, 2] // IDs de habilidades
      );
      
      const record = await timeRegistry.timeRecords(0);
      expect(record.employee).to.equal(professional.address);
      expect(record.company).to.equal(company.address);
      expect(record.startTime).to.equal(startTime);
      expect(record.endTime).to.equal(endTime);
      expect(record.description).to.equal("Desarrollo de frontend");
      expect(record.status).to.equal(0); // Pending
    });

    it("No debería permitir registrar tiempo con fechas inválidas", async function () {
      const startTime = Math.floor(Date.now() / 1000);
      const endTime = startTime - 3600; // 1 hora antes (inválido)
      
      await expect(
        timeRegistry.connect(professional).registerTime(
          company.address,
          startTime,
          endTime,
          "Desarrollo de frontend",
          [1, 2]
        )
      ).to.be.revertedWith("Invalid time range");
    });

    it("No debería permitir registrar tiempo con startTime cero", async function () {
      const endTime = Math.floor(Date.now() / 1000) + 3600;
      
      await expect(
        timeRegistry.connect(professional).registerTime(
          company.address,
          0,
          endTime,
          "Desarrollo de frontend",
          [1, 2]
        )
      ).to.be.revertedWith("Invalid start time");
    });

    it("Debería emitir un evento al registrar tiempo", async function () {
      const startTime = Math.floor(Date.now() / 1000);
      const endTime = startTime + 3600;
      
      await expect(
        timeRegistry.connect(professional).registerTime(
          company.address,
          startTime,
          endTime,
          "Desarrollo de frontend",
          [1, 2]
        )
      ).to.emit(timeRegistry, "TimeRecordCreated")
       .withArgs(0, professional.address, company.address);
    });
  });

  describe("Validación de tiempo", function () {
    beforeEach(async function () {
      const startTime = Math.floor(Date.now() / 1000);
      const endTime = startTime + 3600;
      
      await timeRegistry.connect(professional).registerTime(
        company.address,
        startTime,
        endTime,
        "Desarrollo de frontend",
        [1, 2]
      );
    });

    it("Debería permitir a una empresa validar un registro de tiempo", async function () {
      await timeRegistry.connect(company).validateTimeRecord(0);
      
      const record = await timeRegistry.timeRecords(0);
      expect(record.status).to.equal(1); // Validated
    });

    it("No debería permitir a usuarios no autorizados validar registros", async function () {
      await expect(
        timeRegistry.connect(professional).validateTimeRecord(0)
      ).to.be.revertedWith("Not authorized");
    });

    it("Debería emitir un evento al validar un registro", async function () {
      await expect(timeRegistry.connect(company).validateTimeRecord(0))
        .to.emit(timeRegistry, "TimeRecordValidated")
        .withArgs(0, company.address);
    });

    it("No debería permitir validar un registro ya validado", async function () {
      await timeRegistry.connect(company).validateTimeRecord(0);
      
      await expect(
        timeRegistry.connect(company).validateTimeRecord(0)
      ).to.be.revertedWith("Not pending");
    });
  });

  describe("Disputa de registros", function () {
    beforeEach(async function () {
      const startTime = Math.floor(Date.now() / 1000);
      const endTime = startTime + 3600;
      
      await timeRegistry.connect(professional).registerTime(
        company.address,
        startTime,
        endTime,
        "Desarrollo de frontend",
        [1, 2]
      );
    });

    it("Debería permitir a una empresa disputar un registro", async function () {
      await timeRegistry.connect(company).disputeTimeRecord(0);
      
      const record = await timeRegistry.timeRecords(0);
      expect(record.status).to.equal(2); // Disputed
    });

    it("Debería permitir a un empleado disputar un registro", async function () {
      await timeRegistry.connect(professional).disputeTimeRecord(0);
      
      const record = await timeRegistry.timeRecords(0);
      expect(record.status).to.equal(2); // Disputed
    });

    it("Debería emitir un evento al disputar un registro", async function () {
      await expect(timeRegistry.connect(company).disputeTimeRecord(0))
        .to.emit(timeRegistry, "TimeRecordDisputed")
        .withArgs(0, company.address);
    });
  });

  describe("Consulta de registros", function () {
    beforeEach(async function () {
      const startTime = Math.floor(Date.now() / 1000);
      const endTime = startTime + 3600;
      
      // Crear múltiples registros
      await timeRegistry.connect(professional).registerTime(
        company.address,
        startTime,
        endTime,
        "Desarrollo de frontend",
        [1, 2]
      );
      
      await timeRegistry.connect(professional).registerTime(
        company.address,
        startTime + 7200,
        endTime + 7200,
        "Testing",
        [3]
      );
    });

    it("Debería obtener información detallada de un registro", async function () {
      const record = await timeRegistry.timeRecords(0);
      expect(record.employee).to.equal(professional.address);
      expect(record.company).to.equal(company.address);
      expect(record.description).to.equal("Desarrollo de frontend");
      expect(record.status).to.equal(0); // Pending
    });

    it("Debería obtener información de múltiples registros", async function () {
      const record1 = await timeRegistry.timeRecords(0);
      const record2 = await timeRegistry.timeRecords(1);
      
      expect(record1.employee).to.equal(professional.address);
      expect(record2.employee).to.equal(professional.address);
      expect(record1.description).to.equal("Desarrollo de frontend");
      expect(record2.description).to.equal("Testing");
    });
  });

  describe("Gestión de pausas", function () {
    it("Debería permitir al admin pausar el contrato", async function () {
      await timeRegistry.pause();
      expect(await timeRegistry.paused()).to.be.true;
    });

    it("No debería permitir registrar tiempo cuando está pausado", async function () {
      await timeRegistry.pause();
      
      const startTime = Math.floor(Date.now() / 1000);
      const endTime = startTime + 3600;
      
      await expect(
        timeRegistry.connect(professional).registerTime(
          company.address,
          startTime,
          endTime,
          "Desarrollo",
          [1]
        )
      ).to.be.revertedWith("Pausable: paused");
    });

    it("Debería permitir al admin despausar el contrato", async function () {
      await timeRegistry.pause();
      await timeRegistry.unpause();
      expect(await timeRegistry.paused()).to.be.false;
    });
  });

  describe("Control de acceso", function () {
    it("Debería verificar que el owner tiene el rol DEFAULT_ADMIN_ROLE", async function () {
      const DEFAULT_ADMIN_ROLE = await timeRegistry.DEFAULT_ADMIN_ROLE();
      expect(await timeRegistry.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
    });

    it("Debería verificar que el owner tiene el rol KARMA_ROLE", async function () {
      const KARMA_ROLE = await timeRegistry.KARMA_ROLE();
      expect(await timeRegistry.hasRole(KARMA_ROLE, owner.address)).to.be.true;
    });

    it("Debería permitir otorgar roles a otros usuarios", async function () {
      const ADMIN_ROLE = await timeRegistry.ADMIN_ROLE();
      await timeRegistry.grantRole(ADMIN_ROLE, professional.address);
      
      expect(await timeRegistry.hasRole(ADMIN_ROLE, professional.address)).to.be.true;
    });
  });

  describe("Estados de registros", function () {
    beforeEach(async function () {
      const startTime = Math.floor(Date.now() / 1000);
      const endTime = startTime + 3600;
      
      await timeRegistry.connect(professional).registerTime(
        company.address,
        startTime,
        endTime,
        "Desarrollo de frontend",
        [1, 2]
      );
    });

    it("Debería crear registros en estado Pending por defecto", async function () {
      const record = await timeRegistry.timeRecords(0);
      expect(record.status).to.equal(0); // Pending
    });

    it("Debería cambiar estado a Validated después de validación", async function () {
      await timeRegistry.connect(company).validateTimeRecord(0);
      
      const record = await timeRegistry.timeRecords(0);
      expect(record.status).to.equal(1); // Validated
    });

    it("Debería cambiar estado a Disputed después de disputa", async function () {
      await timeRegistry.connect(company).disputeTimeRecord(0);
      
      const record = await timeRegistry.timeRecords(0);
      expect(record.status).to.equal(2); // Disputed
    });
  });
});

