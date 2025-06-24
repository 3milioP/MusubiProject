// Hooks personalizados para interactuar con los contratos
import { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import {
  KRMTokenService,
  ProfileRegistryService,
  ProfileRegistryIPFSService,
  SkillSystemService,
  TimeRegistryService,
  P2PMarketplaceService
} from '../services/contracts';
import { CONTRACT_ADDRESSES } from '../config';
import { CONTRACT_ABIS } from '../services/abis';
import {
  Profile,
  Skill,
  DeclaredSkill,
  TimeRecord,
  Service,
  Order,
  TransactionState
} from '../types';
import { ethers } from 'ethers';

// Hook para KRM Token
export const useKRMToken = () => {
  const { provider, signer, account, isConnected } = useWeb3();
  const [balance, setBalance] = useState('0');
  const [loading, setLoading] = useState(false);
  const [txState, setTxState] = useState<TransactionState>({
    loading: false,
    error: null,
    success: false
  });

  const loadBalance = useCallback(async () => {
    // Solo cargar si hay conexión completa
    if (!isConnected || !provider || !account) {
      setBalance('0');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      console.log('🔍 Cargando balance KRM...');
      
      // Crear una promesa con timeout
      const balancePromise = (async () => {
        const service = new KRMTokenService(provider, signer);
        return await service.getBalance(account);
      })();
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout: No se pudo obtener el balance en 10 segundos')), 10000)
      );
      
      const balanceValue = await Promise.race([balancePromise, timeoutPromise]) as string;
      setBalance(balanceValue);
      console.log('✅ Balance KRM cargado:', balanceValue);
    } catch (error) {
      console.error('❌ Error loading KRM balance:', error);
      setBalance('0');
    } finally {
      setLoading(false);
    }
  }, [isConnected, provider, signer, account]);

  const transfer = async (to: string, amount: string) => {
    if (!isConnected || !provider || !signer) throw new Error('Wallet not connected');
    
    setTxState({ loading: true, error: null, success: false });
    
    try {
      const service = new KRMTokenService(provider, signer);
      const tx = await service.transfer(to, amount);
      await tx.wait();
      setTxState({ loading: false, error: null, success: true });
      await loadBalance(); // Recargar balance
      return tx;
    } catch (error: any) {
      setTxState({ loading: false, error: error.message, success: false });
      throw error;
    }
  };

  // Cargar balance cuando cambie la conexión
  useEffect(() => {
    if (isConnected && provider && account) {
      loadBalance();
      
      // Escuchar eventos de transferencia para actualizar el balance automáticamente
      const krmToken = new ethers.Contract(
        CONTRACT_ADDRESSES.KRMToken,
        CONTRACT_ABIS.KRMToken,
        provider
      );
      
      const handleTransfer = (from: string, to: string, value: any) => {
        if (from.toLowerCase() === account.toLowerCase() || to.toLowerCase() === account.toLowerCase()) {
          console.log('🔄 Evento de transferencia detectado, actualizando balance...');
          setTimeout(() => loadBalance(), 1000); // Esperar 1 segundo para que se confirme la transacción
        }
      };
      
      krmToken.on('Transfer', handleTransfer);
      
      return () => {
        krmToken.off('Transfer', handleTransfer);
      };
    } else {
      setBalance('0');
      setLoading(false);
    }
  }, [isConnected, provider, account, loadBalance]);

  return {
    balance,
    loading,
    txState,
    transfer,
    loadBalance,
    clearTxState: () => setTxState({ loading: false, error: null, success: false })
  };
};

// Hook para Profile Registry
export const useProfile = () => {
  const { provider, signer, account, isConnected } = useWeb3();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [txState, setTxState] = useState<TransactionState>({
    loading: false,
    error: null,
    success: false
  });

  const loadProfile = useCallback(async (address?: string) => {
    // Solo cargar si hay conexión completa
    if (!isConnected || !provider) {
      setProfile(null);
      setLoading(false);
      return;
    }
    
    const targetAddress = address || account;
    if (!targetAddress) {
      setProfile(null);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      console.log('🔍 Cargando perfil...');
      const service = new ProfileRegistryService(provider, signer);
      const userProfile = await service.getProfile(targetAddress);
      setProfile(userProfile);
      console.log('✅ Perfil cargado:', userProfile);
    } catch (error) {
      console.error('❌ Error loading profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [isConnected, provider, signer, account]);

  const registerProfile = async (
    name: string,
    description: string, 
    metadataURI: string, 
    profileType: number, 
    acceptDisclaimer: boolean
  ) => {
    console.log('🔍 useProfile.registerProfile - Verificando conexión:', {
      isConnected,
      provider: !!provider,
      signer: !!signer,
      account
    });
    
    if (!isConnected || !provider || !signer) {
      const errorMsg = !isConnected ? 'Wallet not connected' : 
                      !provider ? 'Provider not available' : 
                      !signer ? 'Signer not available' : 'Unknown connection error';
      throw new Error(errorMsg);
    }
    
    setTxState({ loading: true, error: null, success: false });
    
    try {
      console.log('🔍 useProfile.registerProfile - Llamando al servicio con:', {
        name,
        description,
        metadataURI,
        profileType,
        acceptDisclaimer
      });
      
      const service = new ProfileRegistryService(provider, signer);
      const tx = await service.registerProfile(name, description, metadataURI, profileType, acceptDisclaimer);
      console.log('🔍 useProfile.registerProfile - Transacción enviada:', tx);
      
      await tx.wait();
      console.log('🔍 useProfile.registerProfile - Transacción confirmada');
      
      setTxState({ loading: false, error: null, success: true });
      await loadProfile(); // Recargar perfil
      return tx;
    } catch (error: any) {
      console.error('❌ useProfile.registerProfile - Error:', error);
      setTxState({ loading: false, error: error.message, success: false });
      throw error;
    }
  };

  const updateProfile = async (name: string, description: string, metadataURI: string) => {
    if (!isConnected || !provider || !signer) {
      const errorMsg = !isConnected ? 'Wallet not connected' : 
                      !provider ? 'Provider not available' : 
                      !signer ? 'Signer not available' : 'Unknown connection error';
      throw new Error(errorMsg);
    }
    
    setTxState({ loading: true, error: null, success: false });
    
    try {
      const service = new ProfileRegistryService(provider, signer);
      const tx = await service.updateProfile(name, description, metadataURI);
      await tx.wait();
      setTxState({ loading: false, error: null, success: true });
      await loadProfile(); // Recargar perfil
      return tx;
    } catch (error: any) {
      setTxState({ loading: false, error: error.message, success: false });
      throw error;
    }
  };

  // Cargar perfil cuando cambie la conexión
  useEffect(() => {
    if (isConnected && provider && account) {
      loadProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [isConnected, provider, account]);

  return {
    profile,
    loading,
    txState,
    registerProfile,
    updateProfile,
    loadProfile,
    clearTxState: () => setTxState({ loading: false, error: null, success: false })
  };
};

// Hook para Skills
export const useSkills = () => {
  const { provider, signer, account, isConnected } = useWeb3();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [userSkills, setUserSkills] = useState<DeclaredSkill[]>([]);
  const [loading, setLoading] = useState(false);
  const [txState, setTxState] = useState<TransactionState>({
    loading: false,
    error: null,
    success: false
  });

  const loadSkills = useCallback(async () => {
    // Solo cargar si hay conexión completa
    if (!isConnected || !provider) {
      setSkills([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      console.log('🔍 Cargando skills...');
      const service = new SkillSystemService(provider, signer);
      const allSkills = await service.getAllSkills();
      setSkills(allSkills);
      console.log('✅ Skills cargados:', allSkills.length);
    } catch (error) {
      console.error('❌ Error loading skills:', error);
      setSkills([]);
    } finally {
      setLoading(false);
    }
  }, [isConnected, provider, signer]);

  const loadUserSkills = useCallback(async (address?: string) => {
    // Solo cargar si hay conexión completa
    if (!isConnected || !provider) {
      setUserSkills([]);
      return;
    }
    
    const targetAddress = address || account;
    if (!targetAddress) return;
    
    try {
      console.log('🔍 Cargando skills del usuario...');
      const service = new SkillSystemService(provider, signer);
      const declaredSkills = await service.getUserDeclaredSkills(targetAddress);
      setUserSkills(declaredSkills);
      console.log('✅ Skills del usuario cargados:', declaredSkills.length);
    } catch (error) {
      console.error('❌ Error loading user skills:', error);
      setUserSkills([]);
    }
  }, [isConnected, provider, signer, account]);

  const createSkill = async (name: string, category: string) => {
    if (!isConnected || !provider || !signer) throw new Error('Wallet not connected');
    
    setTxState({ loading: true, error: null, success: false });
    
    try {
      const service = new SkillSystemService(provider, signer);
      const tx = await service.createSkill(name, category);
      await tx.wait();
      setTxState({ loading: false, error: null, success: true });
      await loadSkills(); // Recargar skills
      return tx;
    } catch (error: any) {
      setTxState({ loading: false, error: error.message, success: false });
      throw error;
    }
  };

  const declareSkill = async (skillId: number, level: number) => {
    if (!isConnected || !provider || !signer) throw new Error('Wallet not connected');
    
    setTxState({ loading: true, error: null, success: false });
    
    try {
      const service = new SkillSystemService(provider, signer);
      const tx = await service.declareSkill(skillId, level);
      await tx.wait();
      setTxState({ loading: false, error: null, success: true });
      await loadUserSkills(); // Recargar skills del usuario
      return tx;
    } catch (error: any) {
      setTxState({ loading: false, error: error.message, success: false });
      throw error;
    }
  };

  // Cargar skills cuando cambie la conexión
  useEffect(() => {
    if (isConnected && provider) {
      loadSkills();
      if (account) {
        loadUserSkills();
      }
    } else {
      setSkills([]);
      setUserSkills([]);
      setLoading(false);
    }
  }, [isConnected, provider, account]);

  return {
    skills,
    userSkills,
    loading,
    txState,
    createSkill,
    declareSkill,
    loadSkills,
    loadUserSkills,
    clearTxState: () => setTxState({ loading: false, error: null, success: false })
  };
};

// Hook para Time Registry
export const useTimeRegistry = () => {
  const { provider, signer, account, isConnected } = useWeb3();
  const [timeRecords, setTimeRecords] = useState<TimeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [txState, setTxState] = useState<TransactionState>({
    loading: false,
    error: null,
    success: false
  });

  const loadTimeRecords = useCallback(async (address?: string) => {
    // Solo cargar si hay conexión completa
    if (!isConnected || !provider) {
      setTimeRecords([]);
      setLoading(false);
      return;
    }
    
    const targetAddress = address || account;
    if (!targetAddress) return;
    
    try {
      setLoading(true);
      console.log('🔍 Cargando registros de tiempo...');
      const service = new TimeRegistryService(provider, signer);
      const records = await service.getUserTimeRecords(targetAddress);
      setTimeRecords(records);
      console.log('✅ Registros de tiempo cargados:', records.length);
    } catch (error) {
      console.error('❌ Error loading time records:', error);
      setTimeRecords([]);
    } finally {
      setLoading(false);
    }
  }, [isConnected, provider, signer, account]);

  const registerTime = async (
    company: string,
    startTime: number,
    endTime: number,
    description: string,
    skillIds: number[]
  ) => {
    if (!isConnected || !provider || !signer) throw new Error('Wallet not connected');
    
    setTxState({ loading: true, error: null, success: false });
    
    try {
      const service = new TimeRegistryService(provider, signer);
      const tx = await service.registerTime(company, startTime, endTime, description, skillIds);
      await tx.wait();
      setTxState({ loading: false, error: null, success: true });
      await loadTimeRecords(); // Recargar registros
      return tx;
    } catch (error: any) {
      setTxState({ loading: false, error: error.message, success: false });
      throw error;
    }
  };

  const validateTimeRecord = async (recordId: number) => {
    if (!isConnected || !provider || !signer) throw new Error('Wallet not connected');
    
    setTxState({ loading: true, error: null, success: false });
    
    try {
      const service = new TimeRegistryService(provider, signer);
      const tx = await service.validateTimeRecord(recordId);
      await tx.wait();
      setTxState({ loading: false, error: null, success: true });
      await loadTimeRecords(); // Recargar registros
      return tx;
    } catch (error: any) {
      setTxState({ loading: false, error: error.message, success: false });
      throw error;
    }
  };

  // Cargar registros cuando cambie la conexión
  useEffect(() => {
    if (isConnected && provider && account) {
      loadTimeRecords();
    } else {
      setTimeRecords([]);
      setLoading(false);
    }
  }, [isConnected, provider, account]);

  return {
    timeRecords,
    loading,
    txState,
    registerTime,
    validateTimeRecord,
    loadTimeRecords,
    clearTxState: () => setTxState({ loading: false, error: null, success: false })
  };
};

// Hook para Marketplace
export const useMarketplace = () => {
  const { provider, signer, account, isConnected } = useWeb3();
  const [services, setServices] = useState<Service[]>([]);
  const [userServices, setUserServices] = useState<Service[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [txState, setTxState] = useState<TransactionState>({
    loading: false,
    error: null,
    success: false
  });

  const loadServices = useCallback(async () => {
    // Solo cargar si hay conexión completa
    if (!isConnected || !provider) {
      setServices([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      console.log('🔍 Cargando servicios...');
      const service = new P2PMarketplaceService(provider, signer);
      const allServices = await service.getAllServices();
      setServices(allServices);
      console.log('✅ Servicios cargados:', allServices.length);
    } catch (error) {
      console.error('❌ Error loading services:', error);
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, [isConnected, provider, signer]);

  const loadUserServices = useCallback(async (address?: string) => {
    // Solo cargar si hay conexión completa
    if (!isConnected || !provider) {
      setUserServices([]);
      return;
    }
    
    const targetAddress = address || account;
    if (!targetAddress) return;
    
    try {
      console.log('🔍 Cargando servicios del usuario...');
      const service = new P2PMarketplaceService(provider, signer);
      const providerServices = await service.getProviderServices(targetAddress);
      setUserServices(providerServices);
      console.log('✅ Servicios del usuario cargados:', providerServices.length);
    } catch (error) {
      console.error('❌ Error loading user services:', error);
      setUserServices([]);
    }
  }, [isConnected, provider, signer, account]);

  const loadOrders = useCallback(async (address?: string) => {
    // Solo cargar si hay conexión completa
    if (!isConnected || !provider) {
      setOrders([]);
      return;
    }
    
    const targetAddress = address || account;
    if (!targetAddress) return;
    
    try {
      console.log('🔍 Cargando órdenes...');
      const service = new P2PMarketplaceService(provider, signer);
      const allOrders = await service.getClientOrders(targetAddress);
      setOrders(allOrders);
      setUserOrders(allOrders); // Para compatibilidad con el Dashboard
      console.log('✅ Órdenes cargadas:', allOrders.length);
    } catch (error) {
      console.error('❌ Error loading orders:', error);
      setOrders([]);
      setUserOrders([]);
    }
  }, [isConnected, provider, signer, account]);

  const createService = async (
    title: string,
    description: string,
    pricePerHour: string,
    skillIds: number[]
  ) => {
    if (!isConnected || !provider || !signer) throw new Error('Wallet not connected');
    
    setTxState({ loading: true, error: null, success: false });
    
    try {
      const service = new P2PMarketplaceService(provider, signer);
      const tx = await service.createService(title, description, pricePerHour, skillIds);
      await tx.wait();
      setTxState({ loading: false, error: null, success: true });
      await loadServices(); // Recargar servicios
      await loadUserServices(); // Recargar servicios del usuario
      return tx;
    } catch (error: any) {
      setTxState({ loading: false, error: error.message, success: false });
      throw error;
    }
  };

  const createOrder = async (serviceId: number, hours: number, description: string) => {
    if (!isConnected || !provider || !signer) throw new Error('Wallet not connected');
    
    setTxState({ loading: true, error: null, success: false });
    
    try {
      const service = new P2PMarketplaceService(provider, signer);
      const tx = await service.createOrder(serviceId, hours, description);
      await tx.wait();
      setTxState({ loading: false, error: null, success: true });
      await loadOrders(); // Recargar órdenes
      return tx;
    } catch (error: any) {
      setTxState({ loading: false, error: error.message, success: false });
      throw error;
    }
  };

  const acceptOrder = async (orderId: number) => {
    if (!isConnected || !provider || !signer) throw new Error('Wallet not connected');
    
    setTxState({ loading: true, error: null, success: false });
    
    try {
      const service = new P2PMarketplaceService(provider, signer);
      const tx = await service.acceptOrder(orderId);
      await tx.wait();
      setTxState({ loading: false, error: null, success: true });
      await loadOrders(); // Recargar órdenes
      return tx;
    } catch (error: any) {
      setTxState({ loading: false, error: error.message, success: false });
      throw error;
    }
  };

  const completeOrder = async (orderId: number) => {
    if (!isConnected || !provider || !signer) throw new Error('Wallet not connected');
    
    setTxState({ loading: true, error: null, success: false });
    
    try {
      const service = new P2PMarketplaceService(provider, signer);
      const tx = await service.completeOrder(orderId);
      await tx.wait();
      setTxState({ loading: false, error: null, success: true });
      await loadOrders(); // Recargar órdenes
      return tx;
    } catch (error: any) {
      setTxState({ loading: false, error: error.message, success: false });
      throw error;
    }
  };

  // Cargar datos cuando cambie la conexión
  useEffect(() => {
    if (isConnected && provider) {
      loadServices();
      if (account) {
        loadUserServices();
        loadOrders();
      }
    } else {
      setServices([]);
      setUserServices([]);
      setOrders([]);
      setUserOrders([]);
      setLoading(false);
    }
  }, [isConnected, provider, account]);

  return {
    services,
    userServices,
    orders,
    userOrders,
    loading,
    txState,
    createService,
    createOrder,
    acceptOrder,
    completeOrder,
    loadServices,
    loadUserServices,
    loadOrders,
    clearTxState: () => setTxState({ loading: false, error: null, success: false })
  };
};

// Hook para Profile Registry con IPFS
export const useProfileIPFS = () => {
  const { provider, signer, account, isConnected } = useWeb3();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [txState, setTxState] = useState<TransactionState>({
    loading: false,
    error: null,
    success: false
  });

  const loadProfile = useCallback(async (address?: string) => {
    // Solo cargar si hay conexión completa
    if (!isConnected || !provider) {
      setProfile(null);
      setLoading(false);
      return;
    }
    
    const targetAddress = address || account;
    if (!targetAddress) {
      setProfile(null);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      console.log('🔍 Cargando perfil desde IPFS...');
      const service = new ProfileRegistryIPFSService();
      const userProfile = await service.getProfileFromIPFS(targetAddress);
      setProfile(userProfile);
      console.log('✅ Perfil cargado desde IPFS:', userProfile);
    } catch (error) {
      console.error('❌ Error loading profile from IPFS:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [isConnected, provider, account]);

  const registerProfile = async (
    name: string,
    description: string, 
    profileType: number, 
    acceptDisclaimer: boolean,
    additionalData: any = {}
  ) => {
    console.log('🔍 useProfileIPFS.registerProfile - Verificando conexión:', {
      isConnected,
      provider: !!provider,
      signer: !!signer,
      account
    });
    
    if (!isConnected || !provider || !signer) {
      const errorMsg = !isConnected ? 'Wallet not connected' : 
                      !provider ? 'Provider not available' : 
                      !signer ? 'Signer not available' : 'Unknown connection error';
      throw new Error(errorMsg);
    }
    
    setTxState({ loading: true, error: null, success: false });
    
    try {
      console.log('🔍 useProfileIPFS.registerProfile - Llamando al servicio IPFS con:', {
        name,
        description,
        profileType,
        acceptDisclaimer,
        additionalData: {
          ...additionalData,
          walletAddress: account
        }
      });
      
      const service = new ProfileRegistryIPFSService();
      const result = await service.registerProfileWithIPFS(
        name, 
        description, 
        profileType, 
        acceptDisclaimer,
        {
          ...additionalData,
          walletAddress: account
        }
      );
      
      console.log('🔍 useProfileIPFS.registerProfile - Respuesta del servicio IPFS:', result);
      
      setTxState({ loading: false, error: null, success: true });
      
      // Recargar perfil después del registro
      await loadProfile();
      
      return result;
    } catch (error: any) {
      console.error('❌ useProfileIPFS.registerProfile - Error:', error);
      setTxState({ loading: false, error: error.message, success: false });
      throw error;
    }
  };

  const updateProfile = async (name: string, description: string, additionalData: any = {}) => {
    if (!isConnected || !provider || !signer || !account) {
      throw new Error('Wallet not connected');
    }
    
    setTxState({ loading: true, error: null, success: false });
    
    try {
      console.log('🔍 useProfileIPFS.updateProfile - Llamando al servicio IPFS con:', {
        name,
        description,
        additionalData
      });
      
      const service = new ProfileRegistryIPFSService();
      const result = await service.updateProfileInIPFS(account, name, description, additionalData);
      
      console.log('🔍 useProfileIPFS.updateProfile - Respuesta del servicio IPFS:', result);
      
      setTxState({ loading: false, error: null, success: true });
      
      // Recargar perfil después de la actualización
      await loadProfile();
      
      return result;
    } catch (error: any) {
      console.error('❌ useProfileIPFS.updateProfile - Error:', error);
      setTxState({ loading: false, error: error.message, success: false });
      throw error;
    }
  };

  // Cargar perfil cuando cambie la conexión
  useEffect(() => {
    if (isConnected && provider && account) {
      loadProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [isConnected, provider, account, loadProfile]);

  return {
    profile,
    loading,
    txState,
    registerProfile,
    updateProfile,
    loadProfile,
    clearTxState: () => setTxState({ loading: false, error: null, success: false })
  };
};

