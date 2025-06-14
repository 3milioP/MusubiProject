const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ProfileNFT Contract", function () {
  let ProfileNFT;
  let profileNFT;
  let owner;
  let user1;
  let user2;
  let addrs;

  beforeEach(async function () {
    // Obtener los signers de prueba
    [owner, user1, user2, ...addrs] = await ethers.getSigners();

    // Desplegar el contrato ProfileNFT
    ProfileNFT = await ethers.getContractFactory("ProfileNFT");
    profileNFT = await ProfileNFT.deploy("Musubi Profile", "MUSUBI");
    await profileNFT.deployed();
  });

  describe("Despliegue", function () {
    it("Debería establecer el nombre y símbolo correctos", async function () {
      expect(await profileNFT.name()).to.equal("Musubi Profile");
      expect(await profileNFT.symbol()).to.equal("MUSUBI");
    });

    it("Debería asignar el owner correctamente", async function () {
      expect(await profileNFT.owner()).to.equal(owner.address);
    });
  });

  describe("Minteo de NFTs", function () {
    it("Debería permitir al owner mintear un NFT para un usuario", async function () {
      const tokenURI = "ipfs://QmXnnyufdzAWL5CqZ2RnSNgPbvCc1ALT73s6epPrRnZ1Xy";
      await profileNFT.mintProfile(user1.address, tokenURI);
      
      expect(await profileNFT.balanceOf(user1.address)).to.equal(1);
      expect(await profileNFT.ownerOf(1)).to.equal(user1.address);
      expect(await profileNFT.tokenURI(1)).to.equal(tokenURI);
    });

    it("No debería permitir a usuarios no autorizados mintear NFTs", async function () {
      const tokenURI = "ipfs://QmXnnyufdzAWL5CqZ2RnSNgPbvCc1ALT73s6epPrRnZ1Xy";
      
      await expect(
        profileNFT.connect(user1).mintProfile(user2.address, tokenURI)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Debería incrementar el contador de tokens al mintear", async function () {
      const tokenURI1 = "ipfs://QmXnnyufdzAWL5CqZ2RnSNgPbvCc1ALT73s6epPrRnZ1Xy";
      const tokenURI2 = "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
      
      await profileNFT.mintProfile(user1.address, tokenURI1);
      expect(await profileNFT.totalSupply()).to.equal(1);
      
      await profileNFT.mintProfile(user2.address, tokenURI2);
      expect(await profileNFT.totalSupply()).to.equal(2);
    });

    it("Debería emitir un evento Transfer al mintear un NFT", async function () {
      const tokenURI = "ipfs://QmXnnyufdzAWL5CqZ2RnSNgPbvCc1ALT73s6epPrRnZ1Xy";
      
      await expect(profileNFT.mintProfile(user1.address, tokenURI))
        .to.emit(profileNFT, "Transfer")
        .withArgs(ethers.constants.AddressZero, user1.address, 1);
    });
  });

  describe("Actualización de metadatos", function () {
    let tokenId;
    let initialTokenURI;
    
    beforeEach(async function () {
      initialTokenURI = "ipfs://QmXnnyufdzAWL5CqZ2RnSNgPbvCc1ALT73s6epPrRnZ1Xy";
      await profileNFT.mintProfile(user1.address, initialTokenURI);
      tokenId = 1;
    });

    it("Debería permitir al owner actualizar el URI de un token", async function () {
      const newTokenURI = "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
      await profileNFT.updateProfileURI(tokenId, newTokenURI);
      
      expect(await profileNFT.tokenURI(tokenId)).to.equal(newTokenURI);
    });

    it("No debería permitir a usuarios no autorizados actualizar el URI", async function () {
      const newTokenURI = "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
      
      await expect(
        profileNFT.connect(user1).updateProfileURI(tokenId, newTokenURI)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("No debería permitir actualizar el URI de un token inexistente", async function () {
      const newTokenURI = "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
      
      await expect(
        profileNFT.updateProfileURI(999, newTokenURI)
      ).to.be.revertedWith("ERC721: invalid token ID");
    });

    it("Debería emitir un evento MetadataUpdate al actualizar el URI", async function () {
      const newTokenURI = "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
      
      await expect(profileNFT.updateProfileURI(tokenId, newTokenURI))
        .to.emit(profileNFT, "MetadataUpdate")
        .withArgs(tokenId);
    });
  });

  describe("Transferencia de NFTs", function () {
    let tokenId;
    
    beforeEach(async function () {
      const tokenURI = "ipfs://QmXnnyufdzAWL5CqZ2RnSNgPbvCc1ALT73s6epPrRnZ1Xy";
      await profileNFT.mintProfile(user1.address, tokenURI);
      tokenId = 1;
    });

    it("Debería permitir al propietario transferir su NFT", async function () {
      await profileNFT.connect(user1).transferFrom(user1.address, user2.address, tokenId);
      
      expect(await profileNFT.ownerOf(tokenId)).to.equal(user2.address);
    });

    it("No debería permitir transferir un NFT a una dirección cero", async function () {
      await expect(
        profileNFT.connect(user1).transferFrom(user1.address, ethers.constants.AddressZero, tokenId)
      ).to.be.revertedWith("ERC721: transfer to the zero address");
    });

    it("No debería permitir a usuarios no autorizados transferir un NFT", async function () {
      await expect(
        profileNFT.connect(user2).transferFrom(user1.address, user2.address, tokenId)
      ).to.be.revertedWith("ERC721: caller is not token owner or approved");
    });
  });

  describe("Aprobaciones", function () {
    let tokenId;
    
    beforeEach(async function () {
      const tokenURI = "ipfs://QmXnnyufdzAWL5CqZ2RnSNgPbvCc1ALT73s6epPrRnZ1Xy";
      await profileNFT.mintProfile(user1.address, tokenURI);
      tokenId = 1;
    });

    it("Debería permitir al propietario aprobar a otro usuario para transferir su NFT", async function () {
      await profileNFT.connect(user1).approve(user2.address, tokenId);
      
      expect(await profileNFT.getApproved(tokenId)).to.equal(user2.address);
      
      // El usuario aprobado debería poder transferir el NFT
      await profileNFT.connect(user2).transferFrom(user1.address, user2.address, tokenId);
      expect(await profileNFT.ownerOf(tokenId)).to.equal(user2.address);
    });

    it("Debería permitir al propietario establecer aprobación para todos", async function () {
      await profileNFT.connect(user1).setApprovalForAll(user2.address, true);
      
      expect(await profileNFT.isApprovedForAll(user1.address, user2.address)).to.equal(true);
      
      // El usuario aprobado debería poder transferir cualquier NFT del propietario
      await profileNFT.connect(user2).transferFrom(user1.address, user2.address, tokenId);
      expect(await profileNFT.ownerOf(tokenId)).to.equal(user2.address);
    });

    it("Debería permitir al propietario revocar una aprobación", async function () {
      await profileNFT.connect(user1).approve(user2.address, tokenId);
      expect(await profileNFT.getApproved(tokenId)).to.equal(user2.address);
      
      await profileNFT.connect(user1).approve(ethers.constants.AddressZero, tokenId);
      expect(await profileNFT.getApproved(tokenId)).to.equal(ethers.constants.AddressZero);
    });

    it("Debería permitir al propietario revocar una aprobación para todos", async function () {
      await profileNFT.connect(user1).setApprovalForAll(user2.address, true);
      expect(await profileNFT.isApprovedForAll(user1.address, user2.address)).to.equal(true);
      
      await profileNFT.connect(user1).setApprovalForAll(user2.address, false);
      expect(await profileNFT.isApprovedForAll(user1.address, user2.address)).to.equal(false);
    });
  });

  describe("Consulta de tokens", function () {
    beforeEach(async function () {
      // Mintear varios NFTs para las pruebas
      await profileNFT.mintProfile(user1.address, "ipfs://token1");
      await profileNFT.mintProfile(user1.address, "ipfs://token2");
      await profileNFT.mintProfile(user2.address, "ipfs://token3");
    });

    it("Debería devolver el balance correcto de tokens para cada usuario", async function () {
      expect(await profileNFT.balanceOf(user1.address)).to.equal(2);
      expect(await profileNFT.balanceOf(user2.address)).to.equal(1);
      expect(await profileNFT.balanceOf(addrs[0].address)).to.equal(0);
    });

    it("Debería devolver el token URI correcto para cada token", async function () {
      expect(await profileNFT.tokenURI(1)).to.equal("ipfs://token1");
      expect(await profileNFT.tokenURI(2)).to.equal("ipfs://token2");
      expect(await profileNFT.tokenURI(3)).to.equal("ipfs://token3");
    });

    it("Debería fallar al consultar el URI de un token inexistente", async function () {
      await expect(
        profileNFT.tokenURI(999)
      ).to.be.revertedWith("ERC721: invalid token ID");
    });

    it("Debería devolver el total de tokens minteados", async function () {
      expect(await profileNFT.totalSupply()).to.equal(3);
    });
  });

  describe("Funciones de administración", function () {
    it("Debería permitir transferir la propiedad del contrato", async function () {
      await profileNFT.transferOwnership(user1.address);
      expect(await profileNFT.owner()).to.equal(user1.address);
      
      // El nuevo propietario debería poder mintear NFTs
      await profileNFT.connect(user1).mintProfile(user2.address, "ipfs://newOwnerMint");
      expect(await profileNFT.ownerOf(1)).to.equal(user2.address);
    });

    it("No debería permitir a usuarios no autorizados transferir la propiedad", async function () {
      await expect(
        profileNFT.connect(user1).transferOwnership(user2.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("No debería permitir transferir la propiedad a la dirección cero", async function () {
      await expect(
        profileNFT.transferOwnership(ethers.constants.AddressZero)
      ).to.be.revertedWith("Ownable: new owner is the zero address");
    });
  });
});
