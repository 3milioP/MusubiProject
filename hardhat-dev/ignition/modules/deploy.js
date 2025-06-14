const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("MusubiDeployment", (m) => {
  const treasury = m.getAccount(0);

  const krmToken = m.contract("KRMToken", [treasury]);
  const profileRegistry = m.contract("ProfileRegistry");
  const skillSystem = m.contract("SkillSystem");
  const timeRegistry = m.contract("TimeRegistry");

  const p2pMarketplace = m.contract("P2PMarketplace", [
    treasury,
    krmToken // <-- usar directamente el objeto de contrato
  ]);

  return {
    krmToken,
    profileRegistry,
    skillSystem,
    timeRegistry,
    p2pMarketplace
  };
});
