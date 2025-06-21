// Hooks personalizados para interactuar con los contratos
import { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import {
  KRMTokenService,
  ProfileRegistryService,
  SkillSystemService,
  TimeRegistryService,
  P2PMarketplaceService
} from '../services/contracts';
import {
  Profile,
  Skill,
  DeclaredSkill,
  TimeRecord,
  Service,
  Order,
  TransactionState
} from '../types';

// Hook para KRM Token
export const useKRMToken = () => {
  const { provider, signer, account, isConnected } = useWeb3();
  const [balance, setBalance] = useState<string>('0');
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
      return;
    }
    
    try {
      setLoading(true);
      // Crear servicio solo cuando se necesita
      const service = new KRMTokenService(provider, signer);
      const userBalance = await service.getBalance(account);
      setBalance(userBalance);
    } catch (error) {
      console.error('Error loading KRM balance:', error);
      setBalance('0');
    } finally {
      setLoading(false);
    }
  }, [provider, signer, account, isConnected]);

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

  useEffect(() => {
    if (isConnected && provider && account) {
      loadBalance();
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
      return;
    }
    
    const targetAddress = address || account;
    if (!targetAddress) return;
    
    try {
      setLoading(true);
      // Crear servicio solo cuando se necesita
      const service = new ProfileRegistryService(provider, signer);
      const userProfile = await service.getProfile(targetAddress);
      setProfile(userProfile);
    } catch (error) {
      console.error('Error loading profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [provider, signer, account, isConnected]);

  const registerProfile = async (isCompany: boolean, metadataURI: string) => {
    if (!isConnected || !provider || !signer) throw new Error('Wallet not connected');
    
    setTxState({ loading: true, error: null, success: false });
    
    try {
      const service = new ProfileRegistryService(provider, signer);
      const tx = await service.registerProfile(isCompany, metadataURI);
      await tx.wait();
      setTxState({ loading: false, error: null, success: true });
      await loadProfile(); // Recargar perfil
      return tx;
    } catch (error: any) {
      setTxState({ loading: false, error: error.message, success: false });
      throw error;
    }
  };

  const updateProfile = async (metadataURI: string) => {
    if (!isConnected || !provider || !signer) throw new Error('Wallet not connected');
    
    setTxState({ loading: true, error: null, success: false });
    
    try {
      const service = new ProfileRegistryService(provider, signer);
      const tx = await service.updateProfile(metadataURI);
      await tx.wait();
      setTxState({ loading: false, error: null, success: true });
      await loadProfile(); // Recargar perfil
      return tx;
    } catch (error: any) {
      setTxState({ loading: false, error: error.message, success: false });
      throw error;
    }
  };

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
      return;
    }
    
    try {
      setLoading(true);
      // Crear servicio solo cuando se necesita
      const service = new SkillSystemService(provider, signer);
      const allSkills = await service.getAllSkills();
      setSkills(allSkills);
    } catch (error) {
      console.error('Error loading skills:', error);
      setSkills([]);
    } finally {
      setLoading(false);
    }
  }, [provider, signer, isConnected]);

  const loadUserSkills = useCallback(async (address?: string) => {
    // Solo cargar si hay conexión completa
    if (!isConnected || !provider) {
      setUserSkills([]);
      return;
    }
    
    const targetAddress = address || account;
    if (!targetAddress) return;
    
    try {
      // Crear servicio solo cuando se necesita
      const service = new SkillSystemService(provider, signer);
      const declaredSkills = await service.getUserDeclaredSkills(targetAddress);
      setUserSkills(declaredSkills);
    } catch (error) {
      console.error('Error loading user skills:', error);
      setUserSkills([]);
    }
  }, [provider, signer, account, isConnected]);

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
      await loadUserSkills(); // Recargar user skills
      return tx;
    } catch (error: any) {
      setTxState({ loading: false, error: error.message, success: false });
      throw error;
    }
  };

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
  }, [isConnected, provider, account, loadSkills, loadUserSkills]);

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
      return;
    }
    
    const targetAddress = address || account;
    if (!targetAddress) return;
    
    try {
      setLoading(true);
      // Crear servicio solo cuando se necesita
      const service = new TimeRegistryService(provider, signer);
      const records = await service.getUserTimeRecords(targetAddress);
      setTimeRecords(records);
    } catch (error) {
      console.error('Error loading time records:', error);
      setTimeRecords([]);
    } finally {
      setLoading(false);
    }
  }, [provider, signer, account, isConnected]);

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

  useEffect(() => {
    if (isConnected && provider && account) {
      loadTimeRecords();
    } else {
      setTimeRecords([]);
      setLoading(false);
    }
  }, [isConnected, provider, account, loadTimeRecords]);

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
      return;
    }
    
    try {
      setLoading(true);
      // Crear servicio solo cuando se necesita
      const service = new P2PMarketplaceService(provider, signer);
      const allServices = await service.getAllServices();
      setServices(allServices);
    } catch (error) {
      console.error('Error loading services:', error);
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, [provider, signer, isConnected]);

  const loadUserServices = useCallback(async (address?: string) => {
    // Solo cargar si hay conexión completa
    if (!isConnected || !provider) {
      setUserServices([]);
      return;
    }
    
    const targetAddress = address || account;
    if (!targetAddress) return;
    
    try {
      // Crear servicio solo cuando se necesita
      const service = new P2PMarketplaceService(provider, signer);
      const providerServices = await service.getProviderServices(targetAddress);
      setUserServices(providerServices);
    } catch (error) {
      console.error('Error loading user services:', error);
      setUserServices([]);
    }
  }, [provider, signer, account, isConnected]);

  const loadUserOrders = useCallback(async (address?: string) => {
    // Solo cargar si hay conexión completa
    if (!isConnected || !provider) {
      setUserOrders([]);
      return;
    }
    
    const targetAddress = address || account;
    if (!targetAddress) return;
    
    try {
      // Crear servicio solo cuando se necesita
      const service = new P2PMarketplaceService(provider, signer);
      const clientOrders = await service.getClientOrders(targetAddress);
      setUserOrders(clientOrders);
    } catch (error) {
      console.error('Error loading user orders:', error);
      setUserOrders([]);
    }
  }, [provider, signer, account, isConnected]);

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
      await loadUserOrders(); // Recargar órdenes del usuario
      return tx;
    } catch (error: any) {
      setTxState({ loading: false, error: error.message, success: false });
      throw error;
    }
  };

  useEffect(() => {
    if (isConnected && provider) {
      loadServices();
      if (account) {
        loadUserServices();
        loadUserOrders();
      }
    } else {
      setServices([]);
      setUserServices([]);
      setUserOrders([]);
      setLoading(false);
    }
  }, [isConnected, provider, account, loadServices, loadUserServices, loadUserOrders]);

  return {
    services,
    userServices,
    userOrders,
    loading,
    txState,
    createService,
    createOrder,
    loadServices,
    loadUserServices,
    loadUserOrders,
    clearTxState: () => setTxState({ loading: false, error: null, success: false })
  };
};

