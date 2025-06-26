const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ProfileRegistry", function () {
  let ProfileRegistry, profileRegistry;
  let IPFSRegistry, ipfsRegistry;
  let owner, user1, user2, verifier;
  let addrs;

  beforeEach(async function () {
    [owner, user1, user2, verifier, ...addrs] = await ethers.getSigners();

    // Desplegar IPFSRegistry primero
    IPFSRegistry = await ethers.getContractFactory("IPFSRegistry");
    ipfsRegistry = await IPFSRegistry.deploy();
    await ipfsRegistry.waitForDeployment();

    // Desplegar ProfileRegistry
    ProfileRegistry = await ethers.getContractFactory("ProfileRegistry");
    profileRegistry = await ProfileRegistry.deploy(await ipfsRegistry.getAddress());
    await profileRegistry.waitForDeployment();

    // Registrar algunos hashes de IPFS para las pruebas
    const profileHash1 = "ipfs://QmProfileHash1";
    const profileHash2 = "ipfs://QmProfileHash2";
    
    await ipfsRegistry.connect(owner).storeRecord(profileHash1, "sha256hash1", "profiles", "profile");
    await ipfsRegistry.connect(owner).storeRecord(profileHash2, "sha256hash2", "profiles", "profile");

    // Otorgar rol VERIFIER_ROLE al verifier
    const verifierRole = await profileRegistry.VERIFIER_ROLE();
    await profileRegistry.connect(owner).grantRole(verifierRole, verifier.address);
  });

  describe("Constructor", function () {
    it("Debería establecer correctamente la dirección de IPFSRegistry", async function () {
      expect(await profileRegistry.ipfsRegistry()).to.equal(await ipfsRegistry.getAddress());
    });

    it("Debería otorgar roles correctamente al deployer", async function () {
      const DEFAULT_ADMIN_ROLE = await profileRegistry.DEFAULT_ADMIN_ROLE();
      const KARMA_ROLE = await profileRegistry.KARMA_ROLE();
      const VERIFIER_ROLE = await profileRegistry.VERIFIER_ROLE();

      expect(await profileRegistry.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
      expect(await profileRegistry.hasRole(KARMA_ROLE, owner.address)).to.be.true;
      expect(await profileRegistry.hasRole(VERIFIER_ROLE, owner.address)).to.be.true;
    });
  });

  describe("Profile Registration", function () {
    it("Debería permitir registrar un perfil", async function () {
      const profileHash = "ipfs://QmProfileHash1";
      
      await profileRegistry.connect(user1).registerProfile(profileHash, 0); // Individual
      
      expect(await profileRegistry.hasRegisteredProfile(user1.address)).to.be.true;
      const profile = await profileRegistry.getProfile(user1.address);
      expect(profile.wallet).to.equal(user1.address);
      expect(profile.profileDataHash).to.equal(profileHash);
      expect(profile.profileType).to.equal(0); // Individual
      expect(profile.status).to.equal(0); // Pending
    });

    it("Debería rechazar registro con hash que no existe en IPFS", async function () {
      const invalidHash = "ipfs://QmInvalidHash";
      
      await expect(
        profileRegistry.connect(user1).registerProfile(invalidHash, 0)
      ).to.be.revertedWith("Profile data not found in IPFS");
    });

    it("Debería rechazar registro duplicado", async function () {
      const profileHash = "ipfs://QmProfileHash1";
      
      await profileRegistry.connect(user1).registerProfile(profileHash, 0);
      
      await expect(
        profileRegistry.connect(user1).registerProfile(profileHash, 1)
      ).to.be.revertedWith("Profile already registered");
    });

    it("Debería rechazar hash vacío", async function () {
      await expect(
        profileRegistry.connect(user1).registerProfile("", 0)
      ).to.be.revertedWith("Profile data hash cannot be empty");
    });
  });

  describe("Profile Verification", function () {
    beforeEach(async function () {
      const profileHash = "ipfs://QmProfileHash1";
      await profileRegistry.connect(user1).registerProfile(profileHash, 0);
      
      // Cambiar el estado del perfil a Active antes de verificar
      await profileRegistry.connect(owner).changeProfileStatus(user1.address, 1); // Active
    });

    it("Debería permitir verificar un perfil", async function () {
      const karmaScore = 100;
      
      await profileRegistry.connect(verifier).verifyProfile(user1.address, karmaScore);
      
      expect(await profileRegistry.hasVerifiedProfile(user1.address)).to.be.true;
      const profile = await profileRegistry.getProfile(user1.address);
      expect(profile.status).to.equal(1); // Active
      expect(profile.karmaScore).to.equal(karmaScore);
      expect(profile.verifiedBy).to.equal(verifier.address);
    });

    it("Debería rechazar verificación de perfil inexistente", async function () {
      await expect(
        profileRegistry.connect(verifier).verifyProfile(user2.address, 100)
      ).to.be.revertedWith("Profile not registered");
    });

    it("Debería rechazar verificación de perfil ya verificado", async function () {
      await profileRegistry.connect(verifier).verifyProfile(user1.address, 100);
      
      await expect(
        profileRegistry.connect(verifier).verifyProfile(user1.address, 200)
      ).to.be.revertedWith("Profile already verified");
    });

    it("Debería rechazar auto-verificación", async function () {
      // Otorgar rol VERIFIER_ROLE al user1 para que pueda intentar auto-verificarse
      const verifierRole = await profileRegistry.VERIFIER_ROLE();
      await profileRegistry.connect(owner).grantRole(verifierRole, user1.address);
      
      await expect(
        profileRegistry.connect(user1).verifyProfile(user1.address, 100)
      ).to.be.revertedWith("Cannot verify own profile");
    });

    it("Debería rechazar verificación sin rol VERIFIER_ROLE", async function () {
      await expect(
        profileRegistry.connect(user2).verifyProfile(user1.address, 100)
      ).to.be.reverted;
    });
  });

  describe("Profile Updates", function () {
    beforeEach(async function () {
      const profileHash = "ipfs://QmProfileHash1";
      await profileRegistry.connect(user1).registerProfile(profileHash, 0);
      await profileRegistry.connect(owner).changeProfileStatus(user1.address, 1); // Active
      await profileRegistry.connect(verifier).verifyProfile(user1.address, 100);
    });

    it("Debería permitir actualizar perfil", async function () {
      const newProfileHash = "ipfs://QmProfileHash2";
      
      await profileRegistry.connect(user1).updateProfile(newProfileHash);
      
      const profile = await profileRegistry.getProfile(user1.address);
      expect(profile.profileDataHash).to.equal(newProfileHash);
      expect(profile.verifiedAt).to.equal(0); // Debería resetear verificación
      expect(await profileRegistry.hasVerifiedProfile(user1.address)).to.be.false;
    });

    it("Debería rechazar actualización con hash inválido", async function () {
      const invalidHash = "ipfs://QmInvalidHash";
      
      await expect(
        profileRegistry.connect(user1).updateProfile(invalidHash)
      ).to.be.revertedWith("Profile data not found in IPFS");
    });

    it("Debería rechazar actualización de perfil no activo", async function () {
      // Suspender el perfil primero
      await profileRegistry.connect(owner).changeProfileStatus(user1.address, 2); // Suspended
      
      const newProfileHash = "ipfs://QmProfileHash2";
      await expect(
        profileRegistry.connect(user1).updateProfile(newProfileHash)
      ).to.be.revertedWith("Profile not active");
    });
  });

  describe("Profile Status Management", function () {
    beforeEach(async function () {
      const profileHash = "ipfs://QmProfileHash1";
      await profileRegistry.connect(user1).registerProfile(profileHash, 0);
      await profileRegistry.connect(owner).changeProfileStatus(user1.address, 1); // Active
      await profileRegistry.connect(verifier).verifyProfile(user1.address, 100);
    });

    it("Debería permitir cambiar estado del perfil", async function () {
      await profileRegistry.connect(owner).changeProfileStatus(user1.address, 2); // Suspended
      
      const profile = await profileRegistry.getProfile(user1.address);
      expect(profile.status).to.equal(2); // Suspended
      expect(await profileRegistry.hasVerifiedProfile(user1.address)).to.be.false;
    });

    it("Debería rechazar cambio de estado sin rol ADMIN", async function () {
      await expect(
        profileRegistry.connect(user1).changeProfileStatus(user1.address, 2)
      ).to.be.reverted;
    });
  });

  describe("Karma Score Management", function () {
    beforeEach(async function () {
      const profileHash = "ipfs://QmProfileHash1";
      await profileRegistry.connect(user1).registerProfile(profileHash, 0);
    });

    it("Debería permitir actualizar karma score", async function () {
      const newKarmaScore = 200;
      
      await profileRegistry.connect(owner).updateKarmaScore(user1.address, newKarmaScore);
      
      const profile = await profileRegistry.getProfile(user1.address);
      expect(profile.karmaScore).to.equal(newKarmaScore);
    });

    it("Debería rechazar actualización de karma sin rol KARMA_ROLE", async function () {
      await expect(
        profileRegistry.connect(user1).updateKarmaScore(user1.address, 200)
      ).to.be.reverted;
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      const profileHash = "ipfs://QmProfileHash1";
      await profileRegistry.connect(user1).registerProfile(profileHash, 0);
    });

    it("Debería obtener perfil completo", async function () {
      const profile = await profileRegistry.getProfile(user1.address);
      expect(profile.wallet).to.equal(user1.address);
      expect(profile.profileDataHash).to.equal("ipfs://QmProfileHash1");
    });

    it("Debería rechazar obtener perfil inexistente", async function () {
      await expect(
        profileRegistry.getProfile(user2.address)
      ).to.be.revertedWith("Profile not registered");
    });

    it("Debería obtener solo el hash de datos del perfil", async function () {
      const hash = await profileRegistry.getProfileDataHash(user1.address);
      expect(hash).to.equal("ipfs://QmProfileHash1");
    });
  });
});

