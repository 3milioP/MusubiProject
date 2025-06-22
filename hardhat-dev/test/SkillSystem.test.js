const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SkillSystem Contract", function () {
  let ProfileRegistry;
  let SkillSystem;
  let profileRegistry;
  let skillSystem;
  let owner;
  let professional;
  let validator;
  let addrs;

  beforeEach(async function () {
    [owner, professional, validator, ...addrs] = await ethers.getSigners();

    const ProfileRegistry = await ethers.getContractFactory("ProfileRegistry");
    profileRegistry = await ProfileRegistry.deploy();
    await profileRegistry.waitForDeployment();
    
    const SkillSystem = await ethers.getContractFactory("SkillSystem");
    skillSystem = await SkillSystem.deploy(profileRegistry.target);
    await skillSystem.waitForDeployment();
    
    // Registrar perfiles
    const metadataURI = "ipfs://QmXnnyufdzAWL5CqZ2RnSNgPbvCc1ALT73s6epPrRnZ1Xy";
    await profileRegistry.connect(professional).registerProfile("Juan Pérez", "Desarrollador", metadataURI, 0, true); // Professional
    await profileRegistry.connect(validator).registerProfile("TechCorp", "Empresa de validación", metadataURI, 1, true); // Company
    
    // Verificar perfiles
    await profileRegistry.connect(owner).verifyProfile(professional.address);
    await profileRegistry.connect(owner).verifyProfile(validator.address);
    
    // Otorgar rol de karma a todos los perfiles relevantes para que puedan validar
    const karmaRole = await profileRegistry.KARMA_ROLE();
    await profileRegistry.connect(owner).grantRole(karmaRole, professional.address);
    await profileRegistry.connect(owner).grantRole(karmaRole, validator.address);
    
    // Otorgar rol de karma al contrato SkillSystem en ProfileRegistry para que pueda actualizar karma
    await profileRegistry.connect(owner).grantRole(karmaRole, await skillSystem.getAddress());
    
    // Otorgar rol KARMA_ROLE al validator en SkillSystem también
    const skillSystemKarmaRole = await skillSystem.KARMA_ROLE();
    await skillSystem.connect(owner).grantRole(skillSystemKarmaRole, validator.address);
    await skillSystem.connect(owner).grantRole(skillSystemKarmaRole, professional.address);

    // Crear algunas habilidades
    await skillSystem.connect(owner).createSkill("JavaScript", "Programming");
    await skillSystem.connect(owner).createSkill("React", "Frontend");
    await skillSystem.connect(owner).createSkill("Solidity", "Blockchain");
  });

  describe("Creación de habilidades", function () {
    it("Debería permitir al admin crear una nueva habilidad", async function () {
      await skillSystem.connect(owner).createSkill("TypeScript", "Programming");
      
      const skill = await skillSystem.skills(3);
      expect(skill.name).to.equal("TypeScript");
      expect(skill.category).to.equal("Programming");
      expect(skill.isActive).to.be.true;
    });

    it("No debería permitir a usuarios no autorizados crear habilidades", async function () {
      await expect(
        skillSystem.connect(professional).createSkill("JavaScript", "Programming")
      ).to.be.reverted;
    });

    it("Debería emitir un evento al crear una habilidad", async function () {
      await expect(skillSystem.connect(owner).createSkill("TypeScript", "Programming"))
        .to.emit(skillSystem, "SkillCreated")
        .withArgs(3, "TypeScript", "Programming");
    });
  });

  describe("Declaración de habilidades", function () {
    beforeEach(async function () {
      await skillSystem.connect(professional).declareSkill(0, 4);
    });

    it("Debería permitir a un profesional declarar una habilidad", async function () {
      const declaredSkill = await skillSystem.declaredSkills(professional.address, 0);
      expect(declaredSkill.skillId).to.equal(0);
      expect(declaredSkill.level).to.equal(4);
      expect(declaredSkill.isActive).to.be.true;
      expect(declaredSkill.isValidated).to.be.false;
    });

    it("Debería permitir actualizar el nivel de una habilidad existente", async function () {
      await skillSystem.connect(professional).updateSkillLevel(0, 5);
      
      const declaredSkill = await skillSystem.declaredSkills(professional.address, 0);
      expect(declaredSkill.level).to.equal(5);
    });

    it("No debería permitir declarar una habilidad con nivel inválido", async function () {
      await expect(
        skillSystem.connect(professional).declareSkill(1, 0)
      ).to.be.revertedWith("Level must be between 1 and 5");
      
      await expect(
        skillSystem.connect(professional).declareSkill(1, 6)
      ).to.be.revertedWith("Level must be between 1 and 5");
    });

    it("Debería emitir un evento al declarar una habilidad", async function () {
      await expect(skillSystem.connect(professional).declareSkill(1, 4))
        .to.emit(skillSystem, "SkillDeclared")
        .withArgs(1, professional.address, 4);
    });
  });

  describe("Validación de habilidades", function () {
    beforeEach(async function () {
      await skillSystem.connect(professional).declareSkill(0, 4);
    });

    it("Debería permitir solicitar validación de una habilidad", async function () {
      await skillSystem.connect(professional).requestValidation(0, validator.address);
    });

    it("Debería emitir un evento al solicitar validación", async function () {
      await expect(skillSystem.connect(professional).requestValidation(0, validator.address))
        .to.emit(skillSystem, "ValidationRequested")
        .withArgs(0, professional.address, validator.address);
    });

    it("No debería permitir solicitar validación de habilidad ajena", async function () {
      await expect(
        skillSystem.connect(validator).requestValidation(0, professional.address)
      ).to.be.revertedWith("Skill not declared by professional");
    });
  });

  describe("Consulta de habilidades", function () {
    beforeEach(async function () {
      await skillSystem.connect(owner).createSkill("JavaScript", "Programming");
      await skillSystem.connect(owner).createSkill("Python", "Programming");
      await skillSystem.connect(professional).declareSkill(0, 4);
      await skillSystem.connect(professional).declareSkill(1, 3);
    });

    it("Debería obtener información detallada de una habilidad declarada", async function () {
      const declaredSkill = await skillSystem.declaredSkills(professional.address, 0);
      expect(declaredSkill.skillId).to.equal(0);
      expect(declaredSkill.level).to.equal(4);
      expect(declaredSkill.professional).to.equal(professional.address);
    });

    it("Debería obtener información de múltiples habilidades declaradas", async function () {
      const professionalSkills = await skillSystem.getProfessionalSkills(professional.address);
      expect(professionalSkills.length).to.equal(2);
      expect(professionalSkills[0]).to.equal(0);
      expect(professionalSkills[1]).to.equal(1);
    });
  });

  describe("Gestión de pausas", function () {
    beforeEach(async function () {
      await skillSystem.connect(owner).createSkill("JavaScript", "Programming");
    });

    it("Debería permitir al admin pausar el contrato", async function () {
      await skillSystem.connect(owner).pause();
      expect(await skillSystem.paused()).to.be.true;
    });

    it("No debería permitir declarar habilidades cuando está pausado", async function () {
      await skillSystem.connect(owner).pause();
      
      await expect(
        skillSystem.connect(professional).declareSkill(0, 4)
      ).to.be.revertedWith("Pausable: paused");
    });

    it("Debería permitir al admin despausar el contrato", async function () {
      await skillSystem.connect(owner).pause();
      await skillSystem.connect(owner).unpause();
      expect(await skillSystem.paused()).to.be.false;
    });
  });

  describe("Control de acceso", function () {
    it("Debería verificar que el owner tiene el rol DEFAULT_ADMIN_ROLE", async function () {
      const adminRole = await skillSystem.DEFAULT_ADMIN_ROLE();
      expect(await skillSystem.hasRole(adminRole, owner.address)).to.be.true;
    });

    it("Debería verificar que el owner tiene el rol KARMA_ROLE", async function () {
      const karmaRole = await skillSystem.KARMA_ROLE();
      expect(await skillSystem.hasRole(karmaRole, owner.address)).to.be.true;
    });

    it("Debería permitir otorgar roles a otros usuarios", async function () {
      const karmaRole = await skillSystem.KARMA_ROLE();
      await skillSystem.connect(owner).grantRole(karmaRole, professional.address);
      expect(await skillSystem.hasRole(karmaRole, professional.address)).to.be.true;
    });
  });
});

