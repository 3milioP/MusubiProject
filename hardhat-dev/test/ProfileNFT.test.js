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
    profileNFT = await ProfileNFT.deploy(); // Sin parámetros
    await profileNFT.waitForDeployment();
  });

  describe("Despliegue", function () {
    it("Debería establecer el nombre y símbolo correctos", async function () {
      expect(await profileNFT.name()).to.equal("Musubi Profile");
      expect(await profileNFT.symbol()).to.equal("MUSUPROF");
    });

    it("Debería asignar los roles correctamente", async function () {
      const DEFAULT_ADMIN_ROLE = await profileNFT.DEFAULT_ADMIN_ROLE();
      const MINTER_ROLE = await profileNFT.MINTER_ROLE();
      
      expect(await profileNFT.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
      expect(await profileNFT.hasRole(MINTER_ROLE, owner.address)).to.be.true;
    });
  });

  describe("Minteo de NFTs", function () {
      it("Debería permitir al minter mintear un NFT para un usuario", async function () {
        const tokenURI = "ipfs://QmXnnyufdzAWL5CqZ2RnSNgPbvCc1ALT73s6epPrRnZ1Xy";
        await profileNFT.safeMint(user1.address, tokenURI);

        const tokenId = await profileNFT.getProfileTokenId(user1.address);
        expect(tokenId).to.be.gt(0);  // tokenId debe ser 1 o más

        expect(await profileNFT.balanceOf(user1.address)).to.equal(1);
        expect(await profileNFT.ownerOf(tokenId)).to.equal(user1.address);
        expect(await profileNFT.tokenURI(tokenId)).to.equal(tokenURI);
      });


    it("No debería permitir a usuarios no autorizados mintear NFTs", async function () {
      const tokenURI = "ipfs://QmXnnyufdzAWL5CqZ2RnSNgPbvCc1ALT73s6epPrRnZ1Xy";
      
      await expect(
        profileNFT.connect(user1).safeMint(user2.address, tokenURI)
      ).to.be.reverted;
    });

    it("Debería incrementar el contador de tokens al mintear", async function () {
      const tokenURI1 = "ipfs://QmXnnyufdzAWL5CqZ2RnSNgPbvCc1ALT73s6epPrRnZ1Xy";
      const tokenURI2 = "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";

      await profileNFT.safeMint(user1.address, tokenURI1);
      expect(await profileNFT.totalSupply()).to.equal(1);

      await profileNFT.safeMint(user2.address, tokenURI2);
      expect(await profileNFT.totalSupply()).to.equal(2); 
    });


    it("Debería emitir un evento Transfer al mintear un NFT", async function () {
      const tokenURI = "ipfs://QmXnnyufdzAWL5CqZ2RnSNgPbvCc1ALT73s6epPrRnZ1Xy";
      const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

      const tx = await profileNFT.safeMint(user1.address, tokenURI);
      const tokenId = await profileNFT.getProfileTokenId(user1.address);

      await expect(tx)
        .to.emit(profileNFT, "Transfer")
        .withArgs(ZERO_ADDRESS, user1.address, tokenId);
    });

    it("Debería actualizar el URI si el usuario ya tiene un NFT", async function () {
      const tokenURI1 = "ipfs://QmXnnyufdzAWL5CqZ2RnSNgPbvCc1ALT73s6epPrRnZ1Xy";
      const tokenURI2 = "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
      
      // Primer mint
      await profileNFT.safeMint(user1.address, tokenURI1);
      const tokenId = await profileNFT.getProfileTokenId(user1.address);
      
      expect(tokenId).to.be.gt(0); // Verifica que tokenId es válido
      expect(await profileNFT.tokenURI(tokenId)).to.equal(tokenURI1);
      expect(await profileNFT.balanceOf(user1.address)).to.equal(1);
      
      // Segundo mint al mismo usuario debería actualizar URI
      await profileNFT.safeMint(user1.address, tokenURI2);
      expect(await profileNFT.tokenURI(tokenId)).to.equal(tokenURI2);
      expect(await profileNFT.balanceOf(user1.address)).to.equal(1); // Solo un NFT
    });
  });

  describe("Actualización de metadatos", function () {
    beforeEach(async function () {
      const initialTokenURI = "ipfs://QmXnnyufdzAWL5CqZ2RnSNgPbvCc1ALT73s6epPrRnZ1Xy";
      await profileNFT.safeMint(user1.address, initialTokenURI);
    });

    it("Debería permitir al minter actualizar el URI de un perfil existente", async function () {
      const newTokenURI = "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
      await profileNFT.updateProfileURI(user1.address, newTokenURI);
      
      const tokenId = await profileNFT.getProfileTokenId(user1.address);
      expect(await profileNFT.tokenURI(tokenId)).to.equal(newTokenURI);
    });

    it("No debería permitir a usuarios no autorizados actualizar el URI", async function () {
      const newTokenURI = "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
      
      await expect(
        profileNFT.connect(user1).updateProfileURI(user1.address, newTokenURI)
      ).to.be.reverted;
    });

    it("No debería permitir actualizar el URI de un perfil inexistente", async function () {
      const newTokenURI = "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
      
      await expect(
        profileNFT.updateProfileURI(user2.address, newTokenURI)
      ).to.be.revertedWith("Profile NFT does not exist");
    });
  });

  describe("Quemado de NFTs", function () {
  let tokenId;

    beforeEach(async function () {
      const tokenURI = "ipfs://QmXnnyufdzAWL5CqZ2RnSNgPbvCc1ALT73s6epPrRnZ1Xy";
      await profileNFT.safeMint(user1.address, tokenURI);
      tokenId = await profileNFT.getProfileTokenId(user1.address); // ¡usar el real tokenId, no 0!
    });

    it("Debería permitir al propietario quemar su NFT", async function () {
      await profileNFT.connect(user1).burn(tokenId);

      expect(await profileNFT.balanceOf(user1.address)).to.equal(0);
      await expect(profileNFT.ownerOf(tokenId)).to.be.revertedWith("ERC721: invalid token ID");
    });

    it("Debería permitir al minter quemar cualquier NFT", async function () {
      await profileNFT.burn(tokenId);

      expect(await profileNFT.balanceOf(user1.address)).to.equal(0);
      await expect(profileNFT.ownerOf(tokenId)).to.be.revertedWith("ERC721: invalid token ID");
    });

    it("No debería permitir a usuarios no autorizados quemar NFTs", async function () {
      await expect(
        profileNFT.connect(user2).burn(tokenId)
      ).to.be.revertedWith("Not owner or approved or minter");
    });
  });

});

