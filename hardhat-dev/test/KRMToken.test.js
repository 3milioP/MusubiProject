const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("KRMToken", function () {
  let KRMToken, krmToken;
  let owner, treasury, user1, user2;
  let addrs;

  beforeEach(async function () {
    [owner, treasury, user1, user2, ...addrs] = await ethers.getSigners();

    KRMToken = await ethers.getContractFactory("KRMToken");
    krmToken = await KRMToken.deploy(treasury.address);
    await krmToken.waitForDeployment();
  });

  describe("Constructor", function () {
    it("Debería establecer correctamente el treasury wallet", async function () {
      expect(await krmToken.treasuryWallet()).to.equal(treasury.address);
    });

    it("Debería otorgar roles correctamente al deployer", async function () {
      const DEFAULT_ADMIN_ROLE = await krmToken.DEFAULT_ADMIN_ROLE();
      const PAUSER_ROLE = await krmToken.PAUSER_ROLE();
      const MINTER_ROLE = await krmToken.MINTER_ROLE();

      expect(await krmToken.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
      expect(await krmToken.hasRole(PAUSER_ROLE, owner.address)).to.be.true;
      expect(await krmToken.hasRole(MINTER_ROLE, owner.address)).to.be.true;
    });

    it("Debería hacer mint inicial del 10% al treasury", async function () {
      const maxSupply = await krmToken.MAX_SUPPLY();
      const expectedInitialMint = maxSupply / 10n;
      expect(await krmToken.balanceOf(treasury.address)).to.equal(expectedInitialMint);
    });
  });

  describe("Minting", function () {
    it("Debería permitir mint a usuarios con rol MINTER_ROLE", async function () {
      const amount = ethers.parseEther("1000");
      await krmToken.connect(owner).mint(user1.address, amount);
      expect(await krmToken.balanceOf(user1.address)).to.equal(amount);
    });

    it("Debería rechazar mint si excede el max supply", async function () {
      const maxSupply = await krmToken.MAX_SUPPLY();
      const currentSupply = await krmToken.totalSupply();
      const remainingSupply = maxSupply - currentSupply;
      
      // Intentar mint más del supply restante
      await expect(
        krmToken.connect(owner).mint(user1.address, remainingSupply + 1n)
      ).to.be.revertedWith("Exceeds max supply");
    });

    it("Debería rechazar mint de usuarios sin rol MINTER_ROLE", async function () {
      const amount = ethers.parseEther("1000");
      await expect(
        krmToken.connect(user1).mint(user2.address, amount)
      ).to.be.reverted;
    });
  });

  describe("Pausing", function () {
    it("Debería permitir pausar y unpausar", async function () {
      await krmToken.connect(owner).pause();
      expect(await krmToken.paused()).to.be.true;

      await krmToken.connect(owner).unpause();
      expect(await krmToken.paused()).to.be.false;
    });

    it("Debería rechazar transferencias cuando está pausado", async function () {
      await krmToken.connect(owner).mint(user1.address, ethers.parseEther("1000"));
      await krmToken.connect(owner).pause();

      await expect(
        krmToken.connect(user1).transfer(user2.address, ethers.parseEther("100"))
      ).to.be.reverted;
    });
  });

  describe("Transfer with reflection fee", function () {
    beforeEach(async function () {
      await krmToken.connect(owner).mint(user1.address, ethers.parseEther("1000"));
    });

    it("Debería aplicar comisión de reflexión en transferencias normales", async function () {
      const transferAmount = ethers.parseEther("100");
      const treasuryBalanceBefore = await krmToken.balanceOf(treasury.address);
      const user2BalanceBefore = await krmToken.balanceOf(user2.address);

      await krmToken.connect(user1).transfer(user2.address, transferAmount);

      const treasuryBalanceAfter = await krmToken.balanceOf(treasury.address);
      const user2BalanceAfter = await krmToken.balanceOf(user2.address);

      // Comisión del 1% = 1 KRM
      const expectedFee = ethers.parseEther("1");
      const expectedNetAmount = transferAmount - expectedFee;

      expect(treasuryBalanceAfter - treasuryBalanceBefore).to.equal(expectedFee);
      expect(user2BalanceAfter - user2BalanceBefore).to.equal(expectedNetAmount);
    });

    it("No debería aplicar comisión a transferencias del treasury", async function () {
      const transferAmount = ethers.parseEther("100");
      const user1BalanceBefore = await krmToken.balanceOf(user1.address);

      await krmToken.connect(treasury).transfer(user1.address, transferAmount);

      const user1BalanceAfter = await krmToken.balanceOf(user1.address);
      expect(user1BalanceAfter - user1BalanceBefore).to.equal(transferAmount);
    });

    it("No debería aplicar comisión a transferencias al treasury", async function () {
      const transferAmount = ethers.parseEther("100");
      const treasuryBalanceBefore = await krmToken.balanceOf(treasury.address);

      await krmToken.connect(user1).transfer(treasury.address, transferAmount);

      const treasuryBalanceAfter = await krmToken.balanceOf(treasury.address);
      expect(treasuryBalanceAfter - treasuryBalanceBefore).to.equal(transferAmount);
    });

    it("No debería aplicar comisión a usuarios con rol MINTER_ROLE", async function () {
      const transferAmount = ethers.parseEther("100");
      const user2BalanceBefore = await krmToken.balanceOf(user2.address);

      // Asegurar que el owner tiene tokens para transferir
      await krmToken.connect(owner).mint(owner.address, ethers.parseEther("1000"));
      
      await krmToken.connect(owner).transfer(user2.address, transferAmount);

      const user2BalanceAfter = await krmToken.balanceOf(user2.address);
      expect(user2BalanceAfter - user2BalanceBefore).to.equal(transferAmount);
    });
  });

  describe("Admin functions", function () {
    it("Debería permitir actualizar la comisión de reflexión", async function () {
      const newFee = 200; // 2%
      await krmToken.connect(owner).updateReflectionFee(newFee);
      expect(await krmToken.reflectionFee()).to.equal(newFee);
    });

    it("Debería rechazar comisión muy alta", async function () {
      const highFee = 1500; // 15%
      await expect(
        krmToken.connect(owner).updateReflectionFee(highFee)
      ).to.be.revertedWith("Fee too high");
    });

    it("Debería permitir actualizar el treasury wallet", async function () {
      await krmToken.connect(owner).updateTreasuryWallet(user1.address);
      expect(await krmToken.treasuryWallet()).to.equal(user1.address);
    });

    it("Debería rechazar treasury wallet zero address", async function () {
      await expect(
        krmToken.connect(owner).updateTreasuryWallet(ethers.ZeroAddress)
      ).to.be.revertedWith("Treasury cannot be zero address");
    });
  });
});
