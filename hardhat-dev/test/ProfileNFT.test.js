const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ProfileNFT Contract", function () {
  let ProfileNFT;
  let ProfileRegistry;
  let profileNFT;
  let profileRegistry;
  let owner;
  let user;
  let minter;
  let addrs;

  beforeEach(async function () {
    [owner, user, minter, ...addrs] = await ethers.getSigners();

    const ProfileRegistry = await ethers.getContractFactory("ProfileRegistry");
    profileRegistry = await ProfileRegistry.deploy();
    await profileRegistry.waitForDeployment();

    const ProfileNFT = await ethers.getContractFactory("ProfileNFT");
    profileNFT = await ProfileNFT.deploy(profileRegistry.target, ethers.ZeroAddress);
    await profileNFT.waitForDeployment();

    // Registrar y verificar perfil
    const metadataURI = "ipfs://QmXnnyufdzAWL5CqZ2RnSNgPbvCc1ALT73s6epPrRnZ1Xy";
    await profileRegistry.connect(user).registerProfile("Juan Pérez", "Desarrollador", metadataURI, 0, true);
    await profileRegistry.connect(owner).verifyProfile(user.address);
    
    // Otorgar rol MINTER_ROLE al minter
    await profileNFT.connect(owner).grantRole(await profileNFT.MINTER_ROLE(), minter.address);
    
    // Otorgar rol EVOLVER_ROLE al minter también
    await profileNFT.connect(owner).grantRole(await profileNFT.EVOLVER_ROLE(), minter.address);
  });

  describe("Despliegue", function () {
    it("Debería establecer el nombre y símbolo correctos", async function () {
      expect(await profileNFT.name()).to.equal("Musubi Build");
      expect(await profileNFT.symbol()).to.equal("MUSUBUILD");
    });

    it("Debería asignar los roles correctamente", async function () {
      const minterRole = await profileNFT.MINTER_ROLE();
      const evolverRole = await profileNFT.EVOLVER_ROLE();
      
      expect(await profileNFT.hasRole(minterRole, owner.address)).to.be.true;
      expect(await profileNFT.hasRole(evolverRole, owner.address)).to.be.true;
    });
  });

  describe("Minteo de builds", function () {
    it("Debería permitir al minter mintear un build para un usuario verificado", async function () {
      const metadataURI = "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
      await profileNFT.connect(owner).mintBuild(user.address, metadataURI);
      const tokenId = await profileNFT.getBuildTokenId(user.address);
      expect(await profileNFT.balanceOf(user.address)).to.equal(1);
      expect(await profileNFT.tokenURI(tokenId)).to.equal(metadataURI);
    });

    it("No debería permitir a usuarios no autorizados mintear builds", async function () {
      const metadataURI = "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
      await expect(
        profileNFT.connect(user).mintBuild(user.address, metadataURI)
      ).to.be.reverted;
    });

    it("Debería incrementar el contador de tokens al mintear", async function () {
      const metadataURI = "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
      await profileNFT.connect(owner).mintBuild(user.address, metadataURI);
      expect(await profileNFT.balanceOf(user.address)).to.equal(1);
    });

    it("Debería emitir un evento Transfer al mintear un build", async function () {
      const metadataURI = "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
      // Minteamos y capturamos el tokenId real
      const tx = await profileNFT.connect(owner).mintBuild(user.address, metadataURI);
      const tokenId = await profileNFT.getBuildTokenId(user.address);
      await expect(tx)
        .to.emit(profileNFT, "Transfer")
        .withArgs(ethers.ZeroAddress, user.address, tokenId);
    });

    it("Debería actualizar el URI si el usuario ya tiene un build", async function () {
      const metadataURI1 = "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
      const metadataURI2 = "ipfs://QmZwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdH";
      const testUser = addrs[7];
      const testMetadataURI = "ipfs://QmXnnyufdzAWL5CqZ2RnSNgPbvCc1ALT73s6epPrRnZ1Xy";
      await profileRegistry.connect(testUser).registerProfile("Test User", "Tester", testMetadataURI, 0, true);
      await profileRegistry.connect(owner).verifyProfile(testUser.address);
      expect(await profileNFT.hasBuild(testUser.address)).to.be.false;
      await profileNFT.connect(owner).mintBuild(testUser.address, metadataURI1);
      expect(await profileNFT.hasBuild(testUser.address)).to.be.true;
      await expect(
        profileNFT.connect(owner).mintBuild(testUser.address, metadataURI2)
      ).to.be.revertedWith("User already has a build");
    });
  });

  describe("Evolución de builds", function () {
    let evolutionUser;
    beforeEach(async function () {
      evolutionUser = addrs[2];
      const metadataURI = "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
      const testMetadataURI = "ipfs://QmXnnyufdzAWL5CqZ2RnSNgPbvCc1ALT73s6epPrRnZ1Xy";
      await profileRegistry.connect(evolutionUser).registerProfile("Evolution User", "Evolver", testMetadataURI, 0, true);
      await profileRegistry.connect(owner).verifyProfile(evolutionUser.address);
      await profileNFT.connect(owner).mintBuild(evolutionUser.address, metadataURI);
    });
    it("Debería permitir al evolver evolucionar un build", async function () {
      await profileNFT.connect(owner).evolveBuild(evolutionUser.address);
      const build = await profileNFT.getUserBuild(evolutionUser.address);
      expect(build.lastUpdated).to.be.gt(0);
    });
    it("No debería permitir a usuarios no autorizados evolucionar builds", async function () {
      await expect(
        profileNFT.connect(evolutionUser).evolveBuild(evolutionUser.address)
      ).to.be.reverted;
    });
  });

  describe("Actualización de metadatos", function () {
    let metadataUser;
    beforeEach(async function () {
      metadataUser = addrs[3];
      const metadataURI = "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
      const testMetadataURI = "ipfs://QmXnnyufdzAWL5CqZ2RnSNgPbvCc1ALT73s6epPrRnZ1Xy";
      await profileRegistry.connect(metadataUser).registerProfile("Metadata User", "Metadata", testMetadataURI, 0, true);
      await profileRegistry.connect(owner).verifyProfile(metadataUser.address);
      await profileNFT.connect(owner).mintBuild(metadataUser.address, metadataURI);
    });
    it("Debería permitir al propietario actualizar el metadataURI", async function () {
      const newMetadataURI = "ipfs://QmZwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdH";
      const tokenId = await profileNFT.getBuildTokenId(metadataUser.address);
      await profileNFT.connect(metadataUser).updateBuildMetadata(tokenId, newMetadataURI);
      expect(await profileNFT.tokenURI(tokenId)).to.equal(newMetadataURI);
    });
    it("No debería permitir a usuarios no autorizados actualizar el metadataURI", async function () {
      const newMetadataURI = "ipfs://QmZwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdH";
      const tokenId = await profileNFT.getBuildTokenId(metadataUser.address);
      await expect(
        profileNFT.connect(addrs[0]).updateBuildMetadata(tokenId, newMetadataURI)
      ).to.be.reverted;
    });
    it("No debería permitir actualizar el metadataURI de un build inexistente", async function () {
      const newMetadataURI = "ipfs://QmZwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdH";
      await expect(
        profileNFT.connect(metadataUser).updateBuildMetadata(999, newMetadataURI)
      ).to.be.reverted;
    });
  });

  describe("Consulta de builds", function () {
    let queryUser;
    beforeEach(async function () {
      queryUser = addrs[4];
      const metadataURI = "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
      const testMetadataURI = "ipfs://QmXnnyufdzAWL5CqZ2RnSNgPbvCc1ALT73s6epPrRnZ1Xy";
      await profileRegistry.connect(queryUser).registerProfile("Query User", "Query", testMetadataURI, 0, true);
      await profileRegistry.connect(owner).verifyProfile(queryUser.address);
      await profileNFT.connect(owner).mintBuild(queryUser.address, metadataURI);
    });
    it("Debería obtener el build de un usuario", async function () {
      const build = await profileNFT.getUserBuild(queryUser.address);
      expect(build.user).to.equal(queryUser.address);
      const tokenId = await profileNFT.getBuildTokenId(queryUser.address);
      expect(build.tokenId).to.equal(tokenId);
      expect(build.metadataURI).to.equal("ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG");
    });
    it("Debería verificar si un usuario tiene un build", async function () {
      expect(await profileNFT.hasBuild(queryUser.address)).to.be.true;
      const userWithoutBuild = addrs[5];
      expect(await profileNFT.hasBuild(userWithoutBuild.address)).to.be.false;
    });
    it("Debería obtener el ID del token de build de un usuario", async function () {
      const tokenId = await profileNFT.getBuildTokenId(queryUser.address);
      expect(tokenId).to.be.a("bigint");
      expect(tokenId).to.be.gte(0n);
    });
  });

  describe("Quemado de builds", function () {
    let burnUser;
    beforeEach(async function () {
      burnUser = addrs[6];
      const metadataURI = "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
      const testMetadataURI = "ipfs://QmXnnyufdzAWL5CqZ2RnSNgPbvCc1ALT73s6epPrRnZ1Xy";
      await profileRegistry.connect(burnUser).registerProfile("Burn User", "Burn", testMetadataURI, 0, true);
      await profileRegistry.connect(owner).verifyProfile(burnUser.address);
      await profileNFT.connect(owner).mintBuild(burnUser.address, metadataURI);
    });
    it("Debería permitir al propietario quemar su build", async function () {
      const tokenId = await profileNFT.getBuildTokenId(burnUser.address);
      await profileNFT.connect(burnUser).burnBuild(tokenId);
      expect(await profileNFT.balanceOf(burnUser.address)).to.equal(0);
    });
    it("Debería permitir al minter quemar cualquier build", async function () {
      const tokenId = await profileNFT.getBuildTokenId(burnUser.address);
      await profileNFT.connect(owner).burnBuild(tokenId);
      expect(await profileNFT.balanceOf(burnUser.address)).to.equal(0);
    });
    it("No debería permitir a usuarios no autorizados quemar builds", async function () {
      const tokenId = await profileNFT.getBuildTokenId(burnUser.address);
      await expect(
        profileNFT.connect(addrs[0]).burnBuild(tokenId)
      ).to.be.reverted;
    });
  });

  describe("Gestión de pausas", function () {
    it("Debería permitir al admin pausar el contrato", async function () {
      await profileNFT.connect(owner).pause();
      expect(await profileNFT.paused()).to.be.true;
    });

    it("No debería permitir mintear builds cuando está pausado", async function () {
      await profileNFT.connect(owner).pause();
      
      const metadataURI = "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
      
      await expect(
        profileNFT.connect(owner).mintBuild(user.address, metadataURI)
      ).to.be.revertedWith("Pausable: paused");
    });

    it("Debería permitir al admin despausar el contrato", async function () {
      await profileNFT.connect(owner).pause();
      await profileNFT.connect(owner).unpause();
      expect(await profileNFT.paused()).to.be.false;
    });
  });
});

