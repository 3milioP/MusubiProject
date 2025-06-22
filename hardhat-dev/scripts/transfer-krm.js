const { ethers } = require("hardhat");

async function main() {
  console.log("🔄 Transferiendo tokens KRM desde treasury...");

  // Obtener las cuentas
  const [owner, treasury, user1, user2, user3, user4, user5] = await ethers.getSigners();
  
  console.log("👤 Owner:", owner.address);
  console.log("💰 Treasury:", treasury.address);
  console.log("👤 User1:", user1.address);

  // Obtener el contrato KRM Token
  const KRMToken = await ethers.getContractFactory("KRMToken");
  const krmToken = KRMToken.attach("0x5FbDB2315678afecb367f032d93F642f64180aa3");

  console.log("📋 Contrato KRM:", await krmToken.getAddress());

  // Verificar balance del treasury
  const treasuryBalance = await krmToken.balanceOf(treasury.address);
  console.log("💰 Balance del Treasury:", ethers.formatEther(treasuryBalance), "KRM");

  // Verificar balance del usuario antes
  const userBalanceBefore = await krmToken.balanceOf(user1.address);
  console.log("👤 Balance del Usuario antes:", ethers.formatEther(userBalanceBefore), "KRM");

  // Transferir tokens al usuario (10,000 KRM)
  const transferAmount = ethers.parseUnits("10000", 18);
  console.log("📤 Transfiriendo", ethers.formatEther(transferAmount), "KRM a", user1.address);

  // El treasury transfiere tokens (sin fees porque treasury tiene rol MINTER)
  const tx = await krmToken.connect(treasury).transfer(user1.address, transferAmount);
  await tx.wait();

  console.log("✅ Transacción completada:", tx.hash);

  // Verificar balance del usuario después
  const userBalanceAfter = await krmToken.balanceOf(user1.address);
  console.log("👤 Balance del Usuario después:", ethers.formatEther(userBalanceAfter), "KRM");

  // Verificar balance del treasury después
  const treasuryBalanceAfter = await krmToken.balanceOf(treasury.address);
  console.log("💰 Balance del Treasury después:", ethers.formatEther(treasuryBalanceAfter), "KRM");

  console.log("🎉 Transferencia completada exitosamente!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  }); 