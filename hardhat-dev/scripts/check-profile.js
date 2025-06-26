const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Verificando perfiles en la blockchain...");
  
  // Usar la cuenta específica que está usando el usuario
  const address = "0x70997970c51812dc3a010c7d01b50e0d17dc79c8";
  
  console.log("📍 Dirección a verificar:", address);
  
  // Obtener instancia del contrato ProfileRegistry
  const ProfileRegistry = await ethers.getContractFactory("ProfileRegistry");
  const profileRegistryAddress = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"; // Dirección correcta del contrato desplegado
  const profileRegistry = ProfileRegistry.attach(profileRegistryAddress);
  
  try {
    // Verificar si el perfil existe
    const hasProfile = await profileRegistry.hasRegisteredProfile(address);
    console.log("✅ ¿Tiene perfil registrado?", hasProfile);
    
    if (hasProfile) {
      // Obtener datos del perfil
      const profile = await profileRegistry.getProfile(address);
      console.log("📋 Datos del perfil:");
      console.log("  - Profile Data Hash:", profile.profileDataHash);
      console.log("  - Profile Type:", profile.profileType.toString());
      console.log("  - Status:", profile.status.toString());
      console.log("  - Karma Score:", profile.karmaScore.toString());
      console.log("  - Created At:", new Date(Number(profile.createdAt) * 1000).toLocaleString());
      console.log("  - Updated At:", new Date(Number(profile.updatedAt) * 1000).toLocaleString());
      
      // Verificar si el hash está registrado en IPFSRegistry
      const IPFSRegistry = await ethers.getContractFactory("IPFSRegistry");
      const ipfsRegistryAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Dirección correcta del contrato IPFSRegistry
      const ipfsRegistry = IPFSRegistry.attach(ipfsRegistryAddress);
      
      const isHashRegistered = await ipfsRegistry.isHashRegistered(profile.profileDataHash);
      console.log("🔗 ¿Hash registrado en IPFSRegistry?", isHashRegistered);
    }
    
  } catch (error) {
    console.error("❌ Error verificando perfil:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 