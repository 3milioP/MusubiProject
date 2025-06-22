async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Desplegando contratos con la cuenta:", deployer.address);

  // Desplegar KRMToken
  const KRMToken = await ethers.getContractFactory("KRMToken");
  const krmToken = await KRMToken.deploy(deployer.address);
  await krmToken.waitForDeployment();
  console.log("KRMToken desplegado en:", krmToken.target);

  // Desplegar ProfileRegistry
  const ProfileRegistry = await ethers.getContractFactory("ProfileRegistry");
  const profileRegistry = await ProfileRegistry.deploy();
  await profileRegistry.waitForDeployment();
  console.log("ProfileRegistry desplegado en:", profileRegistry.target);

  // Desplegar SkillSystem
  const SkillSystem = await ethers.getContractFactory("SkillSystem");
  const skillSystem = await SkillSystem.deploy(profileRegistry.target);
  await skillSystem.waitForDeployment();
  console.log("SkillSystem desplegado en:", skillSystem.target);

  // Desplegar TimeRegistry
  const TimeRegistry = await ethers.getContractFactory("TimeRegistry");
  const timeRegistry = await TimeRegistry.deploy(profileRegistry.target, skillSystem.target);
  await timeRegistry.waitForDeployment();
  console.log("TimeRegistry desplegado en:", timeRegistry.target);

  // Desplegar P2PMarketplace
  const P2PMarketplace = await ethers.getContractFactory("P2PMarketplace");
  const p2pMarketplace = await P2PMarketplace.deploy(deployer.address, krmToken.target);
  await p2pMarketplace.waitForDeployment();
  console.log("P2PMarketplace desplegado en:", p2pMarketplace.target);

  // Guardar direcciones para el frontend
  console.log("Guarda estas direcciones para configurar el frontend:");
  console.log({
    krmToken: krmToken.target,
    profileRegistry: profileRegistry.target,
    skillSystem: skillSystem.target,
    timeRegistry: timeRegistry.target,
    p2pMarketplace: p2pMarketplace.target
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
