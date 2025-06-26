const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SkillSystem", function () {
  let SkillSystem, skillSystem;
  let IPFSRegistry, ipfsRegistry;
  let owner, professional, validator, user1;
  let addrs;

  beforeEach(async function () {
    [owner, professional, validator, user1, ...addrs] = await ethers.getSigners();

    // Desplegar IPFSRegistry primero
    IPFSRegistry = await ethers.getContractFactory("IPFSRegistry");
    ipfsRegistry = await IPFSRegistry.deploy();
    await ipfsRegistry.waitForDeployment();

    // Desplegar SkillSystem
    SkillSystem = await ethers.getContractFactory("SkillSystem");
    skillSystem = await SkillSystem.deploy(await ipfsRegistry.getAddress());
    await skillSystem.waitForDeployment();

    // Registrar algunos hashes de IPFS para las pruebas
    const skillHash = "ipfs://QmSkillHash123456789";
    const declarationHash = "ipfs://QmDeclarationHash123456789";
    const updatedSkillHash = "ipfs://QmUpdatedSkillHash123456789";
    
    await ipfsRegistry.connect(owner).storeRecord(skillHash, "sha256hash1", "skills", "skill");
    await ipfsRegistry.connect(owner).storeRecord(declarationHash, "sha256hash2", "declarations", "declaration");
    await ipfsRegistry.connect(owner).storeRecord(updatedSkillHash, "sha256hash3", "skills", "skill");

    // Otorgar rol VALIDATOR_ROLE al validator
    const validatorRole = await skillSystem.VALIDATOR_ROLE();
    await skillSystem.connect(owner).grantRole(validatorRole, validator.address);
  });

  describe("Constructor", function () {
    it("Debería establecer correctamente la dirección de IPFSRegistry", async function () {
      expect(await skillSystem.ipfsRegistry()).to.equal(await ipfsRegistry.getAddress());
    });

    it("Debería otorgar roles correctamente al deployer", async function () {
      const DEFAULT_ADMIN_ROLE = await skillSystem.DEFAULT_ADMIN_ROLE();
      const KARMA_ROLE = await skillSystem.KARMA_ROLE();
      const VALIDATOR_ROLE = await skillSystem.VALIDATOR_ROLE();

      expect(await skillSystem.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
      expect(await skillSystem.hasRole(KARMA_ROLE, owner.address)).to.be.true;
      expect(await skillSystem.hasRole(VALIDATOR_ROLE, owner.address)).to.be.true;
    });
  });

  describe("Skill Creation", function () {
    it("Debería permitir crear una habilidad", async function () {
      const skillHash = "ipfs://QmSkillHash123456789";
      
      await skillSystem.connect(owner).createSkill(skillHash);
      
      const skill = await skillSystem.skills(0);
      expect(skill.id).to.equal(0);
      expect(skill.skillDataHash).to.equal(skillHash);
      expect(skill.creator).to.equal(owner.address);
      expect(skill.isActive).to.be.true;
      expect(skill.totalDeclarations).to.equal(0);
      expect(skill.totalValidations).to.equal(0);
    });

    it("Debería rechazar creación con hash que no existe en IPFS", async function () {
      const invalidHash = "ipfs://QmInvalidHash";
      
      await expect(
        skillSystem.connect(owner).createSkill(invalidHash)
      ).to.be.revertedWith("Skill data not found in IPFS");
    });

    it("Debería rechazar hash vacío", async function () {
      await expect(
        skillSystem.connect(owner).createSkill("")
      ).to.be.revertedWith("Skill data hash cannot be empty");
    });

    it("Debería incrementar el contador de skills", async function () {
      const skillHash = "ipfs://QmSkillHash123456789";
      
      expect(await skillSystem.totalSkills()).to.equal(0);
      await skillSystem.connect(owner).createSkill(skillHash);
      expect(await skillSystem.totalSkills()).to.equal(1);
    });
  });

  describe("Skill Updates", function () {
    beforeEach(async function () {
      const skillHash = "ipfs://QmSkillHash123456789";
      await skillSystem.connect(owner).createSkill(skillHash);
    });

    it("Debería permitir actualizar una habilidad", async function () {
      const newSkillHash = "ipfs://QmUpdatedSkillHash123456789";
      
      await skillSystem.connect(owner).updateSkill(0, newSkillHash);
      
      const skill = await skillSystem.skills(0);
      expect(skill.skillDataHash).to.equal(newSkillHash);
    });

    it("Debería rechazar actualización con hash inválido", async function () {
      const invalidHash = "ipfs://QmInvalidHash";
      
      await expect(
        skillSystem.connect(owner).updateSkill(0, invalidHash)
      ).to.be.revertedWith("Skill data not found in IPFS");
    });

    it("Debería rechazar actualización de habilidad inexistente", async function () {
      const newSkillHash = "ipfs://QmUpdatedSkillHash123456789";
      
      await expect(
        skillSystem.connect(owner).updateSkill(999, newSkillHash)
      ).to.be.revertedWith("Skill does not exist");
    });

    it("Debería rechazar actualización por no creador", async function () {
      const newSkillHash = "ipfs://QmUpdatedSkillHash123456789";
      
      await expect(
        skillSystem.connect(user1).updateSkill(0, newSkillHash)
      ).to.be.revertedWith("Not skill creator");
    });
  });

  describe("Skill Deactivation", function () {
    beforeEach(async function () {
      const skillHash = "ipfs://QmSkillHash123456789";
      await skillSystem.connect(owner).createSkill(skillHash);
    });

    it("Debería permitir desactivar una habilidad", async function () {
      await skillSystem.connect(owner).deactivateSkill(0);
      
      const skill = await skillSystem.skills(0);
      expect(skill.isActive).to.be.false;
    });

    it("Debería rechazar desactivación de habilidad inexistente", async function () {
      await expect(
        skillSystem.connect(owner).deactivateSkill(999)
      ).to.be.revertedWith("Skill does not exist");
    });

    it("Debería permitir desactivación por admin", async function () {
      await skillSystem.connect(owner).deactivateSkill(0);
      
      const skill = await skillSystem.skills(0);
      expect(skill.isActive).to.be.false;
    });
  });

  describe("Skill Declaration", function () {
    beforeEach(async function () {
      const skillHash = "ipfs://QmSkillHash123456789";
      await skillSystem.connect(owner).createSkill(skillHash);
    });

    it("Debería permitir declarar una habilidad", async function () {
      const declarationHash = "ipfs://QmDeclarationHash123456789";
      const level = 5;
      
      await skillSystem.connect(professional).declareSkill(0, declarationHash, level);
      
      const declaredSkill = await skillSystem.getDeclaredSkill(professional.address, 0);
      expect(declaredSkill.skillId).to.equal(0);
      expect(declaredSkill.professional).to.equal(professional.address);
      expect(declaredSkill.declarationDataHash).to.equal(declarationHash);
      expect(declaredSkill.level).to.equal(level);
      expect(declaredSkill.isActive).to.be.true;
      expect(declaredSkill.isValidated).to.be.false;
    });

    it("Debería rechazar declaración con hash que no existe en IPFS", async function () {
      const invalidHash = "ipfs://QmInvalidHash";
      
      await expect(
        skillSystem.connect(professional).declareSkill(0, invalidHash, 5)
      ).to.be.revertedWith("Declaration data not found in IPFS");
    });

    it("Debería rechazar declaración de habilidad inexistente", async function () {
      const declarationHash = "ipfs://QmDeclarationHash123456789";
      
      await expect(
        skillSystem.connect(professional).declareSkill(999, declarationHash, 5)
      ).to.be.revertedWith("Skill does not exist");
    });

    it("Debería rechazar declaración de habilidad inactiva", async function () {
      await skillSystem.connect(owner).deactivateSkill(0);
      
      const declarationHash = "ipfs://QmDeclarationHash123456789";
      await expect(
        skillSystem.connect(professional).declareSkill(0, declarationHash, 5)
      ).to.be.revertedWith("Skill is not active");
    });

    it("Debería rechazar declaración duplicada", async function () {
      const declarationHash = "ipfs://QmDeclarationHash123456789";
      
      await skillSystem.connect(professional).declareSkill(0, declarationHash, 5);
      
      await expect(
        skillSystem.connect(professional).declareSkill(0, declarationHash, 6)
      ).to.be.revertedWith("Skill already declared");
    });

    it("Debería rechazar nivel inválido", async function () {
      const declarationHash = "ipfs://QmDeclarationHash123456789";
      
      await expect(
        skillSystem.connect(professional).declareSkill(0, declarationHash, 0)
      ).to.be.revertedWith("Level must be between 1 and 10");
      
      await expect(
        skillSystem.connect(professional).declareSkill(0, declarationHash, 11)
      ).to.be.revertedWith("Level must be between 1 and 10");
    });
  });

  describe("Skill Validation", function () {
    beforeEach(async function () {
      const skillHash = "ipfs://QmSkillHash123456789";
      await skillSystem.connect(owner).createSkill(skillHash);
      
      const declarationHash = "ipfs://QmDeclarationHash123456789";
      await skillSystem.connect(professional).declareSkill(0, declarationHash, 5);
    });

    it("Debería permitir validar una habilidad", async function () {
      const validatedLevel = 4;
      
      await skillSystem.connect(validator).validateSkill(professional.address, 0, validatedLevel);
      
      const declaredSkill = await skillSystem.getDeclaredSkill(professional.address, 0);
      expect(declaredSkill.isValidated).to.be.true;
      expect(declaredSkill.validatedBy).to.equal(validator.address);
      expect(declaredSkill.level).to.equal(validatedLevel);
    });

    it("Debería rechazar validación de habilidad no declarada", async function () {
      await expect(
        skillSystem.connect(validator).validateSkill(user1.address, 0, 4)
      ).to.be.revertedWith("Skill not declared by professional");
    });

    it("Debería rechazar validación de habilidad ya validada", async function () {
      await skillSystem.connect(validator).validateSkill(professional.address, 0, 4);
      
      await expect(
        skillSystem.connect(validator).validateSkill(professional.address, 0, 5)
      ).to.be.revertedWith("Skill already validated");
    });

    it("Debería rechazar auto-validación", async function () {
      // Otorgar rol VALIDATOR_ROLE al professional para que pueda intentar auto-validarse
      const validatorRole = await skillSystem.VALIDATOR_ROLE();
      await skillSystem.connect(owner).grantRole(validatorRole, professional.address);
      
      await expect(
        skillSystem.connect(professional).validateSkill(professional.address, 0, 4)
      ).to.be.revertedWith("Cannot validate own skill");
    });

    it("Debería rechazar validación sin rol VALIDATOR_ROLE", async function () {
      await expect(
        skillSystem.connect(user1).validateSkill(professional.address, 0, 4)
      ).to.be.reverted;
    });

    it("Debería rechazar nivel inválido en validación", async function () {
      await expect(
        skillSystem.connect(validator).validateSkill(professional.address, 0, 0)
      ).to.be.revertedWith("Level must be between 1 and 10");
      
      await expect(
        skillSystem.connect(validator).validateSkill(professional.address, 0, 11)
      ).to.be.revertedWith("Level must be between 1 and 10");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      const skillHash = "ipfs://QmSkillHash123456789";
      await skillSystem.connect(owner).createSkill(skillHash);
      
      const declarationHash = "ipfs://QmDeclarationHash123456789";
      await skillSystem.connect(professional).declareSkill(0, declarationHash, 5);
    });

    it("Debería obtener habilidad por ID", async function () {
      const skill = await skillSystem.getSkill(0);
      expect(skill.id).to.equal(0);
      expect(skill.skillDataHash).to.equal("ipfs://QmSkillHash123456789");
      expect(skill.creator).to.equal(owner.address);
    });

    it("Debería obtener habilidad declarada", async function () {
      const declaredSkill = await skillSystem.getDeclaredSkill(professional.address, 0);
      expect(declaredSkill.skillId).to.equal(0);
      expect(declaredSkill.professional).to.equal(professional.address);
      expect(declaredSkill.level).to.equal(5);
    });

    it("Debería verificar si un profesional tiene habilidad declarada", async function () {
      expect(await skillSystem.hasDeclaredSkill(professional.address, 0)).to.be.true;
      expect(await skillSystem.hasDeclaredSkill(user1.address, 0)).to.be.false;
    });

    it("Debería verificar si un profesional tiene habilidad validada", async function () {
      expect(await skillSystem.hasValidatedSkill(professional.address, 0)).to.be.false;
      
      await skillSystem.connect(validator).validateSkill(professional.address, 0, 4);
      
      expect(await skillSystem.hasValidatedSkill(professional.address, 0)).to.be.true;
    });

    it("Debería obtener habilidades de un profesional", async function () {
      const skills = await skillSystem.getProfessionalSkills(professional.address);
      expect(skills).to.include(0n);
      expect(skills.length).to.equal(1);
    });

    it("Debería obtener profesionales de una habilidad", async function () {
      const professionals = await skillSystem.getSkillProfessionals(0);
      expect(professionals).to.include(professional.address);
      expect(professionals.length).to.equal(1);
    });
  });
});

