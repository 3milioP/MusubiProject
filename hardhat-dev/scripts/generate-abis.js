const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🔧 Generando ABIs correctos...");

  // Leer los archivos de artefactos compilados
  const artifactsPath = path.join(__dirname, '../artifacts/contracts');
  
  const contracts = [
    'tokens/KRMToken.sol/KRMToken.json',
    'core/ProfileRegistry.sol/ProfileRegistry.json',
    'core/SkillSystem.sol/SkillSystem.json',
    'core/TimeRegistry.sol/TimeRegistry.json',
    'marketplace/P2PMarketplace.sol/P2PMarketplace.json',
    'tokens/ProfileNFT.sol/ProfileNFT.json'
  ];

  const abis = {};

  for (const contractPath of contracts) {
    try {
      const artifactPath = path.join(artifactsPath, contractPath);
      const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
      
      const contractName = path.basename(contractPath, '.json');
      abis[contractName] = artifact.abi;
      
      console.log(`✅ ABI generado para ${contractName}`);
    } catch (error) {
      console.log(`❌ Error generando ABI para ${contractPath}: ${error.message}`);
    }
  }

  // Crear el archivo de ABIs para el frontend
  const frontendAbiPath = path.join(__dirname, '../../frontend/src/services/abis.ts');
  
  const abiContent = `// ABIs generados automáticamente desde los contratos compilados
export const CONTRACT_ABIS = ${JSON.stringify(abis, null, 2)};
`;

  fs.writeFileSync(frontendAbiPath, abiContent);
  console.log(`✅ ABIs guardados en ${frontendAbiPath}`);

  // También crear un archivo JSON para referencia
  const jsonPath = path.join(__dirname, '../abis.json');
  fs.writeFileSync(jsonPath, JSON.stringify(abis, null, 2));
  console.log(`✅ ABIs JSON guardados en ${jsonPath}`);

  console.log("\n📊 Resumen de ABIs generados:");
  Object.keys(abis).forEach(contract => {
    console.log(`  - ${contract}: ${abis[contract].length} funciones`);
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  }); 