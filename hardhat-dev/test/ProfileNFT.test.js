const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ProfileNFT Contract", function () {
  let ProfileNFT, profileNFT;
  let ProfileRegistry, profileRegistry;
  let SkillSystem, skillSystem;
  let IPFSRegistry, ipfsRegistry;
  let owner, user1, user2;
  let addrs;

  beforeEach(async function () {
    [owner, user1, user2, ...addrs] = await ethers.getSigners();

    // Desplegar IPFSRegistry primero
    IPFSRegistry = await ethers.getContractFactory("IPFSRegistry");
    ipfsRegistry = await IPFSRegistry.deploy();
    await ipfsRegistry.waitForDeployment();

    // Desplegar ProfileRegistry
    ProfileRegistry = await ethers.getContractFactory("ProfileRegistry");
    profileRegistry = await ProfileRegistry.deploy(await ipfsRegistry.getAddress());
    await profileRegistry.waitForDeployment();

    // Desplegar SkillSystem
    SkillSystem = await ethers.getContractFactory("SkillSystem");
    skillSystem = await SkillSystem.deploy(await ipfsRegistry.getAddress());
    await skillSystem.waitForDeployment();

    // Desplegar ProfileNFT
    ProfileNFT = await ethers.getContractFactory("ProfileNFT");
    profileNFT = await ProfileNFT.deploy(await profileRegistry.getAddress(), await skillSystem.getAddress());
    await profileNFT.waitForDeployment();
  });

  describe("Despliegue", function () {
    it("Debería establecer el nombre y símbolo correctos", async function () {
      expect(await profileNFT.name()).to.equal("Musubi Build");
      expect(await profileNFT.symbol()).to.equal("MUSUBUILD");
    });

    it("Debería otorgar roles correctamente al deployer", async function () {
      const DEFAULT_ADMIN_ROLE = await profileNFT.DEFAULT_ADMIN_ROLE();
      const MINTER_ROLE = await profileNFT.MINTER_ROLE();

      expect(await profileNFT.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
      expect(await profileNFT.hasRole(MINTER_ROLE, owner.address)).to.be.true;
    });
  });

  describe("Minting", function () {
    beforeEach(async function () {
      // Registrar perfil para el usuario
      const profileHash = "ipfs://QmProfileHash123456789";
      await ipfsRegistry.connect(owner).storeRecord(profileHash, "sha256hash1", "profiles", "profile");
      await profileRegistry.connect(user1).registerProfile(profileHash, 0);
      await profileRegistry.connect(owner).changeProfileStatus(user1.address, 1); // Active
      await profileRegistry.connect(owner).verifyProfile(user1.address, 100);
    });

    it("Debería permitir mint a usuarios con rol MINTER_ROLE", async function () {
      const tokenURI = "ipfs://QmTokenURI123456789";
      await profileNFT.connect(owner).mintBuild(user1.address, tokenURI);
      
      expect(await profileNFT.balanceOf(user1.address)).to.equal(1);
      const tokenId = await profileNFT.getBuildTokenId(user1.address);
      expect(await profileNFT.tokenURI(tokenId)).to.equal(tokenURI);
    });

    it("Debería rechazar mint de usuarios sin rol MINTER_ROLE", async function () {
      const tokenURI = "ipfs://QmTokenURI123456789";
      await expect(
        profileNFT.connect(user1).mintBuild(user2.address, tokenURI)
      ).to.be.reverted;
    });

    it("Debería rechazar mint duplicado para la misma dirección", async function () {
      const tokenURI = "ipfs://QmTokenURI123456789";
      await profileNFT.connect(owner).mintBuild(user1.address, tokenURI);
      
      await expect(
        profileNFT.connect(owner).mintBuild(user1.address, tokenURI)
      ).to.be.revertedWith("User already has a build");
    });
  });

  describe("Token Management", function () {
    beforeEach(async function () {
      // Registrar perfil para el usuario
      const profileHash = "ipfs://QmProfileHash123456789";
      await ipfsRegistry.connect(owner).storeRecord(profileHash, "sha256hash1", "profiles", "profile");
      await profileRegistry.connect(user1).registerProfile(profileHash, 0);
      await profileRegistry.connect(owner).changeProfileStatus(user1.address, 1); // Active
      await profileRegistry.connect(owner).verifyProfile(user1.address, 100);
      
      const tokenURI = "ipfs://QmTokenURI123456789";
      await profileNFT.connect(owner).mintBuild(user1.address, tokenURI);
    });

    it("Debería obtener el token ID correcto para una dirección", async function () {
      const tokenId = await profileNFT.getBuildTokenId(user1.address);
      expect(tokenId).to.equal(1);
    });

    it("Debería rechazar obtener token ID para dirección sin NFT", async function () {
      const tokenId = await profileNFT.getBuildTokenId(user2.address);
      expect(tokenId).to.equal(0);
    });

    it("Debería verificar correctamente si una dirección tiene NFT", async function () {
      expect(await profileNFT.hasBuild(user1.address)).to.be.true;
      expect(await profileNFT.hasBuild(user2.address)).to.be.false;
    });
  });

  describe("Token URI", function () {
    beforeEach(async function () {
      // Registrar perfil para el usuario
      const profileHash = "ipfs://QmProfileHash123456789";
      await ipfsRegistry.connect(owner).storeRecord(profileHash, "sha256hash1", "profiles", "profile");
      await profileRegistry.connect(user1).registerProfile(profileHash, 0);
      await profileRegistry.connect(owner).changeProfileStatus(user1.address, 1); // Active
      await profileRegistry.connect(owner).verifyProfile(user1.address, 100);
      
      const tokenURI = "ipfs://QmTokenURI123456789";
      await profileNFT.connect(owner).mintBuild(user1.address, tokenURI);
    });

    it("Debería devolver el URI correcto", async function () {
      const tokenId = await profileNFT.getBuildTokenId(user1.address);
      expect(await profileNFT.tokenURI(tokenId)).to.equal("ipfs://QmTokenURI123456789");
    });

    it("Debería rechazar URI para token inexistente", async function () {
      await expect(
        profileNFT.tokenURI(999)
      ).to.be.revertedWith("ERC721: invalid token ID");
    });
  });
});


