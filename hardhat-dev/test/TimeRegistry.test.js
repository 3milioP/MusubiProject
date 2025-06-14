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
    await timeRegistry.deployed();
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
        ["JavaScript", "React"]
      );
      
      const timeRecords = await timeRegistry.getTimeRecords(professional.address);
      expect(timeRecords.length).to.equal(1);
      
      const record = await timeRegistry.getTimeRecord(professional.address, 0);
      expect(record.company).to.equal(company.address);
      expect(record.startTime).to.equal(startTime);
      expect(record.endTime).to.equal(endTime);
      expect(record.description).to.equal("Desarrollo de frontend");
      expect(record.skills[0]).to.equal("JavaScript");
      expect(record.skills[1]).to.equal("React");
      expect(record.isValidated).to.equal(false);
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
          ["JavaScript", "React"]
        )
      ).to.be.revertedWith("End time must be after start time");
    });

    it("Debería emitir un evento al registrar tiempo", async function () {
      const startTime = Math.floor(Date.now() / 1000);
      const endTime = startTime + 3600; // 1 hora después
      
      await expect(
        timeRegistry.connect(professional).registerTime(
          company.address,
          startTime,
          endTime,
          "Desarrollo de frontend",
          ["JavaScript", "React"]
        )
      )
        .to.emit(timeRegistry, "TimeRegistered")
        .withArgs(professional.address, company.address, 0);
    });
  });

  describe("Validación de tiempo", function () {
    let startTime;
    let endTime;
    
    beforeEach(async function () {
      // Registrar tiempo para las pruebas
      startTime = Math.floor(Date.now() / 1000);
      endTime = startTime + 3600; // 1 hora después
      
      await timeRegistry.connect(professional).registerTime(
        company.address,
        startTime,
        endTime,
        "Desarrollo de frontend",
        ["JavaScript", "React"]
      );
    });

    it("Debería permitir a una empresa validar un registro de tiempo", async function () {
      await timeRegistry.connect(company).validateTime(professional.address, 0);
      
      const record = await timeRegistry.getTimeRecord(professional.address, 0);
      expect(record.isValidated).to.equal(true);
    });

    it("No debería permitir validar un registro de tiempo a una empresa incorrecta", async function () {
      await expect(
        timeRegistry.connect(addrs[0]).validateTime(professional.address, 0)
      ).to.be.revertedWith("Only the registered company can validate");
    });

    it("No debería permitir validar un registro de tiempo inexistente", async function () {
      await expect(
        timeRegistry.connect(company).validateTime(professional.address, 1)
      ).to.be.revertedWith("Time record does not exist");
    });

    it("No debería permitir validar un registro ya validado", async function () {
      await timeRegistry.connect(company).validateTime(professional.address, 0);
      
      await expect(
        timeRegistry.connect(company).validateTime(professional.address, 0)
      ).to.be.revertedWith("Time record already validated");
    });

    it("Debería emitir un evento al validar tiempo", async function () {
      await expect(
        timeRegistry.connect(company).validateTime(professional.address, 0)
      )
        .to.emit(timeRegistry, "TimeValidated")
        .withArgs(professional.address, company.address, 0);
    });
  });

  describe("Consulta de registros de tiempo", function () {
    beforeEach(async function () {
      // Registrar varios registros de tiempo para las pruebas
      const startTime1 = Math.floor(Date.now() / 1000);
      const endTime1 = startTime1 + 3600; // 1 hora después
      
      const startTime2 = startTime1 + 7200; // 2 horas después del primer inicio
      const endTime2 = startTime2 + 3600; // 1 hora después
      
      await timeRegistry.connect(professional).registerTime(
        company.address,
        startTime1,
        endTime1,
        "Desarrollo de frontend",
        ["JavaScript", "React"]
      );
      
      await timeRegistry.connect(professional).registerTime(
        company.address,
        startTime2,
        endTime2,
        "Desarrollo de backend",
        ["Node.js", "Express"]
      );
      
      // Validar el primer registro
      await timeRegistry.connect(company).validateTime(professional.address, 0);
    });

    it("Debería obtener todos los registros de tiempo de un profesional", async function () {
      const records = await timeRegistry.getTimeRecords(professional.address);
      expect(records.length).to.equal(2);
    });

    it("Debería obtener los registros de tiempo validados de un profesional", async function () {
      const validatedRecords = await timeRegistry.getValidatedTimeRecords(professional.address);
      expect(validatedRecords.length).to.equal(1);
      expect(validatedRecords[0]).to.equal(0); // Índice del registro validado
    });

    it("Debería obtener los registros de tiempo pendientes de un profesional", async function () {
      const pendingRecords = await timeRegistry.getPendingTimeRecords(professional.address);
      expect(pendingRecords.length).to.equal(1);
      expect(pendingRecords[0]).to.equal(1); // Índice del registro pendiente
    });

    it("Debería calcular correctamente las horas totales registradas", async function () {
      const totalHours = await timeRegistry.getTotalHours(professional.address);
      expect(totalHours).to.equal(2); // 2 registros de 1 hora cada uno
    });

    it("Debería calcular correctamente las horas validadas", async function () {
      const validatedHours = await timeRegistry.getValidatedHours(professional.address);
      expect(validatedHours).to.equal(1); // 1 registro validado de 1 hora
    });
  });

  describe("Consulta de registros por empresa", function () {
    beforeEach(async function () {
      // Registrar tiempo para diferentes empresas
      const startTime = Math.floor(Date.now() / 1000);
      const endTime = startTime + 3600; // 1 hora después
      
      await timeRegistry.connect(professional).registerTime(
        company.address,
        startTime,
        endTime,
        "Desarrollo de frontend",
        ["JavaScript", "React"]
      );
      
      await timeRegistry.connect(professional).registerTime(
        addrs[0].address,
        startTime,
        endTime,
        "Consultoría",
        ["Project Management"]
      );
      
      // Validar el registro de la primera empresa
      await timeRegistry.connect(company).validateTime(professional.address, 0);
    });

    it("Debería obtener los registros de tiempo para una empresa específica", async function () {
      const companyRecords = await timeRegistry.getTimeRecordsByCompany(professional.address, company.address);
      expect(companyRecords.length).to.equal(1);
      expect(companyRecords[0]).to.equal(0); // Índice del registro para la empresa
    });

    it("Debería obtener los registros pendientes para una empresa específica", async function () {
      const pendingRecords = await timeRegistry.getPendingTimeRecordsByCompany(professional.address, addrs[0].address);
      expect(pendingRecords.length).to.equal(1);
      expect(pendingRecords[0]).to.equal(1); // Índice del registro pendiente para la empresa
    });
  });
});
