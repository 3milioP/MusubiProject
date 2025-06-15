// Configuración de contratos y conexión blockchain
// Reemplaza estas direcciones con las obtenidas al desplegar los contratos

export const CONTRACT_ADDRESSES = {
  krmToken: "0x5FbDB2315678afecb367f032d93F642f64180aa3", // Dirección del contrato KRMToken
  profileRegistry: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", // Dirección del contrato ProfileRegistry
  skillSystem: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0", // Dirección del contrato SkillSystem
  timeRegistry: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9", // Dirección del contrato TimeRegistry
  p2pMarketplace: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9" // Dirección del contrato P2PMarketplace
};

// Estas son las direcciones por defecto que Hardhat asigna en orden de despliegue
// Actualiza estas direcciones si obtienes diferentes valores al desplegar

export const RPC_URL = "http://localhost:8545";
export const CHAIN_ID = 31337;
