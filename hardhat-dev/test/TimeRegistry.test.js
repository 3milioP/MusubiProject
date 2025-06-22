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

describe("TimeRegistry Contract", function () {
  let ProfileRegistry;
  let SkillSystem;
  let TimeRegistry;
  let profileRegistry;
  let skillSystem;
  let timeRegistry;
  let owner;
  let professional;
  let company;
  let validator;
  let addrs;

  beforeEach(async function () {
    [owner, professional, validator, company, ...addrs] = await ethers.getSigners();

    const ProfileRegistry = await ethers.getContractFactory("ProfileRegistry");
    profileRegistry = await ProfileRegistry.deploy();
    await profileRegistry.waitForDeployment();
    
    const SkillSystem = await ethers.getContractFactory("SkillSystem");
    skillSystem = await SkillSystem.deploy(profileRegistry.target);
    await skillSystem.waitForDeployment();
    
    const TimeRegistry = await ethers.getContractFactory("TimeRegistry");
    timeRegistry = await TimeRegistry.deploy(profileRegistry.target, skillSystem.target);
    await timeRegistry.waitForDeployment();
    
    // Registrar perfiles - IMPORTANTE: Cada uno con su propio perfil
    const metadataURI = "ipfs://QmXnnyufdzAWL5CqZ2RnSNgPbvCc1ALT73s6epPrRnZ1Xy";
    await profileRegistry.connect(professional).registerProfile("Juan Pérez", "Desarrollador", metadataURI, 0, true); // Professional
    await profileRegistry.connect(company).registerProfile("TechCorp", "Empresa de software", metadataURI, 1, true); // Company
    await profileRegistry.connect(owner).registerProfile("Admin", "Administrador", metadataURI, 0, true); // Owner como profesional
    await profileRegistry.connect(validator).registerProfile("Validator", "Validador", metadataURI, 1, true); // Validator
    
    // Crear habilidad
    await skillSystem.connect(owner).createSkill("JavaScript", "Programming");
    
    // Declarar habilidad - SOLO el professional declara, NO el validator
    await skillSystem.connect(professional).declareSkill(0, 3); // skillId 0, level 3

    // Verificar perfiles - IMPORTANTE: Cada uno verifica a otros, no a sí mismo
    await profileRegistry.connect(owner).verifyProfile(professional.address);
    await profileRegistry.connect(owner).verifyProfile(company.address);
    await profileRegistry.connect(owner).verifyProfile(validator.address); // Verificar al validator
    // NO verificar al owner a sí mismo - eso no está permitido

    // Otorgar rol de karma a todos los perfiles relevantes para que puedan validar
    const karmaRole = await profileRegistry.KARMA_ROLE();
    await profileRegistry.connect(owner).grantRole(karmaRole, company.address);
    await profileRegistry.connect(owner).grantRole(karmaRole, validator.address);
    await profileRegistry.connect(owner).grantRole(karmaRole, professional.address);
    
    // Otorgar rol de karma al contrato SkillSystem en ProfileRegistry para que pueda actualizar karma
    await profileRegistry.connect(owner).grantRole(karmaRole, await skillSystem.getAddress());
    
    // Otorgar rol de karma al contrato TimeRegistry en ProfileRegistry para que pueda actualizar karma
    await profileRegistry.connect(owner).grantRole(karmaRole, await timeRegistry.getAddress());

    // Otorgar rol de karma al validator en SkillSystem también
    const skillSystemKarmaRole = await skillSystem.KARMA_ROLE();
    await skillSystem.connect(owner).grantRole(skillSystemKarmaRole, validator.address);
    await skillSystem.connect(owner).grantRole(skillSystemKarmaRole, company.address);
    await skillSystem.connect(owner).grantRole(skillSystemKarmaRole, professional.address);

    // Verificar habilidad del profesional - IMPORTANTE: Validator valida al professional
    await skillSystem.connect(validator).validateSkill(professional.address, 0, true);

    // Los perfiles y habilidades ya están creados y validados aquí, no repetir en los tests individuales
  });

  describe("Registro de tiempo", function () {
    it("Debería permitir a un profesional registrar tiempo", async function () {
      // La habilidad ya está declarada y validada en el beforeEach
      
      const startTime = Math.floor(Date.now() / 1000) - 3600; // 1 hora atrás
      const endTime = Math.floor(Date.now() / 1000); // ahora
      
      await timeRegistry.connect(professional).recordTime(
        company.address,
        0, // skillId
        startTime,
        endTime,
        "Desarrollo de funcionalidad"
      );
      
      const record = await timeRegistry.timeRecords(0);
      expect(record.professional).to.equal(professional.address);
      expect(record.company).to.equal(company.address);
      expect(record.skillId).to.equal(0);
      expect(record.totalHours).to.equal(1);
      expect(record.description).to.equal("Desarrollo de funcionalidad");
    });

    it("No debería permitir registrar tiempo con fechas inválidas", async function () {
      const startTime = Math.floor(Date.now() / 1000);
      const endTime = startTime - 3600; // endTime antes que startTime
      
      await expect(
        timeRegistry.connect(professional).recordTime(
          company.address,
          0,
          startTime,
          endTime,
          "Desarrollo de funcionalidad"
        )
      ).to.be.revertedWith("End time must be after start time");
    });

    it("No debería permitir registrar tiempo con startTime cero", async function () {
      const endTime = Math.floor(Date.now() / 1000);
      
      await expect(
        timeRegistry.connect(professional).recordTime(
          company.address,
          0,
          0, // startTime cero
          endTime,
          "Desarrollo de funcionalidad"
        )
      ).to.be.revertedWith("Start time cannot be zero");
    });

    it("Debería emitir un evento al registrar tiempo", async function () {
      // La habilidad ya está declarada y validada en el beforeEach
      const startTime = Math.floor(Date.now() / 1000) - 3600;
      const endTime = Math.floor(Date.now() / 1000);
      
      await expect(
        timeRegistry.connect(professional).recordTime(
          company.address,
          0,
          startTime,
          endTime,
          "Desarrollo de funcionalidad"
        )
      )
        .to.emit(timeRegistry, "TimeRecorded")
        .withArgs(0, professional.address, company.address, 0);
    });
  });

  describe("Validación de tiempo", function () {
    beforeEach(async function () {
      // La habilidad ya está declarada y validada en el beforeEach global
      const startTime = Math.floor(Date.now() / 1000) - 3600;
      const endTime = Math.floor(Date.now() / 1000);
      
      await timeRegistry.connect(professional).recordTime(
        company.address,
        0,
        startTime,
        endTime,
        "Desarrollo de funcionalidad"
      );
    });

    it("Debería permitir a una empresa validar un registro de tiempo", async function () {
      await timeRegistry.connect(company).validateTimeRecord(0);
      
      const record = await timeRegistry.timeRecords(0);
      expect(record.status).to.equal(1); // Validated
      expect(record.validatedBy).to.equal(company.address);
    });

    it("No debería permitir a usuarios no autorizados validar registros", async function () {
      await expect(
        timeRegistry.connect(professional).validateTimeRecord(0)
      ).to.be.revertedWith("Not record company");
    });

    it("Debería emitir un evento al validar un registro", async function () {
      await expect(timeRegistry.connect(company).validateTimeRecord(0))
        .to.emit(timeRegistry, "TimeValidated")
        .withArgs(0, company.address);
    });

    it("No debería permitir validar un registro ya validado", async function () {
      await timeRegistry.connect(company).validateTimeRecord(0);
      
      await expect(
        timeRegistry.connect(company).validateTimeRecord(0)
      ).to.be.revertedWith("Record not in pending status");
    });
  });

  describe("Disputa de registros", function () {
    beforeEach(async function () {
      // La habilidad ya está declarada y validada en el beforeEach global
      const startTime = Math.floor(Date.now() / 1000) - 3600;
      const endTime = Math.floor(Date.now() / 1000);
      await timeRegistry.connect(professional).recordTime(
        company.address,
        0,
        startTime,
        endTime,
        "Desarrollo de funcionalidad"
      );
    });

    it("Debería permitir a una empresa disputar un registro", async function () {
      await timeRegistry.connect(company).disputeTimeRecord(0);
      
      const record = await timeRegistry.timeRecords(0);
      expect(record.status).to.equal(2); // Disputed
      expect(record.disputedBy).to.equal(company.address);
    });

    it("Debería permitir a un empleado disputar un registro", async function () {
      await timeRegistry.connect(professional).disputeTimeRecord(0);
      
      const record = await timeRegistry.timeRecords(0);
      expect(record.status).to.equal(2); // Disputed
      expect(record.disputedBy).to.equal(professional.address);
    });

    it("Debería emitir un evento al disputar un registro", async function () {
      await expect(timeRegistry.connect(company).disputeTimeRecord(0))
        .to.emit(timeRegistry, "TimeDisputed")
        .withArgs(0, company.address);
    });
  });

  describe("Consulta de registros", function () {
    beforeEach(async function () {
      // La habilidad ya está declarada y validada en el beforeEach global
      const startTime = Math.floor(Date.now() / 1000) - 3600;
      const endTime = Math.floor(Date.now() / 1000);
      await timeRegistry.connect(professional).recordTime(
        company.address,
        0,
        startTime,
        endTime,
        "Desarrollo de funcionalidad"
      );
    });

    it("Debería obtener información detallada de un registro", async function () {
      const record = await timeRegistry.timeRecords(0);
      expect(record.professional).to.equal(professional.address);
      expect(record.company).to.equal(company.address);
      expect(record.skillId).to.equal(0);
      expect(record.totalHours).to.equal(1);
    });

    it("Debería obtener información de múltiples registros", async function () {
      const startTime = Math.floor(Date.now() / 1000) - 7200;
      const endTime = Math.floor(Date.now() / 1000) - 3600;
      
      await timeRegistry.connect(professional).recordTime(
        company.address,
        0,
        startTime,
        endTime,
        "Segundo registro"
      );
      
      const professionalRecords = await timeRegistry.getProfessionalRecords(professional.address);
      expect(professionalRecords.length).to.equal(2);
      expect(professionalRecords[0]).to.equal(0);
      expect(professionalRecords[1]).to.equal(1);
    });
  });

  describe("Gestión de pausas", function () {
    it("Debería permitir al admin pausar el contrato", async function () {
      await timeRegistry.connect(owner).pause();
      expect(await timeRegistry.paused()).to.be.true;
    });

    it("No debería permitir registrar tiempo cuando está pausado", async function () {
      await timeRegistry.connect(owner).pause();
      
      // Asegurar que la habilidad esté declarada y validada
      await ensureSkillDeclared(skillSystem, professional, validator, 0, 3);
      
      const startTime = Math.floor(Date.now() / 1000) - 3600;
      const endTime = Math.floor(Date.now() / 1000);
      
      await expect(
        timeRegistry.connect(professional).recordTime(
          company.address,
          0,
          startTime,
          endTime,
          "Desarrollo de funcionalidad"
        )
      ).to.be.revertedWith("Pausable: paused");
    });

    it("Debería permitir al admin despausar el contrato", async function () {
      await timeRegistry.connect(owner).pause();
      await timeRegistry.connect(owner).unpause();
      expect(await timeRegistry.paused()).to.be.false;
    });
  });

  describe("Control de acceso", function () {
    it("Debería verificar que el owner tiene el rol DEFAULT_ADMIN_ROLE", async function () {
      const adminRole = await timeRegistry.DEFAULT_ADMIN_ROLE();
      expect(await timeRegistry.hasRole(adminRole, owner.address)).to.be.true;
    });

    it("Debería verificar que el owner tiene el rol KARMA_ROLE", async function () {
      const karmaRole = await timeRegistry.KARMA_ROLE();
      expect(await timeRegistry.hasRole(karmaRole, owner.address)).to.be.true;
    });

    it("Debería permitir otorgar roles a otros usuarios", async function () {
      const karmaRole = await timeRegistry.KARMA_ROLE();
      await timeRegistry.connect(owner).grantRole(karmaRole, professional.address);
      expect(await timeRegistry.hasRole(karmaRole, professional.address)).to.be.true;
    });
  });

  describe("Estados de registros", function () {
    beforeEach(async function () {
      // Asegurar que la habilidad esté declarada y validada
      await skillSystem.connect(professional).declareSkill(0, 3);
      await skillSystem.connect(validator).validateSkill(professional.address, 0, true);
      
      const startTime = Math.floor(Date.now() / 1000) - 3600;
      const endTime = Math.floor(Date.now() / 1000);
      
      await timeRegistry.connect(professional).recordTime(
        company.address,
        0,
        startTime,
        endTime,
        "Desarrollo de funcionalidad"
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

