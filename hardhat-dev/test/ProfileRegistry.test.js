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
    await profileRegistry.waitForDeployment();
  });

  describe("Registro de perfiles", function () {
    it("Debería permitir registrar un perfil profesional", async function () {
      const metadataURI = "ipfs://QmXnnyufdzAWL5CqZ2RnSNgPbvCc1ALT73s6epPrRnZ1Xy";
      
      await profileRegistry.connect(professional).registerProfile(false, metadataURI);

      const profile = await profileRegistry.profiles(professional.address);
      expect(profile.wallet).to.equal(professional.address);
      expect(profile.isActive).to.equal(true);
      expect(profile.isCompany).to.equal(false);
      expect(profile.karma).to.equal(0);
      expect(profile.metadataURI).to.equal(metadataURI);
    });

    it("Debería permitir registrar un perfil de empresa", async function () {
      const metadataURI = "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
      
      await profileRegistry.connect(company).registerProfile(true, metadataURI);

      const profile = await profileRegistry.profiles(company.address);
      expect(profile.wallet).to.equal(company.address);
      expect(profile.isActive).to.equal(true);
      expect(profile.isCompany).to.equal(true);
      expect(profile.karma).to.equal(0);
      expect(profile.metadataURI).to.equal(metadataURI);
    });

    it("No debería permitir registrar un perfil duplicado", async function () {
      const metadataURI = "ipfs://QmXnnyufdzAWL5CqZ2RnSNgPbvCc1ALT73s6epPrRnZ1Xy";
      
      await profileRegistry.connect(professional).registerProfile(false, metadataURI);
      
      await expect(
        profileRegistry.connect(professional).registerProfile(false, metadataURI)
      ).to.be.revertedWith("Profile already exists");
    });

    it("Debería emitir un evento al registrar un perfil", async function () {
      const metadataURI = "ipfs://QmXnnyufdzAWL5CqZ2RnSNgPbvCc1ALT73s6epPrRnZ1Xy";
      
      await expect(profileRegistry.connect(professional).registerProfile(false, metadataURI))
        .to.emit(profileRegistry, "ProfileRegistered")
        .withArgs(professional.address, false);
    });
  });

  describe("Actualización de perfiles", function () {
    beforeEach(async function () {
      const metadataURI = "ipfs://QmXnnyufdzAWL5CqZ2RnSNgPbvCc1ALT73s6epPrRnZ1Xy";
      await profileRegistry.connect(professional).registerProfile(false, metadataURI);
    });

    it("Debería permitir actualizar un perfil existente", async function () {
      const newMetadataURI = "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
      
      await profileRegistry.connect(professional).updateProfile(newMetadataURI);

      const profile = await profileRegistry.profiles(professional.address);
      expect(profile.metadataURI).to.equal(newMetadataURI);
    });

    it("No debería permitir actualizar un perfil no existente", async function () {
      const newMetadataURI = "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
      
      await expect(
        profileRegistry.connect(addrs[0]).updateProfile(newMetadataURI)
      ).to.be.revertedWith("Profile does not exist");
    });

    it("Debería emitir un evento al actualizar un perfil", async function () {
      const newMetadataURI = "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
      
      await expect(profileRegistry.connect(professional).updateProfile(newMetadataURI))
        .to.emit(profileRegistry, "ProfileUpdated")
        .withArgs(professional.address);
    });
  });

  describe("Verificación de perfiles", function () {
    beforeEach(async function () {
      const metadataURI = "ipfs://QmXnnyufdzAWL5CqZ2RnSNgPbvCc1ALT73s6epPrRnZ1Xy";
      await profileRegistry.connect(professional).registerProfile(false, metadataURI);
    });

    it("Debería permitir al verificador verificar un perfil", async function () {
      await profileRegistry.verifyProfile(professional.address);
      
      expect(await profileRegistry.verifiedProfiles(professional.address)).to.be.true;
    });

    it("No debería permitir a usuarios no autorizados verificar perfiles", async function () {
      await expect(
        profileRegistry.connect(professional).verifyProfile(professional.address)
      ).to.be.reverted;
    });

    it("No debería permitir verificar un perfil no existente", async function () {
      await expect(
        profileRegistry.verifyProfile(addrs[0].address)
      ).to.be.revertedWith("Profile does not exist");
    });

    it("No debería permitir verificar un perfil ya verificado", async function () {
      await profileRegistry.verifyProfile(professional.address);
      
      await expect(
        profileRegistry.verifyProfile(professional.address)
      ).to.be.revertedWith("Profile already verified");
    });

    it("Debería emitir un evento al verificar un perfil", async function () {
      await expect(profileRegistry.verifyProfile(professional.address))
        .to.emit(profileRegistry, "ProfileVerified")
        .withArgs(professional.address, owner.address);
    });
  });

  describe("Gestión de karma", function () {
    beforeEach(async function () {
      const metadataURI = "ipfs://QmXnnyufdzAWL5CqZ2RnSNgPbvCc1ALT73s6epPrRnZ1Xy";
      await profileRegistry.connect(professional).registerProfile(false, metadataURI);
      
      // Otorgar rol ADMIN_ROLE al owner para poder actualizar karma
      const ADMIN_ROLE = await profileRegistry.ADMIN_ROLE();
      await profileRegistry.grantRole(ADMIN_ROLE, owner.address);
    });

    it("Debería permitir al admin actualizar el karma", async function () {
      const newKarma = 100;
      
      await profileRegistry.updateKarma(professional.address, newKarma);

      const profile = await profileRegistry.profiles(professional.address);
      expect(profile.karma).to.equal(newKarma);
    });

    it("No debería permitir a usuarios no autorizados actualizar el karma", async function () {
      await expect(
        profileRegistry.connect(professional).updateKarma(professional.address, 100)
      ).to.be.reverted;
    });

    it("No debería permitir actualizar karma de perfil no existente", async function () {
      await expect(
        profileRegistry.updateKarma(addrs[0].address, 100)
      ).to.be.revertedWith("Profile does not exist");
    });
  });
});

