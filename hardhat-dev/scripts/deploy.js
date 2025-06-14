async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Desplegando contratos con la cuenta:", deployer.address);

  // Desplegar KRMToken
  const KRMToken = await ethers.getContractFactory("KRMToken");
  const krmToken = await KRMToken.deploy();
  await krmToken.deployed();
  console.log("KRMToken desplegado en:", krmToken.address);

  // Desplegar ProfileRegistry
  const ProfileRegistry = await ethers.getContractFactory("ProfileRegistry");
  const profileRegistry = await ProfileRegistry.deploy();
  await profileRegistry.deployed();
  console.log("ProfileRegistry desplegado en:", profileRegistry.address);

  // Desplegar SkillSystem
  const SkillSystem = await ethers.getContractFactory("SkillSystem");
  const skillSystem = await SkillSystem.deploy();
  await skillSystem.deployed();
  console.log("SkillSystem desplegado en:", skillSystem.address);

  // Desplegar TimeRegistry
  const TimeRegistry = await ethers.getContractFactory("TimeRegistry");
  const timeRegistry = await TimeRegistry.deploy();
  await timeRegistry.deployed();
  console.log("TimeRegistry desplegado en:", timeRegistry.address);

  // Desplegar P2PMarketplace
  const P2PMarketplace = await ethers.getContractFactory("P2PMarketplace");
  const p2pMarketplace = await P2PMarketplace.deploy(deployer.address, krmToken.address);
  await p2pMarketplace.deployed();
  console.log("P2PMarketplace desplegado en:", p2pMarketplace.address);

  // Guardar direcciones para el frontend
  console.log("Guarda estas direcciones para configurar el frontend:");
  console.log({
    krmToken: krmToken.address,
    profileRegistry: profileRegistry.address,
    skillSystem: skillSystem.address,
    timeRegistry: timeRegistry.address,
    p2pMarketplace: p2pMarketplace.address
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
