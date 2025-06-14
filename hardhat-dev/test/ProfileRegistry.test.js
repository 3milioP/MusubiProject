const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ProfileRegistry Contract", function () {
  let ProfileRegistry;
  let profileRegistry;
  let owner;
  let company;
  let professional;
  let addrs;

  beforeEach(async function () {
    // Obtener los signers de prueba
    [owner, company, professional, ...addrs] = await ethers.getSigners();

    // Desplegar el contrato ProfileRegistry
    ProfileRegistry = await ethers.getContractFactory("ProfileRegistry");
    profileRegistry = await ProfileRegistry.deploy();
    await profileRegistry.deployed();
  });

  describe("Registro de perfiles", function () {
    it("Debería permitir registrar un perfil profesional", async function () {
      await profileRegistry.connect(professional).registerProfessional(
        "John Doe",
        "Software Developer",
        "john@example.com",
        "https://example.com/john"
      );

      const profile = await profileRegistry.getProfessionalProfile(professional.address);
      expect(profile.name).to.equal("John Doe");
      expect(profile.title).to.equal("Software Developer");
      expect(profile.email).to.equal("john@example.com");
      expect(profile.profileUrl).to.equal("https://example.com/john");
      expect(profile.isRegistered).to.equal(true);
    });

    it("Debería permitir registrar un perfil de empresa", async function () {
      await profileRegistry.connect(company).registerCompany(
        "Tech Corp",
        "Technology",
        "contact@techcorp.com",
        "https://techcorp.com"
      );

      const profile = await profileRegistry.getCompanyProfile(company.address);
      expect(profile.name).to.equal("Tech Corp");
      expect(profile.industry).to.equal("Technology");
      expect(profile.email).to.equal("contact@techcorp.com");
      expect(profile.website).to.equal("https://techcorp.com");
      expect(profile.isRegistered).to.equal(true);
    });

    it("No debería permitir registrar un perfil profesional duplicado", async function () {
      await profileRegistry.connect(professional).registerProfessional(
        "John Doe",
        "Software Developer",
        "john@example.com",
        "https://example.com/john"
      );

      await expect(
        profileRegistry.connect(professional).registerProfessional(
          "John Smith",
          "Developer",
          "john@example.com",
          "https://example.com/john"
        )
      ).to.be.revertedWith("Profile already registered");
    });

    it("No debería permitir registrar un perfil de empresa duplicado", async function () {
      await profileRegistry.connect(company).registerCompany(
        "Tech Corp",
        "Technology",
        "contact@techcorp.com",
        "https://techcorp.com"
      );

      await expect(
        profileRegistry.connect(company).registerCompany(
          "Tech Corp 2",
          "IT",
          "info@techcorp.com",
          "https://techcorp.com/info"
        )
      ).to.be.revertedWith("Profile already registered");
    });
  });

  describe("Actualización de perfiles", function () {
    beforeEach(async function () {
      // Registrar perfiles para las pruebas
      await profileRegistry.connect(professional).registerProfessional(
        "John Doe",
        "Software Developer",
        "john@example.com",
        "https://example.com/john"
      );

      await profileRegistry.connect(company).registerCompany(
        "Tech Corp",
        "Technology",
        "contact@techcorp.com",
        "https://techcorp.com"
      );
    });

    it("Debería permitir actualizar un perfil profesional", async function () {
      await profileRegistry.connect(professional).updateProfessionalProfile(
        "John Smith",
        "Senior Developer",
        "johnsmith@example.com",
        "https://example.com/johnsmith"
      );

      const profile = await profileRegistry.getProfessionalProfile(professional.address);
      expect(profile.name).to.equal("John Smith");
      expect(profile.title).to.equal("Senior Developer");
      expect(profile.email).to.equal("johnsmith@example.com");
      expect(profile.profileUrl).to.equal("https://example.com/johnsmith");
    });

    it("Debería permitir actualizar un perfil de empresa", async function () {
      await profileRegistry.connect(company).updateCompanyProfile(
        "Tech Corp International",
        "IT Services",
        "global@techcorp.com",
        "https://techcorp.global"
      );

      const profile = await profileRegistry.getCompanyProfile(company.address);
      expect(profile.name).to.equal("Tech Corp International");
      expect(profile.industry).to.equal("IT Services");
      expect(profile.email).to.equal("global@techcorp.com");
      expect(profile.website).to.equal("https://techcorp.global");
    });

    it("No debería permitir actualizar un perfil profesional no registrado", async function () {
      await expect(
        profileRegistry.connect(addrs[0]).updateProfessionalProfile(
          "Random User",
          "Unknown",
          "random@example.com",
          "https://example.com/random"
        )
      ).to.be.revertedWith("Profile not registered");
    });

    it("No debería permitir actualizar un perfil de empresa no registrado", async function () {
      await expect(
        profileRegistry.connect(addrs[0]).updateCompanyProfile(
          "Fake Corp",
          "Fake Industry",
          "fake@example.com",
          "https://fake.com"
        )
      ).to.be.revertedWith("Profile not registered");
    });
  });

  describe("Verificación de perfiles", function () {
    beforeEach(async function () {
      // Registrar perfiles para las pruebas
      await profileRegistry.connect(professional).registerProfessional(
        "John Doe",
        "Software Developer",
        "john@example.com",
        "https://example.com/john"
      );

      await profileRegistry.connect(company).registerCompany(
        "Tech Corp",
        "Technology",
        "contact@techcorp.com",
        "https://techcorp.com"
      );
    });

    it("Debería verificar correctamente si un profesional está registrado", async function () {
      expect(await profileRegistry.isProfessionalRegistered(professional.address)).to.equal(true);
      expect(await profileRegistry.isProfessionalRegistered(addrs[0].address)).to.equal(false);
    });

    it("Debería verificar correctamente si una empresa está registrada", async function () {
      expect(await profileRegistry.isCompanyRegistered(company.address)).to.equal(true);
      expect(await profileRegistry.isCompanyRegistered(addrs[0].address)).to.equal(false);
    });
  });

  describe("Eventos", function () {
    it("Debería emitir evento al registrar un profesional", async function () {
      await expect(
        profileRegistry.connect(professional).registerProfessional(
          "John Doe",
          "Software Developer",
          "john@example.com",
          "https://example.com/john"
        )
      )
        .to.emit(profileRegistry, "ProfessionalRegistered")
        .withArgs(professional.address, "John Doe");
    });

    it("Debería emitir evento al registrar una empresa", async function () {
      await expect(
        profileRegistry.connect(company).registerCompany(
          "Tech Corp",
          "Technology",
          "contact@techcorp.com",
          "https://techcorp.com"
        )
      )
        .to.emit(profileRegistry, "CompanyRegistered")
        .withArgs(company.address, "Tech Corp");
    });

    it("Debería emitir evento al actualizar un perfil profesional", async function () {
      // Primero registramos el perfil
      await profileRegistry.connect(professional).registerProfessional(
        "John Doe",
        "Software Developer",
        "john@example.com",
        "https://example.com/john"
      );

      // Luego actualizamos y verificamos el evento
      await expect(
        profileRegistry.connect(professional).updateProfessionalProfile(
          "John Smith",
          "Senior Developer",
          "johnsmith@example.com",
          "https://example.com/johnsmith"
        )
      )
        .to.emit(profileRegistry, "ProfessionalProfileUpdated")
        .withArgs(professional.address, "John Smith");
    });

    it("Debería emitir evento al actualizar un perfil de empresa", async function () {
      // Primero registramos el perfil
      await profileRegistry.connect(company).registerCompany(
        "Tech Corp",
        "Technology",
        "contact@techcorp.com",
        "https://techcorp.com"
      );

      // Luego actualizamos y verificamos el evento
      await expect(
        profileRegistry.connect(company).updateCompanyProfile(
          "Tech Corp International",
          "IT Services",
          "global@techcorp.com",
          "https://techcorp.global"
        )
      )
        .to.emit(profileRegistry, "CompanyProfileUpdated")
        .withArgs(company.address, "Tech Corp International");
    });
  });
});
