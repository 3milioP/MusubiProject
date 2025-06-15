const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("KRMToken Contract", function () {
  let krmToken;
  let owner, treasury, addr1, addr2;

  const MAX_SUPPLY = ethers.parseUnits("1000000000", 18); // 1,000,000,000 KRM

  beforeEach(async function () {
    [owner, treasury, addr1, addr2] = await ethers.getSigners();

    const KRMToken = await ethers.getContractFactory("KRMToken");
    krmToken = await KRMToken.deploy(treasury.address);
    await krmToken.waitForDeployment();
  });

  describe("Despliegue", function () {
    it("Debería asignar el 10% inicial al treasuryWallet", async function () {
      const treasuryBalance = await krmToken.balanceOf(treasury.address);
      const totalSupply = await krmToken.totalSupply();
      // treasuryBalance debe ser igual al totalSupply (que es 10% de MAX_SUPPLY)
      expect(treasuryBalance).to.equal(totalSupply);
      expect(totalSupply).to.equal(MAX_SUPPLY / 10n);
    });

    it("Debería establecer el nombre y símbolo correctos", async function () {
      expect(await krmToken.name()).to.equal("Karma Token");
      expect(await krmToken.symbol()).to.equal("KRM");
    });
  });

  describe("Transacciones", function () {
    it("Debería transferir tokens entre cuentas descontando la comisión de reflexión", async function () {
      const amount = ethers.parseUnits("1000", 18);

      // Primero el treasury transfiere tokens SIN fees (porque treasury está involucrado)
      await krmToken.connect(treasury).transfer(addr1.address, amount);

      // addr1 transfiere a addr2 con fees aplicados
      await krmToken.connect(addr1).transfer(addr2.address, amount);

      const reflectionFee = 100n; // 1% base 10000
      const fee = amount * reflectionFee / 10000n;
      const netAmount = amount - fee;

      const addr2Balance = await krmToken.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(netAmount);

      const treasuryBalanceAfter = await krmToken.balanceOf(treasury.address);
      // treasury debe haber recibido la comisión
      expect(treasuryBalanceAfter).to.equal((await krmToken.totalSupply()) - amount + fee);
    });

    it("Debería fallar si el remitente no tiene suficientes tokens", async function () {
      const amount = ethers.parseUnits("100", 18);
      await expect(
        krmToken.connect(addr1).transfer(addr2.address, amount)
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });

    it("Debería actualizar los balances después de las transferencias con fees", async function () {
      const amount = ethers.parseUnits("500", 18);

      await krmToken.connect(treasury).transfer(addr1.address, amount);

      await krmToken.connect(addr1).transfer(addr2.address, amount);

      const reflectionFee = 100; // 1%
      const fee = amount * 100n / 10000n;
      const netAmount = amount - fee;

      const addr1Balance = await krmToken.balanceOf(addr1.address);
      const addr2Balance = await krmToken.balanceOf(addr2.address);
      const treasuryBalance = await krmToken.balanceOf(treasury.address);

      expect(addr1Balance).to.equal(0);
      expect(addr2Balance).to.equal(netAmount);
      expect(treasuryBalance).to.equal((await krmToken.totalSupply()) - netAmount);
    });
  });

  describe("Allowances", function () {
    it("Debería permitir a una cuenta gastar tokens de otra cuenta descontando la comisión", async function () {
      const amount = ethers.parseUnits("1000", 18);

      await krmToken.connect(treasury).transfer(addr1.address, amount);

      await krmToken.connect(addr1).approve(addr2.address, amount);

      await krmToken.connect(addr2).transferFrom(addr1.address, addr2.address, amount);

      const reflectionFee = 100; // 1%
      const fee = amount * 100n / 10000n;
      const netAmount = amount - fee;

      const addr2Balance = await krmToken.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(netAmount);

      const treasuryBalance = await krmToken.balanceOf(treasury.address);
      expect(treasuryBalance).to.equal((await krmToken.totalSupply()) - netAmount);
    });

    it("Debería fallar si intenta transferir más de lo permitido", async function () {
      const amount = ethers.parseUnits("1000", 18);
      await krmToken.connect(treasury).transfer(addr1.address, amount);

      await krmToken.connect(addr1).approve(addr2.address, amount - 1n);

      await expect(
        krmToken.connect(addr2).transferFrom(addr1.address, addr2.address, amount)
      ).to.be.revertedWith("ERC20: insufficient allowance");
    });
  });

  describe("Eventos", function () {
    it("Debería emitir eventos Transfer en las transferencias", async function () {
      const amount = ethers.parseUnits("100", 18);

      await krmToken.connect(treasury).transfer(addr1.address, amount);

      // Solo hacer una transferencia para verificar los eventos
      const tx = await krmToken.connect(addr1).transfer(addr2.address, amount);
      
      // Verificar que se emitieron ambos eventos Transfer (fee y net amount)
      await expect(tx)
        .to.emit(krmToken, "Transfer")
        .withArgs(addr1.address, treasury.address, amount * 100n / 10000n); // fee transfer to treasury

      await expect(tx)
        .to.emit(krmToken, "Transfer")
        .withArgs(addr1.address, addr2.address, amount - (amount * 100n / 10000n)); // net transfer
    });

    it("Debería emitir eventos Approval en las aprobaciones", async function () {
      const amount = ethers.parseUnits("100", 18);
      await expect(krmToken.connect(treasury).approve(addr1.address, amount))
        .to.emit(krmToken, "Approval")
        .withArgs(treasury.address, addr1.address, amount);
    });
  });
});
