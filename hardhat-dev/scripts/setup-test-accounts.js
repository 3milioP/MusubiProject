const { ethers } = require("hardhat");

async function main() {
  console.log("🔄 Configurando cuentas de prueba con tokens KRM...");

  // Obtener las cuentas
  const [owner, treasury, user1, user2, user3, user4, user5] = await ethers.getSigners();
  
  console.log("👤 Owner (Treasury):", owner.address);
  console.log("💰 Treasury configurado:", treasury.address);
  console.log("👤 User1:", user1.address);
  console.log("👤 User2:", user2.address);
  console.log("👤 User3:", user3.address);

  // Obtener el contrato KRM Token
  const KRMToken = await ethers.getContractFactory("KRMToken");
  const krmToken = KRMToken.attach("0x5FbDB2315678afecb367f032d93F642f64180aa3");

  console.log("📋 Contrato KRM:", await krmToken.getAddress());

  // Verificar balance del owner
  const ownerBalance = await krmToken.balanceOf(owner.address);
  console.log("💰 Balance del Owner:", ethers.formatEther(ownerBalance), "KRM");

  // Transferir tokens a las cuentas de prueba
  const transferAmount = ethers.parseUnits("10000", 18);
  const testAccounts = [user1, user2, user3, user4, user5];

  console.log("\n📤 Transfiriendo tokens a cuentas de prueba...");
  
  for (let i = 0; i < testAccounts.length; i++) {
    const account = testAccounts[i];
    console.log(`  Transfiriendo a ${account.address}...`);
    
    try {
      // El owner transfiere tokens (sin fees porque owner tiene rol MINTER)
      const tx = await krmToken.connect(owner).transfer(account.address, transferAmount);
      await tx.wait();
      
      const balance = await krmToken.balanceOf(account.address);
      console.log(`    ✅ Balance: ${ethers.formatEther(balance)} KRM`);
    } catch (error) {
      console.log(`    ❌ Error: ${error.message}`);
    }
  }

  // Verificar balances finales
  console.log("\n💰 Balances finales:");
  for (let i = 0; i < testAccounts.length; i++) {
    const balance = await krmToken.balanceOf(testAccounts[i].address);
    console.log(`  Cuenta ${i + 1}: ${testAccounts[i].address} = ${ethers.formatEther(balance)} KRM`);
  }

  const finalOwnerBalance = await krmToken.balanceOf(owner.address);
  console.log(`  Owner: ${owner.address} = ${ethers.formatEther(finalOwnerBalance)} KRM`);

  console.log("\n🎉 Configuración completada!");
  console.log("📋 Cuentas de prueba disponibles:");
  console.log("  Cuenta 1: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC");
  console.log("  Cuenta 2: 0x90F79bf6EB2c4f870365E785982E1f101E93b906");
  console.log("  Cuenta 3: 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65");
  console.log("  Cuenta 4: 0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc");
  console.log("  Cuenta 5: 0x976EA74026E726554dB657fA54763abd0C3a0aa9");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  }); 