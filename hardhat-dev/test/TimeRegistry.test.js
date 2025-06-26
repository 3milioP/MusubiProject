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

describe("TimeRegistry", function () {
  let TimeRegistry, timeRegistry;
  let IPFSRegistry, ipfsRegistry;
  let SkillSystem, skillSystem;
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

    // Desplegar TimeRegistry
    TimeRegistry = await ethers.getContractFactory("TimeRegistry");
    timeRegistry = await TimeRegistry.deploy(await ipfsRegistry.getAddress(), await skillSystem.getAddress());
    await timeRegistry.waitForDeployment();

    // Registrar algunos hashes de IPFS para las pruebas
    const timeHash = "ipfs://QmTimeHash123456789";
    const skillHash = "ipfs://QmSkillHash123456789";
    const declarationHash = "ipfs://QmDeclarationHash123456789";
    const updatedTimeHash = "ipfs://QmUpdatedTimeHash123456789";
    
    await ipfsRegistry.connect(owner).storeRecord(timeHash, "sha256hash1", "time", "time");
    await ipfsRegistry.connect(owner).storeRecord(skillHash, "sha256hash2", "skills", "skill");
    await ipfsRegistry.connect(owner).storeRecord(declarationHash, "sha256hash3", "declarations", "declaration");
    await ipfsRegistry.connect(owner).storeRecord(updatedTimeHash, "sha256hash4", "time", "time");

    // Crear habilidad y declararla para el profesional
    await skillSystem.connect(owner).createSkill(skillHash);
    await skillSystem.connect(professional).declareSkill(0, declarationHash, 5);
    
    // Otorgar rol VALIDATOR_ROLE al validator en SkillSystem
    const skillValidatorRole = await skillSystem.VALIDATOR_ROLE();
    await skillSystem.connect(owner).grantRole(skillValidatorRole, validator.address);
    
    // Validar la habilidad
    await skillSystem.connect(validator).validateSkill(professional.address, 0, 4);
    
    // Otorgar rol VALIDATOR_ROLE al validator en TimeRegistry
    const timeValidatorRole = await timeRegistry.VALIDATOR_ROLE();
    await timeRegistry.connect(owner).grantRole(timeValidatorRole, validator.address);
  });

  describe("Constructor", function () {
    it("Debería establecer correctamente las direcciones de IPFSRegistry y SkillSystem", async function () {
      expect(await timeRegistry.ipfsRegistry()).to.equal(await ipfsRegistry.getAddress());
      expect(await timeRegistry.skillSystem()).to.equal(await skillSystem.getAddress());
    });

    it("Debería otorgar roles correctamente al deployer", async function () {
      const DEFAULT_ADMIN_ROLE = await timeRegistry.DEFAULT_ADMIN_ROLE();
      const KARMA_ROLE = await timeRegistry.KARMA_ROLE();
      const VALIDATOR_ROLE = await timeRegistry.VALIDATOR_ROLE();

      expect(await timeRegistry.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
      expect(await timeRegistry.hasRole(KARMA_ROLE, owner.address)).to.be.true;
      expect(await timeRegistry.hasRole(VALIDATOR_ROLE, owner.address)).to.be.true;
    });
  });

  describe("Time Registration", function () {
    it("Debería permitir registrar tiempo trabajado", async function () {
      const timeHash = "ipfs://QmTimeHash123456789";
      const skillId = 0;
      const hoursWorked = 8;
      const hourlyRate = 100;
      
      await timeRegistry.connect(professional).registerTime(skillId, timeHash, hoursWorked, hourlyRate);
      
      const entry = await timeRegistry.timeEntries(0);
      expect(entry.id).to.equal(0);
      expect(entry.professional).to.equal(professional.address);
      expect(entry.skillId).to.equal(skillId);
      expect(entry.timeDataHash).to.equal(timeHash);
      expect(entry.hoursWorked).to.equal(hoursWorked);
      expect(entry.hourlyRate).to.equal(hourlyRate);
      expect(entry.totalAmount).to.equal(hoursWorked * hourlyRate);
      expect(entry.isValidated).to.be.false;
    });

    it("Debería rechazar registro con hash que no existe en IPFS", async function () {
      const invalidHash = "ipfs://QmInvalidHash";
      
      await expect(
        timeRegistry.connect(professional).registerTime(0, invalidHash, 8, 100)
      ).to.be.revertedWith("Time data not found in IPFS");
    });

    it("Debería rechazar registro con horas inválidas", async function () {
      const timeHash = "ipfs://QmTimeHash123456789";
      
      await expect(
        timeRegistry.connect(professional).registerTime(0, timeHash, 0, 100)
      ).to.be.revertedWith("Hours worked must be greater than zero");
    });

    it("Debería rechazar registro con tarifa inválida", async function () {
      const timeHash = "ipfs://QmTimeHash123456789";
      
      await expect(
        timeRegistry.connect(professional).registerTime(0, timeHash, 8, 0)
      ).to.be.revertedWith("Hourly rate must be greater than zero");
    });

    it("Debería rechazar registro con habilidad no declarada", async function () {
      const timeHash = "ipfs://QmTimeHash123456789";
      
      await expect(
        timeRegistry.connect(user1).registerTime(0, timeHash, 8, 100)
      ).to.be.revertedWith("Skill not declared by professional");
    });

    it("Debería rechazar registro con habilidad no validada", async function () {
      // Crear nueva habilidad y declararla sin validar
      const newSkillHash = "ipfs://QmNewSkillHash";
      const newDeclarationHash = "ipfs://QmNewDeclarationHash";
      
      await ipfsRegistry.connect(owner).storeRecord(newSkillHash, "sha256hash5", "skills", "skill");
      await ipfsRegistry.connect(owner).storeRecord(newDeclarationHash, "sha256hash6", "declarations", "declaration");
      
      await skillSystem.connect(owner).createSkill(newSkillHash);
      await skillSystem.connect(professional).declareSkill(1, newDeclarationHash, 5);
      
      const timeHash = "ipfs://QmTimeHash123456789";
      
      await expect(
        timeRegistry.connect(professional).registerTime(1, timeHash, 8, 100)
      ).to.be.revertedWith("Skill not validated");
    });

    it("Debería incrementar contadores correctamente", async function () {
      const timeHash = "ipfs://QmTimeHash123456789";
      
      expect(await timeRegistry.totalEntries()).to.equal(0);
      expect(await timeRegistry.totalHoursWorked()).to.equal(0);
      
      await timeRegistry.connect(professional).registerTime(0, timeHash, 8, 100);
      
      expect(await timeRegistry.totalEntries()).to.equal(1);
      expect(await timeRegistry.totalHoursWorked()).to.equal(8);
    });
  });

  describe("Time Entry Updates", function () {
    beforeEach(async function () {
      const timeHash = "ipfs://QmTimeHash123456789";
      await timeRegistry.connect(professional).registerTime(0, timeHash, 8, 100);
    });

    it("Debería permitir actualizar entrada de tiempo", async function () {
      const newTimeHash = "ipfs://QmUpdatedTimeHash123456789";
      const newHoursWorked = 10;
      const newHourlyRate = 120;
      
      await timeRegistry.connect(professional).updateTimeEntry(0, newTimeHash, newHoursWorked, newHourlyRate);
      
      const entry = await timeRegistry.timeEntries(0);
      expect(entry.timeDataHash).to.equal(newTimeHash);
      expect(entry.hoursWorked).to.equal(newHoursWorked);
      expect(entry.hourlyRate).to.equal(newHourlyRate);
      expect(entry.totalAmount).to.equal(newHoursWorked * newHourlyRate);
    });

    it("Debería rechazar actualización de entrada inexistente", async function () {
      const newTimeHash = "ipfs://QmUpdatedTimeHash123456789";
      
      await expect(
        timeRegistry.connect(professional).updateTimeEntry(999, newTimeHash, 10, 120)
      ).to.be.revertedWith("Time entry does not exist");
    });

    it("Debería rechazar actualización por no propietario", async function () {
      const newTimeHash = "ipfs://QmUpdatedTimeHash123456789";
      
      await expect(
        timeRegistry.connect(user1).updateTimeEntry(0, newTimeHash, 10, 120)
      ).to.be.revertedWith("Not entry owner");
    });

    it("Debería rechazar actualización de entrada validada", async function () {
      // Validar la entrada primero
      await timeRegistry.connect(validator).validateTimeEntry(0);
      
      const newTimeHash = "ipfs://QmUpdatedTimeHash123456789";
      
      await expect(
        timeRegistry.connect(professional).updateTimeEntry(0, newTimeHash, 10, 120)
      ).to.be.revertedWith("Entry already validated");
    });
  });

  describe("Time Entry Validation", function () {
    beforeEach(async function () {
      const timeHash = "ipfs://QmTimeHash123456789";
      await timeRegistry.connect(professional).registerTime(0, timeHash, 8, 100);
    });

    it("Debería permitir validar entrada de tiempo", async function () {
      await timeRegistry.connect(validator).validateTimeEntry(0);
      
      const entry = await timeRegistry.timeEntries(0);
      expect(entry.isValidated).to.be.true;
      expect(entry.validatedBy).to.equal(validator.address);
    });

    it("Debería rechazar validación de entrada inexistente", async function () {
      await expect(
        timeRegistry.connect(validator).validateTimeEntry(999)
      ).to.be.revertedWith("Time entry does not exist");
    });

    it("Debería rechazar validación de entrada ya validada", async function () {
      await timeRegistry.connect(validator).validateTimeEntry(0);
      
      await expect(
        timeRegistry.connect(validator).validateTimeEntry(0)
      ).to.be.revertedWith("Entry already validated");
    });

    it("Debería rechazar auto-validación", async function () {
      // Otorgar rol VALIDATOR_ROLE al professional para que pueda intentar auto-validarse
      const validatorRole = await timeRegistry.VALIDATOR_ROLE();
      await timeRegistry.connect(owner).grantRole(validatorRole, professional.address);
      
      await expect(
        timeRegistry.connect(professional).validateTimeEntry(0)
      ).to.be.revertedWith("Cannot validate own time entry");
    });

    it("Debería rechazar validación sin rol VALIDATOR_ROLE", async function () {
      await expect(
        timeRegistry.connect(user1).validateTimeEntry(0)
      ).to.be.reverted;
    });

    it("Debería incrementar contador de entradas validadas", async function () {
      expect(await timeRegistry.totalValidatedEntries()).to.equal(0);
      
      await timeRegistry.connect(validator).validateTimeEntry(0);
      
      expect(await timeRegistry.totalValidatedEntries()).to.equal(1);
    });
  });

  describe("Time Entry Deletion", function () {
    beforeEach(async function () {
      const timeHash = "ipfs://QmTimeHash123456789";
      await timeRegistry.connect(professional).registerTime(0, timeHash, 8, 100);
    });

    it("Debería permitir eliminar entrada no validada por propietario", async function () {
      await timeRegistry.connect(professional).deleteTimeEntry(0);
      
      const entry = await timeRegistry.timeEntries(0);
      expect(entry.professional).to.equal(ethers.ZeroAddress);
    });

    it("Debería permitir eliminar entrada validada por admin", async function () {
      await timeRegistry.connect(validator).validateTimeEntry(0);
      
      await timeRegistry.connect(owner).deleteTimeEntry(0);
      
      const entry = await timeRegistry.timeEntries(0);
      expect(entry.professional).to.equal(ethers.ZeroAddress);
    });

    it("Debería rechazar eliminación de entrada validada por propietario", async function () {
      await timeRegistry.connect(validator).validateTimeEntry(0);
      
      await expect(
        timeRegistry.connect(professional).deleteTimeEntry(0)
      ).to.be.revertedWith("Cannot delete validated entry");
    });

    it("Debería rechazar eliminación por no autorizado", async function () {
      await expect(
        timeRegistry.connect(user1).deleteTimeEntry(0)
      ).to.be.revertedWith("Not authorized");
    });

    it("Debería actualizar contadores al eliminar", async function () {
      expect(await timeRegistry.totalEntries()).to.equal(1);
      expect(await timeRegistry.totalHoursWorked()).to.equal(8);
      
      await timeRegistry.connect(professional).deleteTimeEntry(0);
      
      expect(await timeRegistry.totalEntries()).to.equal(0);
      expect(await timeRegistry.totalHoursWorked()).to.equal(0);
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      const timeHash = "ipfs://QmTimeHash123456789";
      await timeRegistry.connect(professional).registerTime(0, timeHash, 8, 100);
    });

    it("Debería obtener entrada de tiempo por ID", async function () {
      const entry = await timeRegistry.getTimeEntry(0);
      expect(entry.id).to.equal(0);
      expect(entry.professional).to.equal(professional.address);
      expect(entry.skillId).to.equal(0);
    });

    it("Debería rechazar obtener entrada inexistente", async function () {
      await expect(
        timeRegistry.getTimeEntry(999)
      ).to.be.revertedWith("Time entry does not exist");
    });

    it("Debería obtener entradas de un profesional", async function () {
      const entries = await timeRegistry.getProfessionalEntries(professional.address);
      expect(entries).to.include(0n);
      expect(entries.length).to.equal(1);
    });

    it("Debería obtener entradas de una habilidad", async function () {
      const entries = await timeRegistry.getSkillEntries(0);
      expect(entries).to.include(0n);
      expect(entries.length).to.equal(1);
    });
  });
});

