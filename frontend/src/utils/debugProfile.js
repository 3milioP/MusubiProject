// Utilidad para debuggear y cargar manualmente el perfil
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '../config';
import { CONTRACT_ABIS } from '../services/abis';

export const debugProfile = async (provider, account) => {
  console.log('🔧 Debug Profile - Iniciando...');
  console.log('🔧 Account:', account);
  console.log('🔧 Provider:', !!provider);

  if (!provider || !account) {
    console.log('❌ No hay provider o account');
    return null;
  }

  try {
    // Crear instancia del contrato ProfileRegistry
    const contractAddress = CONTRACT_ADDRESSES.ProfileRegistry;
    const contractABI = CONTRACT_ABIS.ProfileRegistry;
    
    console.log('🔧 Contrato ProfileRegistry:', contractAddress);
    console.log('🔧 ABI disponible:', !!contractABI);

    const contract = new ethers.Contract(contractAddress, contractABI, provider);
    
    // Intentar obtener el perfil
    console.log('🔧 Llamando getProfile...');
    const profileData = await contract.getProfile(account);
    console.log('🔧 Datos del contrato:', profileData);

    // Verificar si el perfil existe
    if (!profileData || profileData.wallet === ethers.ZeroAddress) {
      console.log('❌ No se encontró perfil en blockchain');
      return null;
    }

    console.log('✅ Perfil encontrado en blockchain:', {
      wallet: profileData.wallet,
      profileDataHash: profileData.profileDataHash,
      profileType: profileData.profileType,
      status: profileData.status,
      karmaScore: profileData.karmaScore?.toString(),
      createdAt: profileData.createdAt?.toString(),
      updatedAt: profileData.updatedAt?.toString(),
      verifiedAt: profileData.verifiedAt?.toString(),
      verifiedBy: profileData.verifiedBy
    });

    // Construir objeto Profile
    const profile = {
      address: account,
      name: 'Usuario Registrado', // Placeholder
      bio: 'Perfil cargado desde blockchain',
      isCompany: profileData.profileType === 1,
      isActive: profileData.status === 0, // 0 = Active
      metadataURI: profileData.profileDataHash,
      karma: profileData.karmaScore?.toNumber() || 0,
      isVerified: profileData.verifiedAt > 0,
      disclaimerAccepted: true
    };

    console.log('✅ Objeto Profile construido:', profile);
    return profile;

  } catch (error) {
    console.error('❌ Error en debugProfile:', error);
    return null;
  }
};

// Función para forzar la carga del perfil
export const forceLoadProfile = async (provider, account, setProfile) => {
  console.log('🔧 Force Load Profile - Iniciando...');
  
  const profile = await debugProfile(provider, account);
  
  if (profile && setProfile) {
    console.log('🔧 Estableciendo perfil en el estado...');
    setProfile(profile);
    console.log('✅ Perfil cargado manualmente');
    return profile;
  }
  
  return null;
}; 