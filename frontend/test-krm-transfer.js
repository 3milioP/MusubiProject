// Script de prueba para verificar transferencias KRM
const { ethers } = require('ethers');

async function testKRMTransfer() {
  console.log('🧪 Iniciando prueba de transferencia KRM...');
  
  // Configuración
  const provider = new ethers.JsonRpcProvider('http://localhost:8545');
  const privateKey = process.env.PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // Cuenta 0 de Hardhat
  const wallet = new ethers.Wallet(privateKey, provider);
  
  // Dirección del contrato KRM (debes obtenerla de tu despliegue)
  const krmAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // Ajusta según tu despliegue
  
  // ABI básico para KRM
  const krmABI = [
    'function balanceOf(address owner) view returns (uint256)',
    'function transfer(address to, uint256 amount) returns (bool)',
    'event Transfer(address indexed from, address indexed to, uint256 value)'
  ];
  
  const krmContract = new ethers.Contract(krmAddress, krmABI, wallet);
  
  try {
    // Obtener balance inicial
    const initialBalance = await krmContract.balanceOf(wallet.address);
    console.log('💰 Balance inicial:', ethers.formatEther(initialBalance), 'KRM');
    
    // Dirección de destino (puede ser otra cuenta)
    const toAddress = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'; // Cuenta 1 de Hardhat
    
    // Cantidad a transferir
    const amount = ethers.parseEther('10.0');
    
    console.log('🔄 Enviando transferencia...');
    console.log('📤 Desde:', wallet.address);
    console.log('📥 Hacia:', toAddress);
    console.log('💰 Cantidad:', ethers.formatEther(amount), 'KRM');
    
    // Ejecutar transferencia
    const tx = await krmContract.transfer(toAddress, amount);
    console.log('📝 Hash de transacción:', tx.hash);
    
    // Esperar confirmación
    console.log('⏳ Esperando confirmación...');
    const receipt = await tx.wait();
    console.log('✅ Transacción confirmada en bloque:', receipt.blockNumber);
    
    // Verificar balance final
    const finalBalance = await krmContract.balanceOf(wallet.address);
    console.log('💰 Balance final:', ethers.formatEther(finalBalance), 'KRM');
    
    // Verificar balance del destinatario
    const recipientBalance = await krmContract.balanceOf(toAddress);
    console.log('💰 Balance del destinatario:', ethers.formatEther(recipientBalance), 'KRM');
    
    console.log('✅ Prueba completada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

// Ejecutar la prueba
testKRMTransfer().catch(console.error); 