const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("MusubiDeployment", (m) => {
  // Desplegar IPFSRegistry primero (base para todos los demás contratos)
  const ipfsRegistry = m.contract("IPFSRegistry");

  // Desplegar KRMToken
  const krmToken = m.contract("KRMToken", [m.getAccount(0)]);

  // Desplegar ProfileRegistry con dependencia de IPFSRegistry
  const profileRegistry = m.contract("ProfileRegistry", [ipfsRegistry]);

  // Desplegar SkillSystem con dependencia de IPFSRegistry
  const skillSystem = m.contract("SkillSystem", [ipfsRegistry]);

  // Desplegar TimeRegistry con dependencias
  const timeRegistry = m.contract("TimeRegistry", [ipfsRegistry, skillSystem]);

  // Desplegar ProfileNFT con dependencias (NFT evolutivo)
  const profileNFT = m.contract("ProfileNFT", [profileRegistry, skillSystem]);

  // Desplegar P2PMarketplace con dependencias
  const p2pMarketplace = m.contract("P2PMarketplace", [m.getAccount(0), krmToken]);

  // Configurar direcciones en P2PMarketplace
  m.call(p2pMarketplace, "setContractAddresses", [
    profileRegistry,
    skillSystem,
    ipfsRegistry
  ]);

  return {
    ipfsRegistry,
    krmToken,
    profileRegistry,
    skillSystem,
    timeRegistry,
    profileNFT,
    p2pMarketplace
  };
});
