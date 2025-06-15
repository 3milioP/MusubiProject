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
  const { provider, signer, account } = useWeb3();
  const [balance, setBalance] = useState<string>('0');
  const [loading, setLoading] = useState(false);
  const [txState, setTxState] = useState<TransactionState>({
    loading: false,
    error: null,
    success: false
  });

  const service = provider ? new KRMTokenService(provider, signer) : null;

  const loadBalance = useCallback(async () => {
    if (!service || !account) return;
    
    try {
      setLoading(true);
      const userBalance = await service.getBalance(account);
      setBalance(userBalance);
    } catch (error) {
      console.error('Error loading KRM balance:', error);
    } finally {
      setLoading(false);
    }
  }, [service, account]);

  const transfer = async (to: string, amount: string) => {
    if (!service) throw new Error('Service not available');
    
    setTxState({ loading: true, error: null, success: false });
    
    try {
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
    loadBalance();
  }, [loadBalance]);

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
  const { provider, signer, account } = useWeb3();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [txState, setTxState] = useState<TransactionState>({
    loading: false,
    error: null,
    success: false
  });

  const service = provider ? new ProfileRegistryService(provider, signer) : null;

  const loadProfile = useCallback(async (address?: string) => {
    if (!service) return;
    
    const targetAddress = address || account;
    if (!targetAddress) return;
    
    try {
      setLoading(true);
      const userProfile = await service.getProfile(targetAddress);
      setProfile(userProfile);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  }, [service, account]);

  const registerProfile = async (isCompany: boolean, metadataURI: string) => {
    if (!service) throw new Error('Service not available');
    
    setTxState({ loading: true, error: null, success: false });
    
    try {
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
    if (!service) throw new Error('Service not available');
    
    setTxState({ loading: true, error: null, success: false });
    
    try {
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
    loadProfile();
  }, [loadProfile]);

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
  const { provider, signer, account } = useWeb3();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [userSkills, setUserSkills] = useState<DeclaredSkill[]>([]);
  const [loading, setLoading] = useState(false);
  const [txState, setTxState] = useState<TransactionState>({
    loading: false,
    error: null,
    success: false
  });

  const service = provider ? new SkillSystemService(provider, signer) : null;

  const loadSkills = useCallback(async () => {
    if (!service) return;
    
    try {
      setLoading(true);
      const allSkills = await service.getAllSkills();
      setSkills(allSkills);
    } catch (error) {
      console.error('Error loading skills:', error);
    } finally {
      setLoading(false);
    }
  }, [service]);

  const loadUserSkills = useCallback(async (address?: string) => {
    if (!service) return;
    
    const targetAddress = address || account;
    if (!targetAddress) return;
    
    try {
      const declaredSkills = await service.getUserDeclaredSkills(targetAddress);
      setUserSkills(declaredSkills);
    } catch (error) {
      console.error('Error loading user skills:', error);
    }
  }, [service, account]);

  const createSkill = async (name: string, category: string) => {
    if (!service) throw new Error('Service not available');
    
    setTxState({ loading: true, error: null, success: false });
    
    try {
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
    if (!service) throw new Error('Service not available');
    
    setTxState({ loading: true, error: null, success: false });
    
    try {
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
    loadSkills();
    loadUserSkills();
  }, [loadSkills, loadUserSkills]);

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
  const { provider, signer, account } = useWeb3();
  const [timeRecords, setTimeRecords] = useState<TimeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [txState, setTxState] = useState<TransactionState>({
    loading: false,
    error: null,
    success: false
  });

  const service = provider ? new TimeRegistryService(provider, signer) : null;

  const loadTimeRecords = useCallback(async (address?: string) => {
    if (!service) return;
    
    const targetAddress = address || account;
    if (!targetAddress) return;
    
    try {
      setLoading(true);
      const records = await service.getUserTimeRecords(targetAddress);
      setTimeRecords(records);
    } catch (error) {
      console.error('Error loading time records:', error);
    } finally {
      setLoading(false);
    }
  }, [service, account]);

  const registerTime = async (
    company: string,
    startTime: number,
    endTime: number,
    description: string,
    skillIds: number[]
  ) => {
    if (!service) throw new Error('Service not available');
    
    setTxState({ loading: true, error: null, success: false });
    
    try {
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
    if (!service) throw new Error('Service not available');
    
    setTxState({ loading: true, error: null, success: false });
    
    try {
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
    loadTimeRecords();
  }, [loadTimeRecords]);

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
  const { provider, signer, account } = useWeb3();
  const [services, setServices] = useState<Service[]>([]);
  const [userServices, setUserServices] = useState<Service[]>([]);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [txState, setTxState] = useState<TransactionState>({
    loading: false,
    error: null,
    success: false
  });

  const service = provider ? new P2PMarketplaceService(provider, signer) : null;

  const loadServices = useCallback(async () => {
    if (!service) return;
    
    try {
      setLoading(true);
      const allServices = await service.getAllServices();
      setServices(allServices);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  }, [service]);

  const loadUserServices = useCallback(async (address?: string) => {
    if (!service) return;
    
    const targetAddress = address || account;
    if (!targetAddress) return;
    
    try {
      const providerServices = await service.getProviderServices(targetAddress);
      setUserServices(providerServices);
    } catch (error) {
      console.error('Error loading user services:', error);
    }
  }, [service, account]);

  const loadUserOrders = useCallback(async (address?: string) => {
    if (!service) return;
    
    const targetAddress = address || account;
    if (!targetAddress) return;
    
    try {
      const clientOrders = await service.getClientOrders(targetAddress);
      setUserOrders(clientOrders);
    } catch (error) {
      console.error('Error loading user orders:', error);
    }
  }, [service, account]);

  const createService = async (
    title: string,
    description: string,
    pricePerHour: string,
    skillIds: number[]
  ) => {
    if (!service) throw new Error('Service not available');
    
    setTxState({ loading: true, error: null, success: false });
    
    try {
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
    if (!service) throw new Error('Service not available');
    
    setTxState({ loading: true, error: null, success: false });
    
    try {
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
    loadServices();
    loadUserServices();
    loadUserOrders();
  }, [loadServices, loadUserServices, loadUserOrders]);

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

