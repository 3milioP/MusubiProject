const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ProfileRegistry Contract", function () {
  let ProfileRegistry;
  let profileRegistry;
  let owner;
  let professional;
  let company;
  let verifier;
  let addrs;
  const metadataURI = "ipfs://QmXnnyufdzAWL5CqZ2RnSNgPbvCc1ALT73s6epPrRnZ1Xy";

  beforeEach(async function () {
    [owner, professional, company, verifier, ...addrs] = await ethers.getSigners();

    ProfileRegistry = await ethers.getContractFactory("ProfileRegistry");
    profileRegistry = await ProfileRegistry.deploy();
    await profileRegistry.waitForDeployment();

    // Otorgar rol VERIFIER_ROLE al verifier
    await profileRegistry.connect(owner).grantRole(await profileRegistry.VERIFIER_ROLE(), verifier.address);
  });

  describe("Registro de perfiles", function () {
    it("Debería permitir registrar un perfil profesional", async function () {
      await profileRegistry.connect(professional).registerProfile("Juan Pérez", "Desarrollador", metadataURI, 0, true); // ProfileType.Professional
      
      const profile = await profileRegistry.profiles(professional.address);
      expect(profile.name).to.equal("Juan Pérez");
      expect(profile.description).to.equal("Desarrollador");
      expect(profile.metadataURI).to.equal(metadataURI);
      expect(profile.profileType).to.equal(0); // Professional
      expect(profile.isVerified).to.equal(false);
      expect(profile.disclaimerAccepted).to.equal(true);
    });

    it("Debería permitir registrar un perfil de empresa", async function () {
      await profileRegistry.connect(company).registerProfile("TechCorp", "Empresa de software", metadataURI, 1, true); // ProfileType.Company
      
      const profile = await profileRegistry.profiles(company.address);
      expect(profile.name).to.equal("TechCorp");
      expect(profile.description).to.equal("Empresa de software");
      expect(profile.metadataURI).to.equal(metadataURI);
      expect(profile.profileType).to.equal(1); // Company
      expect(profile.isVerified).to.equal(false);
      expect(profile.disclaimerAccepted).to.equal(true);
    });

    it("No debería permitir registrar un perfil duplicado", async function () {
      await profileRegistry.connect(professional).registerProfile("Juan Pérez", "Desarrollador", metadataURI, 0, true);
      
      await expect(
        profileRegistry.connect(professional).registerProfile("Juan Pérez", "Desarrollador", metadataURI, 0, true)
      ).to.be.revertedWith("Profile already exists");
    });

    it("Debería emitir un evento al registrar un perfil", async function () {
      await expect(profileRegistry.connect(professional).registerProfile("Juan Pérez", "Desarrollador", metadataURI, 0, true))
        .to.emit(profileRegistry, "ProfileRegistered")
        .withArgs(0, professional.address, 0); // profileId, wallet, profileType
    });

    it("No debería permitir registrar sin aceptar el disclaimer", async function () {
      await expect(
        profileRegistry.connect(professional).registerProfile("Juan Pérez", "Desarrollador", metadataURI, 0, false)
      ).to.be.revertedWith("Disclaimer must be accepted");
    });
  });

  describe("Actualización de perfiles", function () {
    beforeEach(async function () {
      await profileRegistry.connect(professional).registerProfile("Juan Pérez", "Desarrollador", metadataURI, 0, true);
    });

    it("Debería permitir actualizar un perfil existente", async function () {
      await profileRegistry.connect(professional).updateProfile("Juan Pérez Actualizado", "Senior Developer", "ipfs://new-metadata");
      
      const profile = await profileRegistry.profiles(professional.address);
      expect(profile.name).to.equal("Juan Pérez Actualizado");
      expect(profile.description).to.equal("Senior Developer");
      expect(profile.metadataURI).to.equal("ipfs://new-metadata");
    });

    it("No debería permitir actualizar un perfil no existente", async function () {
      await expect(
        profileRegistry.connect(company).updateProfile("Nuevo Nombre", "Nueva Descripción", "ipfs://new-metadata")
      ).to.be.revertedWith("Profile not found");
    });

    it("No debería permitir actualizar con nombre vacío", async function () {
      await expect(
        profileRegistry.connect(professional).updateProfile("", "Descripción", "ipfs://metadata")
      ).to.be.revertedWith("Name cannot be empty");
    });
  });

  describe("Verificación de perfiles", function () {
    beforeEach(async function () {
      await profileRegistry.connect(professional).registerProfile("Juan Pérez", "Desarrollador", metadataURI, 0, true);
    });

    it("Debería permitir al verificador verificar un perfil", async function () {
      await profileRegistry.connect(verifier).verifyProfile(professional.address);
      
      const profile = await profileRegistry.profiles(professional.address);
      expect(profile.isVerified).to.equal(true);
      expect(profile.verifiedBy).to.equal(verifier.address);
    });

    it("No debería permitir a usuarios no autorizados verificar perfiles", async function () {
      await expect(
        profileRegistry.connect(company).verifyProfile(professional.address)
      ).to.be.revertedWith("AccessControl: account 0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc is missing role 0x0ce23c3e399818cfee81a7ab0880f714e53d7672b08df0fa62f2843416e1ea09");
    });

    it("No debería permitir verificar un perfil no existente", async function () {
      await expect(
        profileRegistry.connect(verifier).verifyProfile(company.address)
      ).to.be.revertedWith("Profile not found");
    });

    it("No debería permitir verificar un perfil ya verificado", async function () {
      await profileRegistry.connect(verifier).verifyProfile(professional.address);
      
      await expect(
        profileRegistry.connect(verifier).verifyProfile(professional.address)
      ).to.be.revertedWith("Profile already verified");
    });

    it("No debería permitir verificar el propio perfil", async function () {
      // Usar una dirección diferente para evitar duplicado y asegurar rol
      const [owner, professional, company, verifier, newProfessional] = await ethers.getSigners();
      await profileRegistry.connect(newProfessional).registerProfile("María García", "Tech Lead", metadataURI, 0, true);
      await profileRegistry.connect(owner).grantRole(await profileRegistry.VERIFIER_ROLE(), newProfessional.address);
      await expect(
        profileRegistry.connect(newProfessional).verifyProfile(newProfessional.address)
      ).to.be.revertedWith("Cannot verify own profile");
    });

    it("Debería emitir un evento al verificar un perfil", async function () {
      await expect(profileRegistry.connect(verifier).verifyProfile(professional.address))
        .to.emit(profileRegistry, "ProfileVerified")
        .withArgs(0, professional.address, verifier.address);
    });
  });

  describe("Gestión de karma", function () {
    beforeEach(async function () {
      await profileRegistry.connect(professional).registerProfile("Juan Pérez", "Desarrollador", metadataURI, 0, true);
      
      // Otorgar rol ADMIN_ROLE al owner para poder actualizar karma
      const karmaRole = await profileRegistry.KARMA_ROLE();
      await profileRegistry.grantRole(karmaRole, owner.address);
    });

    it("Debería permitir al admin actualizar el karma", async function () {
      await profileRegistry.connect(owner).updateKarma(professional.address, 100);
      
      const profile = await profileRegistry.profiles(professional.address);
      expect(profile.karma).to.equal(100);
    });

    it("No debería permitir a usuarios no autorizados actualizar el karma", async function () {
      await expect(
        profileRegistry.connect(company).updateKarma(professional.address, 100)
      ).to.be.revertedWith("AccessControl: account 0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc is missing role 0x1f4a8853fae4baa0116250328da4015ef744ff86f81340bbdcffb0cfaeaa0bd3");
    });

    it("No debería permitir actualizar karma de perfil no existente", async function () {
      await expect(
        profileRegistry.connect(owner).updateKarma(company.address, 100)
      ).to.be.revertedWith("Profile not found");
    });

    it("Debería emitir un evento al actualizar el karma", async function () {
      await expect(profileRegistry.connect(owner).updateKarma(professional.address, 100))
        .to.emit(profileRegistry, "KarmaUpdated")
        .withArgs(0, professional.address, 100);
    });
  });

  describe("Consultas", function () {
    beforeEach(async function () {
      await profileRegistry.connect(professional).registerProfile("Juan Pérez", "Desarrollador", metadataURI, 0, true);
      await profileRegistry.connect(company).registerProfile("TechCorp", "Empresa de software", metadataURI, 1, true);
    });

    it("Debería verificar si una dirección tiene un perfil", async function () {
      expect(await profileRegistry.hasProfile(professional.address)).to.equal(true);
      expect(await profileRegistry.hasProfile(verifier.address)).to.equal(false);
    });

    it("Debería verificar si una dirección tiene un perfil verificado", async function () {
      expect(await profileRegistry.hasVerifiedProfile(professional.address)).to.equal(false);
      
      await profileRegistry.connect(verifier).verifyProfile(professional.address);
      expect(await profileRegistry.hasVerifiedProfile(professional.address)).to.equal(true);
    });

    it("Debería obtener todos los perfiles", async function () {
      const profiles = await profileRegistry.getAllProfiles();
      expect(profiles).to.include(professional.address);
      expect(profiles).to.include(company.address);
      expect(profiles.length).to.equal(2);
    });

    it("Debería obtener perfiles por tipo", async function () {
      const professionals = await profileRegistry.getProfilesByType(0); // Professional
      const companies = await profileRegistry.getProfilesByType(1); // Company
      
      expect(professionals).to.include(professional.address);
      expect(companies).to.include(company.address);
      expect(professionals.length).to.equal(1);
      expect(companies.length).to.equal(1);
    });
  });

  describe("Control de acceso", function () {
    it("Debería verificar que el owner tiene el rol DEFAULT_ADMIN_ROLE", async function () {
      expect(await profileRegistry.hasRole(await profileRegistry.DEFAULT_ADMIN_ROLE(), owner.address)).to.equal(true);
    });

    it("Debería verificar que el owner tiene el rol VERIFIER_ROLE", async function () {
      expect(await profileRegistry.hasRole(await profileRegistry.VERIFIER_ROLE(), owner.address)).to.equal(true);
    });

    it("Debería verificar que el owner tiene el rol KARMA_ROLE", async function () {
      expect(await profileRegistry.hasRole(await profileRegistry.KARMA_ROLE(), owner.address)).to.equal(true);
    });

    it("Debería permitir otorgar roles a otros usuarios", async function () {
      await profileRegistry.connect(owner).grantRole(await profileRegistry.VERIFIER_ROLE(), verifier.address);
      expect(await profileRegistry.hasRole(await profileRegistry.VERIFIER_ROLE(), verifier.address)).to.equal(true);
    });
  });

  describe("Pausabilidad", function () {
    it("Debería permitir al admin pausar el contrato", async function () {
      await profileRegistry.connect(owner).pause();
      expect(await profileRegistry.paused()).to.equal(true);
    });

    it("No debería permitir registrar perfiles cuando está pausado", async function () {
      await profileRegistry.connect(owner).pause();
      
      await expect(
        profileRegistry.connect(professional).registerProfile("Juan Pérez", "Desarrollador", metadataURI, 0, true)
      ).to.be.revertedWith("Pausable: paused");
    });

    it("Debería permitir al admin despausar el contrato", async function () {
      await profileRegistry.connect(owner).pause();
      await profileRegistry.connect(owner).unpause();
      expect(await profileRegistry.paused()).to.equal(false);
    });
  });
});

