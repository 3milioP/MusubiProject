const { ethers } = require('ethers');

// Configuración
const CONTRACT_ADDRESSES = {
  TimeRegistry: '0x5FbDB2315678afecb367f032d93F642f64180aa3'
};

const CONTRACT_ABIS = {
  TimeRegistry: [
    "function registerTime(uint256 skillId, string calldata timeDataHash, uint256 hoursWorked, uint256 hourlyRate) external",
    "function getTimeEntry(uint256 entryId) external view returns (uint256, address, uint256, string, uint256, uint256, uint256, bool, address, uint256, uint256, uint256)",
    "function getProfessionalEntries(address professional) external view returns (uint256[])",
    "function totalEntries() external view returns (uint256)"
  ]
};

async function testTimeRegistry() {
  try {
    console.log('🔍 Probando registro de tiempo...');
    
    // 1. Conectar a la red local
    const provider = new ethers.JsonRpcProvider('http://localhost:8545');
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    
    console.log('✅ Conectado a:', address);
    
    // 2. Crear instancia del contrato
    const contract = new ethers.Contract(
      CONTRACT_ADDRESSES.TimeRegistry,
      CONTRACT_ABIS.TimeRegistry,
      signer
    );
    
    console.log('✅ Contrato TimeRegistry conectado');
    
    // 3. Verificar método registerTime
    console.log('🔍 Verificando método registerTime...');
    const contractInterface = new ethers.Interface(CONTRACT_ABIS.TimeRegistry);
    
    // Verificar que el método existe
    const functionFragment = contractInterface.getFunction('registerTime');
    console.log('✅ Método registerTime encontrado:', functionFragment.format());
    
    // 4. Probar con datos de ejemplo
    const skillId = 0;
    const timeDataHash = "QmYJV925CZsW5f7Rp6vpjk5ynM3QSkp8jy3QD4eYv3udQe"; // Hash de prueba
    const hoursWorked = 1;
    const hourlyRate = 50; // 50 wei por hora
    
    console.log('📋 Datos de prueba:', {
      skillId,
      timeDataHash,
      hoursWorked,
      hourlyRate
    });
    
    // 5. Intentar registrar tiempo
    console.log('⛓️ Registrando tiempo en blockchain...');
    const tx = await contract.registerTime(skillId, timeDataHash, hoursWorked, hourlyRate);
    
    console.log('🔄 Esperando confirmación...');
    const receipt = await tx.wait();
    
    console.log('✅ Tiempo registrado exitosamente!');
    console.log('📄 Transacción:', receipt.transactionHash);
    
    // 6. Verificar el registro
    const totalEntries = await contract.totalEntries();
    console.log('📊 Total de registros:', totalEntries.toString());
    
    const userEntries = await contract.getProfessionalEntries(address);
    console.log('👤 Registros del usuario:', userEntries.length);
    
    if (userEntries.length > 0) {
      const lastEntry = await contract.getTimeEntry(userEntries[userEntries.length - 1]);
      console.log('📝 Último registro:', {
        id: userEntries[userEntries.length - 1].toString(),
        professional: lastEntry[1],
        skillId: lastEntry[2].toString(),
        timeDataHash: lastEntry[3],
        hoursWorked: lastEntry[4].toString(),
        hourlyRate: lastEntry[5].toString(),
        totalAmount: lastEntry[6].toString(),
        isValidated: lastEntry[7],
        createdAt: new Date(Number(lastEntry[10]) * 1000).toISOString()
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    
    if (error.code === 'CALL_EXCEPTION') {
      console.error('📋 Detalles del error:', {
        reason: error.reason,
        data: error.data,
        args: error.args
      });
    }
  }
}

testTimeRegistry(); 