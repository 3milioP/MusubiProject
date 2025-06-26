const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Verificando balance de KRM...");
  
  // Usar la dirección específica que está usando el usuario
  const address = process.argv[2] || "0x70997970c51812dc3a010c7d01b50e0d17dc79c8";
  
  console.log("📍 Dirección a verificar:", address);
  
  // Obtener instancia del contrato KRMToken
  const KRMToken = await ethers.getContractFactory("KRMToken");
  const krmTokenAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // Dirección correcta del contrato desplegado
  const krmToken = KRMToken.attach(krmTokenAddress);
  
  try {
    // Verificar balance
    const balance = await krmToken.balanceOf(address);
    const balanceInEther = ethers.formatEther(balance);
    
    console.log("💰 Balance de KRM:");
    console.log("  - Raw balance:", balance.toString());
    console.log("  - Balance en KRM:", balanceInEther);
    
    // Verificar si es una cuenta de prueba
    const testAccounts = [
      "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
      "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
      "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
      "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
      "0x976EA74026E726554dB657fA54763abd0C3a0aa9",
      "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955",
      "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f",
      "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720"
    ];
    
    const isTestAccount = testAccounts.includes(address);
    console.log("  - ¿Es cuenta de prueba?", isTestAccount);
    
    if (isTestAccount) {
      console.log("  - Índice en cuentas de prueba:", testAccounts.indexOf(address));
    }
    
    // Verificar supply total
    const totalSupply = await krmToken.totalSupply();
    const totalSupplyInEther = ethers.formatEther(totalSupply);
    console.log("📊 Supply total de KRM:", totalSupplyInEther);
    
  } catch (error) {
    console.error("❌ Error verificando balance:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 