// Utilidad para debugging del estado de Web3
import { Web3State } from '../types';
import { CONTRACT_ADDRESSES } from '../config';
import { CONTRACT_ABIS } from '../services/abis';
import { ethers } from 'ethers';

export const debugWeb3State = (state: Web3State, context: string = 'Unknown') => {
  console.log(`🔍 [${context}] Estado de Web3:`, {
    isConnected: state.isConnected,
    account: state.account,
    chainId: state.chainId,
    hasProvider: !!state.provider,
    hasSigner: !!state.signer,
    connecting: state.connecting,
    error: state.error
  });

  // Detectar inconsistencias
  if (state.isConnected && (!state.provider || !state.signer)) {
    console.error(`❌ [${context}] ESTADO INCONSISTENTE DETECTADO:`, {
      isConnected: state.isConnected,
      hasProvider: !!state.provider,
      hasSigner: !!state.signer,
      account: state.account
    });
    return false;
  }

  if (!state.isConnected && (state.provider || state.signer)) {
    console.warn(`⚠️ [${context}] Estado potencialmente inconsistente:`, {
      isConnected: state.isConnected,
      hasProvider: !!state.provider,
      hasSigner: !!state.signer
    });
  }

  return true;
};

export const validateWeb3Connection = (state: Web3State): boolean => {
  return state.isConnected && !!state.provider && !!state.signer && !!state.account;
};

export const getWeb3Status = (state: Web3State): string => {
  if (!state.isConnected) return 'No conectado';
  if (!state.provider) return 'Sin provider';
  if (!state.signer) return 'Sin signer';
  if (!state.account) return 'Sin cuenta';
  return 'Conectado correctamente';
};

// Función para verificar el estado del contrato ProfileRegistry
export const debugProfileRegistryContract = async (provider: any, signer: any) => {
  console.log('🔍 Debug - Verificando estado del contrato ProfileRegistry...');
  
  try {
    // Verificar que las direcciones estén disponibles
    console.log('🔍 Debug - CONTRACT_ADDRESSES disponibles:', CONTRACT_ADDRESSES);
    console.log('🔍 Debug - Dirección ProfileRegistry:', CONTRACT_ADDRESSES.ProfileRegistry);
    
    if (!CONTRACT_ADDRESSES.ProfileRegistry) {
      console.error('❌ Debug - Dirección del contrato ProfileRegistry no encontrada');
      return { error: 'Contract address not found' };
    }
    
    const contract = new ethers.Contract(
      CONTRACT_ADDRESSES.ProfileRegistry,
      CONTRACT_ABIS.ProfileRegistry,
      signer || provider
    );
    
    console.log('🔍 Debug - Dirección del contrato:', contract.address);
    
    // Verificar si el contrato está pausado
    try {
      const isPaused = await contract.paused();
      console.log('🔍 Debug - Contrato pausado:', isPaused);
      
      if (isPaused) {
        console.error('❌ Debug - El contrato está pausado. No se pueden realizar transacciones.');
        return { error: 'Contract is paused' };
      }
    } catch (error: any) {
      console.log('🔍 Debug - No se pudo verificar si está pausado (puede que no tenga función paused):', error);
    }
    
    // Verificar si la cuenta actual ya tiene un perfil
    try {
      const account = await signer.getAddress();
      const hasProfile = await contract.hasProfile(account);
      console.log('🔍 Debug - La cuenta ya tiene perfil:', hasProfile);
      
      if (hasProfile) {
        console.error('❌ Debug - La cuenta ya tiene un perfil registrado.');
        return { error: 'Profile already exists' };
      }
    } catch (error: any) {
      console.log('🔍 Debug - Error verificando si tiene perfil:', error);
    }
    
    // Verificar roles del contrato
    try {
      const defaultAdminRole = await contract.DEFAULT_ADMIN_ROLE();
      const verifierRole = await contract.VERIFIER_ROLE();
      const karmaRole = await contract.KARMA_ROLE();
      const companyRole = await contract.COMPANY_ROLE();
      
      console.log('🔍 Debug - Roles del contrato:', {
        defaultAdminRole,
        verifierRole,
        karmaRole,
        companyRole
      });
    } catch (error: any) {
      console.log('🔍 Debug - Error obteniendo roles:', error);
    }
    
    // Verificar si la cuenta tiene permisos de admin
    try {
      const account = await signer.getAddress();
      const hasAdminRole = await contract.hasRole(await contract.DEFAULT_ADMIN_ROLE(), account);
      console.log('🔍 Debug - La cuenta tiene rol de admin:', hasAdminRole);
    } catch (error: any) {
      console.log('🔍 Debug - Error verificando rol de admin:', error);
    }
    
    console.log('✅ Debug - Verificación del contrato completada');
    return { success: true };
    
  } catch (error: any) {
    console.error('❌ Debug - Error verificando contrato:', error);
    return { error: error.message };
  }
};

// Función para simular una llamada de registro sin enviar transacción
export const simulateProfileRegistration = async (
  provider: any, 
  signer: any, 
  name: string, 
  description: string, 
  metadataURI: string, 
  profileType: number, 
  acceptDisclaimer: boolean
) => {
  console.log('🔍 Debug - Simulando registro de perfil...');
  
  try {
    // Verificar que las direcciones estén disponibles
    console.log('🔍 Debug - CONTRACT_ADDRESSES en simulación:', CONTRACT_ADDRESSES);
    console.log('🔍 Debug - Dirección ProfileRegistry en simulación:', CONTRACT_ADDRESSES.ProfileRegistry);
    
    if (!CONTRACT_ADDRESSES.ProfileRegistry) {
      console.error('❌ Debug - Dirección del contrato ProfileRegistry no encontrada en simulación');
      return { error: 'Contract address not found' };
    }
    
    const contract = new ethers.Contract(
      CONTRACT_ADDRESSES.ProfileRegistry,
      CONTRACT_ABIS.ProfileRegistry,
      signer || provider
    );
    
    const account = await signer.getAddress();
    
    console.log('🔍 Debug - Parámetros de simulación:', {
      account,
      name,
      description,
      metadataURI,
      profileType,
      acceptDisclaimer,
      contractAddress: contract.address
    });
    
    // Simular la llamada usando estimateGas
    const gasEstimate = await contract.registerProfile.estimateGas(
      name,
      description,
      metadataURI,
      profileType,
      acceptDisclaimer,
      { from: account }
    );
    
    console.log('✅ Debug - Simulación exitosa. Gas estimado:', gasEstimate.toString());
    return { success: true, gasEstimate: gasEstimate.toString() };
    
  } catch (error: any) {
    console.error('❌ Debug - Error en simulación:', error);
    return { error: error.message };
  }
}; 