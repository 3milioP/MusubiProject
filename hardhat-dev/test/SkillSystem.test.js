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
    await skillSystem.deployed();
  });

  describe("Declaración de habilidades", function () {
    it("Debería permitir a un profesional declarar una habilidad", async function () {
      await skillSystem.connect(professional).declareSkill("JavaScript", 3);
      
      const skill = await skillSystem.getSkill(professional.address, "JavaScript");
      expect(skill.name).to.equal("JavaScript");
      expect(skill.level).to.equal(3);
      expect(skill.isDeclared).to.equal(true);
    });

    it("Debería permitir actualizar el nivel de una habilidad existente", async function () {
      await skillSystem.connect(professional).declareSkill("JavaScript", 3);
      await skillSystem.connect(professional).declareSkill("JavaScript", 4);
      
      const skill = await skillSystem.getSkill(professional.address, "JavaScript");
      expect(skill.level).to.equal(4);
    });

    it("No debería permitir declarar una habilidad con nivel inválido", async function () {
      await expect(
        skillSystem.connect(professional).declareSkill("JavaScript", 0)
      ).to.be.revertedWith("Invalid skill level");
      
      await expect(
        skillSystem.connect(professional).declareSkill("JavaScript", 6)
      ).to.be.revertedWith("Invalid skill level");
    });

    it("Debería emitir un evento al declarar una habilidad", async function () {
      await expect(skillSystem.connect(professional).declareSkill("JavaScript", 3))
        .to.emit(skillSystem, "SkillDeclared")
        .withArgs(professional.address, "JavaScript", 3);
    });
  });

  describe("Validación de habilidades", function () {
    beforeEach(async function () {
      // Declarar una habilidad para las pruebas
      await skillSystem.connect(professional).declareSkill("JavaScript", 3);
    });

    it("Debería permitir a una empresa validar una habilidad", async function () {
      await skillSystem.connect(company).validateSkill(professional.address, "JavaScript", 4);
      
      const validation = await skillSystem.getValidation(professional.address, "JavaScript", company.address);
      expect(validation.isValidated).to.equal(true);
      expect(validation.level).to.equal(4);
    });

    it("No debería permitir validar una habilidad no declarada", async function () {
      await expect(
        skillSystem.connect(company).validateSkill(professional.address, "Python", 3)
      ).to.be.revertedWith("Skill not declared");
    });

    it("No debería permitir validar una habilidad con nivel inválido", async function () {
      await expect(
        skillSystem.connect(company).validateSkill(professional.address, "JavaScript", 0)
      ).to.be.revertedWith("Invalid skill level");
      
      await expect(
        skillSystem.connect(company).validateSkill(professional.address, "JavaScript", 6)
      ).to.be.revertedWith("Invalid skill level");
    });

    it("Debería permitir actualizar una validación existente", async function () {
      await skillSystem.connect(company).validateSkill(professional.address, "JavaScript", 4);
      await skillSystem.connect(company).validateSkill(professional.address, "JavaScript", 3);
      
      const validation = await skillSystem.getValidation(professional.address, "JavaScript", company.address);
      expect(validation.level).to.equal(3);
    });

    it("Debería emitir un evento al validar una habilidad", async function () {
      await expect(skillSystem.connect(company).validateSkill(professional.address, "JavaScript", 4))
        .to.emit(skillSystem, "SkillValidated")
        .withArgs(professional.address, "JavaScript", company.address, 4);
    });
  });

  describe("Cálculo de Karma", function () {
    beforeEach(async function () {
      // Declarar habilidades y validaciones para las pruebas
      await skillSystem.connect(professional).declareSkill("JavaScript", 3);
      await skillSystem.connect(professional).declareSkill("Python", 4);
      
      await skillSystem.connect(company).validateSkill(professional.address, "JavaScript", 3);
      await skillSystem.connect(validator).validateSkill(professional.address, "JavaScript", 4);
      await skillSystem.connect(company).validateSkill(professional.address, "Python", 3);
    });

    it("Debería calcular correctamente el karma de una habilidad", async function () {
      const karma = await skillSystem.calculateSkillKarma(professional.address, "JavaScript");
      // Karma = (3 + 4) / 2 = 3.5, redondeado a 4 (según la implementación)
      expect(karma).to.equal(4);
    });

    it("Debería calcular correctamente el karma total", async function () {
      const totalKarma = await skillSystem.calculateTotalKarma(professional.address);
      // JavaScript: (3 + 4) / 2 = 3.5, redondeado a 4
      // Python: 3 (una sola validación)
      // Total: 4 + 3 = 7
      expect(totalKarma).to.equal(7);
    });

    it("Debería devolver 0 para el karma de una habilidad no declarada", async function () {
      const karma = await skillSystem.calculateSkillKarma(professional.address, "Rust");
      expect(karma).to.equal(0);
    });

    it("Debería devolver 0 para el karma de una habilidad sin validaciones", async function () {
      await skillSystem.connect(professional).declareSkill("Rust", 2);
      const karma = await skillSystem.calculateSkillKarma(professional.address, "Rust");
      expect(karma).to.equal(0);
    });
  });

  describe("Consulta de habilidades", function () {
    beforeEach(async function () {
      // Declarar habilidades para las pruebas
      await skillSystem.connect(professional).declareSkill("JavaScript", 3);
      await skillSystem.connect(professional).declareSkill("Python", 4);
      await skillSystem.connect(professional).declareSkill("Solidity", 2);
    });

    it("Debería obtener todas las habilidades de un profesional", async function () {
      const skills = await skillSystem.getSkills(professional.address);
      expect(skills.length).to.equal(3);
      expect(skills[0]).to.equal("JavaScript");
      expect(skills[1]).to.equal("Python");
      expect(skills[2]).to.equal("Solidity");
    });

    it("Debería devolver un array vacío para un profesional sin habilidades", async function () {
      const skills = await skillSystem.getSkills(addrs[0].address);
      expect(skills.length).to.equal(0);
    });
  });

  describe("Consulta de validaciones", function () {
    beforeEach(async function () {
      // Declarar habilidades y validaciones para las pruebas
      await skillSystem.connect(professional).declareSkill("JavaScript", 3);
      await skillSystem.connect(company).validateSkill(professional.address, "JavaScript", 3);
      await skillSystem.connect(validator).validateSkill(professional.address, "JavaScript", 4);
    });

    it("Debería obtener todos los validadores de una habilidad", async function () {
      const validators = await skillSystem.getValidators(professional.address, "JavaScript");
      expect(validators.length).to.equal(2);
      expect(validators[0]).to.equal(company.address);
      expect(validators[1]).to.equal(validator.address);
    });

    it("Debería devolver un array vacío para una habilidad sin validaciones", async function () {
      await skillSystem.connect(professional).declareSkill("Python", 4);
      const validators = await skillSystem.getValidators(professional.address, "Python");
      expect(validators.length).to.equal(0);
    });
  });
});
