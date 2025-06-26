const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Verificando y distribuyendo tokens KRM...");
  
  const krmAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  
  try {
    // Obtener el contrato KRM
    const krmToken = await ethers.getContractAt("KRMToken", krmAddress);
    console.log("✅ Contrato KRM obtenido");
    
    // Obtener las cuentas de prueba
    const accounts = await ethers.getSigners();
    console.log(`📊 Verificando ${accounts.length} cuentas...`);
    
    for (let i = 0; i < Math.min(accounts.length, 5); i++) {
      const account = accounts[i];
      const address = account.address;
      
      try {
        const balance = await krmToken.balanceOf(address);
        const balanceEth = ethers.formatEther(balance);
        
        console.log(`\n👤 Cuenta ${i + 1}: ${address}`);
        console.log(`💰 Balance actual: ${balanceEth} KRM`);
        
        // Si el balance es menor a 100 KRM, transferir tokens
        if (parseFloat(balanceEth) < 100) {
          console.log(`🔄 Balance bajo, transfiriendo 1000 KRM...`);
          
          // Solo el deployer (cuenta 0) puede transferir
          if (i === 0) {
            console.log(`✅ Deployer (cuenta 0) - Balance suficiente`);
          } else {
            // Transferir desde el deployer
            const deployer = accounts[0];
            const tx = await krmToken.connect(deployer).transfer(address, ethers.parseEther("1000"));
            await tx.wait();
            console.log(`✅ Transferencia completada: 1000 KRM enviados`);
            
            // Verificar nuevo balance
            const newBalance = await krmToken.balanceOf(address);
            const newBalanceEth = ethers.formatEther(newBalance);
            console.log(`💰 Nuevo balance: ${newBalanceEth} KRM`);
          }
        } else {
          console.log(`✅ Balance suficiente`);
        }
        
      } catch (error) {
        console.log(`❌ Error con cuenta ${i + 1}: ${error.message}`);
      }
    }
    
    console.log("\n✅ Verificación y distribución completada");
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 