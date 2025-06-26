// Script para debuggear el perfil - Ejecutar en la consola del navegador
console.log('🔧 Debug Profile Script - Iniciando...');

// Función para limpiar estado
function clearState() {
  localStorage.removeItem('musubi_onboarding_state');
  console.log('✅ Estado de onboarding limpiado');
}

// Función para forzar carga de perfil
async function forceLoadProfile() {
  console.log('🔧 Forzando carga de perfil...');
  
  // Verificar si hay provider y account
  if (!window.ethereum) {
    console.log('❌ No hay MetaMask');
    return;
  }
  
  const accounts = await window.ethereum.request({ method: 'eth_accounts' });
  if (!accounts || accounts.length === 0) {
    console.log('❌ No hay cuenta conectada');
    return;
  }
  
  const account = accounts[0];
  console.log('🔧 Cuenta:', account);
  
  // Crear provider
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  console.log('🔧 Provider creado');
  
  // Crear servicio
  const { ProfileRegistryService } = await import('./src/services/contracts.js');
  const service = new ProfileRegistryService(provider);
  console.log('🔧 Service creado');
  
  try {
    const profile = await service.getProfile(account);
    console.log('🔧 Perfil obtenido:', profile);
    
    if (profile) {
      console.log('✅ Perfil encontrado:', profile);
      // Aquí podrías actualizar el estado del componente
      window.dispatchEvent(new CustomEvent('profileLoaded', { detail: profile }));
    } else {
      console.log('❌ No se encontró perfil');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Función para recargar página
function reloadPage() {
  console.log('🔄 Recargando página...');
  window.location.reload();
}

// Exponer funciones globalmente
window.debugProfile = {
  clearState,
  forceLoadProfile,
  reloadPage
};

console.log('🔧 Funciones disponibles:');
console.log('  - debugProfile.clearState()');
console.log('  - debugProfile.forceLoadProfile()');
console.log('  - debugProfile.reloadPage()');
console.log('🔧 Ejecuta: debugProfile.clearState() y luego debugProfile.forceLoadProfile()'); 