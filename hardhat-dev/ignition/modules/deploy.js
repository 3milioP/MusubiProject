const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("MusubiDeployment", (m) => {
  // Desplegar KRMToken primero
  const krmToken = m.contract("KRMToken", [m.getAccount(0)]);

  // Desplegar ProfileRegistry
  const profileRegistry = m.contract("ProfileRegistry");

  // Desplegar SkillSystem con dependencia de ProfileRegistry
  const skillSystem = m.contract("SkillSystem", [profileRegistry]);

  // Desplegar TimeRegistry con dependencias
  const timeRegistry = m.contract("TimeRegistry", [profileRegistry, skillSystem]);

  // Desplegar ProfileNFT con dependencias (NFT evolutivo)
  const profileNFT = m.contract("ProfileNFT", [profileRegistry, skillSystem]);

  // Desplegar P2PMarketplace con dependencias
  const p2pMarketplace = m.contract("P2PMarketplace", [m.getAccount(0), krmToken]);

  // Desplegar IPFSRegistry
  const ipfsRegistry = m.contract("IPFSRegistry");

  // Configurar direcciones en P2PMarketplace (solo profileRegistry y skillSystem)
  m.call(p2pMarketplace, "setContractAddresses", [
    profileRegistry,
    skillSystem
  ]);

  return {
    krmToken,
    profileRegistry,
    skillSystem,
    timeRegistry,
    profileNFT,
    p2pMarketplace,
    ipfsRegistry
  };
});
