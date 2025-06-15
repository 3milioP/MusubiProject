const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SkillSystem Contract", function () {
  let SkillSystem;
  let skillSystem;
  let owner;
  let professional;
  let company;
  let validator;
  let addrs;

  beforeEach(async function () {
    // Obtener los signers de prueba
    [owner, professional, company, validator, ...addrs] = await ethers.getSigners();

    // Desplegar el contrato SkillSystem
    SkillSystem = await ethers.getContractFactory("SkillSystem");
    skillSystem = await SkillSystem.deploy();
    await skillSystem.waitForDeployment();
    
    // Otorgar rol ADMIN_ROLE al owner para crear habilidades
    const ADMIN_ROLE = await skillSystem.ADMIN_ROLE();
    await skillSystem.grantRole(ADMIN_ROLE, owner.address);
  });

  describe("Creación de habilidades", function () {
    it("Debería permitir al admin crear una nueva habilidad", async function () {
      await skillSystem.createSkill("JavaScript", "Programming");
      
      const skill = await skillSystem.skills(0);
      expect(skill.name).to.equal("JavaScript");
      expect(skill.category).to.equal("Programming");
      expect(skill.isActive).to.equal(true);
    });

    it("No debería permitir a usuarios no autorizados crear habilidades", async function () {
      await expect(
        skillSystem.connect(professional).createSkill("JavaScript", "Programming")
      ).to.be.reverted;
    });

    it("Debería emitir un evento al crear una habilidad", async function () {
      await expect(skillSystem.createSkill("JavaScript", "Programming"))
        .to.emit(skillSystem, "SkillCreated")
        .withArgs(0, "JavaScript", "Programming");
    });
  });

  describe("Declaración de habilidades", function () {
    beforeEach(async function () {
      // Crear una habilidad primero
      await skillSystem.createSkill("JavaScript", "Programming");
    });

    it("Debería permitir a un profesional declarar una habilidad", async function () {
      await skillSystem.connect(professional).declareSkill(0, 2); // Advanced level
      
      const declaredSkill = await skillSystem.declaredSkills(0);
      expect(declaredSkill.skillId).to.equal(0);
      expect(declaredSkill.professional).to.equal(professional.address);
      expect(declaredSkill.declaredLevel).to.equal(2); // Advanced
    });

    it("Debería permitir actualizar el nivel de una habilidad existente", async function () {
      await skillSystem.connect(professional).declareSkill(0, 1); // Intermediate
      await skillSystem.connect(professional).declareSkill(0, 2); // Advanced
      
      // Verificar que se creó una nueva declaración
      const declaredSkill = await skillSystem.declaredSkills(1);
      expect(declaredSkill.declaredLevel).to.equal(2); // Advanced
    });

    it("No debería permitir declarar una habilidad con nivel inválido", async function () {
      await expect(
        skillSystem.connect(professional).declareSkill(0, 5) // Invalid level
      ).to.be.reverted;
    });

    it("Debería emitir un evento al declarar una habilidad", async function () {
      await expect(skillSystem.connect(professional).declareSkill(0, 2))
        .to.emit(skillSystem, "SkillDeclared")
        .withArgs(0, professional.address, 0, 2);
    });
  });

  describe("Validación de habilidades", function () {
    beforeEach(async function () {
      // Crear habilidad y declararla
      await skillSystem.createSkill("JavaScript", "Programming");
      await skillSystem.connect(professional).declareSkill(0, 2);
    });

    it("Debería permitir solicitar validación de una habilidad", async function () {
      await skillSystem.connect(professional).requestValidation(0, validator.address, "Project context");
      
      // Verificar que la validación fue creada
      const declaredSkill = await skillSystem.declaredSkills(0);
      expect(declaredSkill.professional).to.equal(professional.address);
    });

    it("Debería emitir un evento al solicitar validación", async function () {
      await expect(skillSystem.connect(professional).requestValidation(0, validator.address, "Project context"))
        .to.emit(skillSystem, "ValidationRequested")
        .withArgs(0, 0, validator.address);
    });

    it("No debería permitir solicitar validación de habilidad ajena", async function () {
      await expect(
        skillSystem.connect(validator).requestValidation(0, validator.address, "Project context")
      ).to.be.revertedWith("Not skill owner");
    });
  });

  describe("Consulta de habilidades", function () {
    beforeEach(async function () {
      // Crear múltiples habilidades y declararlas
      await skillSystem.createSkill("JavaScript", "Programming");
      await skillSystem.createSkill("React", "Frontend");
      await skillSystem.connect(professional).declareSkill(0, 2);
      await skillSystem.connect(professional).declareSkill(1, 1);
    });

    it("Debería obtener información detallada de una habilidad declarada", async function () {
      const declaredSkill = await skillSystem.declaredSkills(0);
      expect(declaredSkill.professional).to.equal(professional.address);
      expect(declaredSkill.skillId).to.equal(0);
      expect(declaredSkill.declaredLevel).to.equal(2);
    });

    it("Debería obtener información de múltiples habilidades declaradas", async function () {
      const declaredSkill1 = await skillSystem.declaredSkills(0);
      const declaredSkill2 = await skillSystem.declaredSkills(1);
      
      expect(declaredSkill1.professional).to.equal(professional.address);
      expect(declaredSkill2.professional).to.equal(professional.address);
      expect(declaredSkill1.skillId).to.equal(0);
      expect(declaredSkill2.skillId).to.equal(1);
    });
  });

  describe("Gestión de pausas", function () {
    beforeEach(async function () {
      await skillSystem.createSkill("JavaScript", "Programming");
    });

    it("Debería permitir al admin pausar el contrato", async function () {
      await skillSystem.pause();
      expect(await skillSystem.paused()).to.be.true;
    });

    it("No debería permitir declarar habilidades cuando está pausado", async function () {
      await skillSystem.pause();
      
      await expect(
        skillSystem.connect(professional).declareSkill(0, 2)
      ).to.be.revertedWith("Pausable: paused");
    });

    it("Debería permitir al admin despausar el contrato", async function () {
      await skillSystem.pause();
      await skillSystem.unpause();
      expect(await skillSystem.paused()).to.be.false;
    });
  });

  describe("Control de acceso", function () {
    it("Debería verificar que el owner tiene el rol DEFAULT_ADMIN_ROLE", async function () {
      const DEFAULT_ADMIN_ROLE = await skillSystem.DEFAULT_ADMIN_ROLE();
      expect(await skillSystem.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
    });

    it("Debería verificar que el owner tiene el rol KARMA_ROLE", async function () {
      const KARMA_ROLE = await skillSystem.KARMA_ROLE();
      expect(await skillSystem.hasRole(KARMA_ROLE, owner.address)).to.be.true;
    });

    it("Debería permitir otorgar roles a otros usuarios", async function () {
      const ADMIN_ROLE = await skillSystem.ADMIN_ROLE();
      await skillSystem.grantRole(ADMIN_ROLE, professional.address);
      
      expect(await skillSystem.hasRole(ADMIN_ROLE, professional.address)).to.be.true;
    });
  });
});

