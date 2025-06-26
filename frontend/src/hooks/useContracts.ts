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
  User,
  Profile,
  Skill,
  DeclaredSkill,
  ProfessionalSkill,
  TimeRecord,
  Service,
  Order,
  TransactionState,
  Web3State,
  ContractSkill
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
      console.log('🔍 useKRMToken.loadBalance - No hay conexión completa:', {
        isConnected,
        hasProvider: !!provider,
        account
      });
      setBalance('0');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      console.log('🔍 useKRMToken.loadBalance - Cargando balance para cuenta:', account);
      
      // Crear una promesa con timeout
      const balancePromise = (async () => {
        const service = new KRMTokenService(provider, signer);
        console.log('🔍 useKRMToken.loadBalance - Servicio creado, llamando getBalance...');
        const balanceValue = await service.getBalance(account);
        console.log('🔍 useKRMToken.loadBalance - Balance obtenido:', balanceValue);
        return balanceValue;
      })();
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout: No se pudo obtener el balance en 10 segundos')), 10000)
      );
      
      const balanceValue = await Promise.race([balancePromise, timeoutPromise]) as string;
      console.log('🔍 useKRMToken.loadBalance - Balance final:', balanceValue);
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
    console.log('🔍 useKRMToken.useEffect - Estado de conexión:', {
      isConnected,
      hasProvider: !!provider,
      account,
      currentBalance: balance
    });
    
    if (isConnected && provider && account) {
      console.log('🔍 useKRMToken.useEffect - Ejecutando loadBalance...');
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
      console.log('🔍 useKRMToken.useEffect - No hay conexión completa, reseteando balance');
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
      console.log('🔍 useProfile.loadProfile - No hay conexión completa:', {
        isConnected,
        hasProvider: !!provider
      });
      setProfile(null);
      setLoading(false);
      return;
    }
    
    const targetAddress = address || account;
    if (!targetAddress) {
      console.log('🔍 useProfile.loadProfile - No hay dirección de cuenta');
      setProfile(null);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      console.log('🔍 useProfile.loadProfile - Cargando perfil para:', targetAddress);
      console.log('🔍 useProfile.loadProfile - Provider:', !!provider);
      console.log('🔍 useProfile.loadProfile - Signer:', !!signer);
      
      // PRIMERO: Intentar cargar desde la API
      console.log('🔍 useProfile.loadProfile - Intentando cargar desde API...');
      try {
        const apiResponse = await fetch(`http://localhost:5003/api/users/wallet/${targetAddress}`);
        if (apiResponse.ok) {
          const apiData = await apiResponse.json();
          console.log('🔍 useProfile.loadProfile - Datos de API:', apiData);
          
          if (apiData.success && apiData.user) {
            // Convertir datos de API a formato de perfil
            const profileFromAPI: Profile = {
              address: apiData.user.wallet_address,
              name: apiData.user.name,
              bio: apiData.user.description,
              isCompany: apiData.user.profile_type === 'company',
              isActive: true,
              metadataURI: `api_${apiData.user.id}`, // hash temporal
              karma: 0,
              isVerified: false,
              disclaimerAccepted: true,
              skills: apiData.user.skills || []
            };
            
            console.log('✅ Perfil cargado desde API:', profileFromAPI);
            setProfile(profileFromAPI);
            setLoading(false);
            return;
          }
        }
      } catch (apiError) {
        console.log('⚠️ Error cargando desde API:', apiError);
      }
      
      // SEGUNDO: Intentar cargar desde blockchain
      console.log('🔍 useProfile.loadProfile - Intentando cargar desde blockchain...');
      const service = new ProfileRegistryService(provider, signer);
      console.log('🔍 useProfile.loadProfile - Service creado');
      
      const userProfile = await service.getProfile(targetAddress);
      console.log('🔍 useProfile.loadProfile - Perfil obtenido de blockchain:', userProfile);
      
      if (userProfile) {
        console.log('✅ Perfil cargado exitosamente desde blockchain:', userProfile);
        setProfile(userProfile);
      } else {
        console.log('⚠️ No se encontró perfil en blockchain para:', targetAddress);
        setProfile(null);
      }
    } catch (error: any) {
      console.error('❌ Error loading profile:', error);
      console.error('❌ Error details:', {
        message: error?.message || 'Unknown error',
        stack: error?.stack || 'No stack trace',
        code: error?.code || 'No code'
      });
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [isConnected, provider, signer, account]);

  const registerProfile = async (
    metadataURI: string, 
    profileType: number
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
        metadataURI,
        profileType
      });
      
      const service = new ProfileRegistryService(provider, signer);
      const tx = await service.registerProfile(metadataURI, profileType);
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
    console.log('🔍 useProfile.useEffect - Estado de conexión:', {
      isConnected,
      hasProvider: !!provider,
      account,
      currentProfile: profile?.name
    });
    
    if (isConnected && provider && account) {
      console.log('🔍 useProfile.useEffect - Ejecutando loadProfile...');
      loadProfile();
    } else {
      console.log('🔍 useProfile.useEffect - No hay conexión completa, reseteando perfil');
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
  const [skills, setSkills] = useState<ContractSkill[]>([]);
  const [userSkills, setUserSkills] = useState<ProfessionalSkill[]>([]);
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
      
      // Llamar al endpoint de la API
      const response = await fetch('http://localhost:5003/api/skills/all');
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Skills cargados desde API:', result.data.skills.length);
        setSkills(result.data.skills);
      } else {
        console.error('❌ Error cargando skills desde API:', result.error);
        setSkills([]);
      }
    } catch (error) {
      console.error('❌ Error loading skills:', error);
      setSkills([]);
    } finally {
      setLoading(false);
    }
  }, [isConnected, provider]);

  const loadUserSkills = useCallback(async (address?: string) => {
    // Solo cargar si hay conexión completa
    if (!isConnected || !provider) {
      setUserSkills([]);
      setLoading(false);
      return;
    }
    
    const targetAddress = address || account;
    if (!targetAddress) return;
    
    try {
      setLoading(true);
      console.log('🔍 Cargando skills del usuario...');
      const service = new SkillSystemService(provider, signer);
      const declaredSkills = await service.getProfessionalSkills(targetAddress);
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
      console.log('🔍 useSkills.createSkill - Iniciando flujo completo...');
      console.log('📋 Datos:', { name, category, account });
      
      // 1. Llamar al endpoint de la API para subir a IPFS
      console.log('📤 Subiendo datos a IPFS...');
      const response = await fetch('http://localhost:5003/api/skills/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          category,
          description: `${name} - ${category}`
        })
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Error subiendo datos a IPFS');
      }
      
      console.log('✅ Datos subidos a IPFS:', result);
      
      // 2. Registrar en SkillSystem desde el frontend (requiere firma)
      console.log('⛓️ Registrando en blockchain...');
      const service = new SkillSystemService(provider, signer);
      const tx = await service.createSkill(result.ipfs_hash);
      
      console.log('🔄 Esperando confirmación de transacción...');
      const receipt = await tx.wait();
      
      console.log('✅ Habilidad creada exitosamente en blockchain:', receipt);
      
      setTxState({ loading: false, error: null, success: true });
      await loadSkills(); // Recargar skills
      
      return {
        ...result,
        blockchainTx: receipt.transactionHash,
        receipt
      };
    } catch (error: any) {
      console.error('❌ Error creating skill:', error);
      setTxState({ loading: false, error: error.message, success: false });
      throw error;
    }
  };

  const declareSkill = async (skillId: number, level: number) => {
    if (!isConnected || !provider || !signer) throw new Error('Wallet not connected');
    
    setTxState({ loading: true, error: null, success: false });
    
    try {
      console.log('🔍 useSkills.declareSkill - Llamando a la API con:', { skillId, level, account });
      
      // Llamar al endpoint de la API para declarar habilidad
      const response = await fetch('http://localhost:5003/api/skills/declare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          skillId,
          level,
          professional: account,
          description: `Declaración de habilidad nivel ${level}`,
          experience: 'Experiencia profesional',
          projects: [],
          certifications: []
        })
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Error declarando habilidad');
      }
      
      console.log('✅ Habilidad declarada exitosamente:', result);
      
      setTxState({ loading: false, error: null, success: true });
      await loadUserSkills(); // Recargar skills del usuario
      return result;
    } catch (error: any) {
      console.error('❌ Error declaring skill:', error);
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
    skillId: number,
    startTime: number,
    endTime: number,
    description: string
  ) => {
    if (!isConnected || !provider || !signer) throw new Error('Wallet not connected');
    
    setTxState({ loading: true, error: null, success: false });
    
    try {
      console.log('🔍 useTimeRegistry.registerTime - Iniciando flujo completo...');
      console.log('📋 Datos:', { company, skillId, startTime, endTime, description, account });
      
      // 1. Subir datos a IPFS
      console.log('📤 Subiendo datos de tiempo a IPFS...');
      const timeData = {
        company,
        skillId,
        startTime,
        endTime,
        description,
        professional: account,
        hoursWorked: Math.floor((endTime - startTime) / 3600), // Convertir segundos a horas
        hourlyRate: 50, // Tarifa por defecto
        registeredAt: new Date().toISOString(),
        type: 'time_registry'
      };
      
      const ipfsResponse = await fetch('http://localhost:5003/api/timeregistry/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(timeData)
      });
      
      const ipfsResult = await ipfsResponse.json();
      
      if (!ipfsResult.success) {
        throw new Error(ipfsResult.error || 'Error subiendo datos a IPFS');
      }
      
      console.log('✅ Datos subidos a IPFS:', ipfsResult);
      
      // 2. Registrar en blockchain
      console.log('⛓️ Registrando en blockchain...');
      const service = new TimeRegistryService(provider, signer);
      const hoursWorked = Math.floor((endTime - startTime) / 3600);
      const hourlyRate = 50; // Tarifa por defecto en wei
      
      const tx = await service.registerTime(skillId, ipfsResult.ipfs_hash, hoursWorked, hourlyRate);
      
      console.log('🔄 Esperando confirmación de transacción...');
      const receipt = await tx.wait();
      
      console.log('✅ Tiempo registrado exitosamente en blockchain:', receipt);
      
      setTxState({ loading: false, error: null, success: true });
      await loadTimeRecords(); // Recargar registros
      
      return {
        ...ipfsResult,
        blockchainTx: receipt.transactionHash,
        receipt
      };
    } catch (error: any) {
      console.error('❌ Error registering time:', error);
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
      return;
    }
    
    try {
      console.log('🔍 Cargando servicios...');
      const service = new P2PMarketplaceService(provider, signer);
      const allServices = await service.getAllServices();
      setServices(allServices);
      console.log('✅ Servicios cargados:', allServices.length);
    } catch (error) {
      console.error('❌ Error loading services:', error);
      setServices([]);
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
      setLoading(true);
      
      const loadAllData = async () => {
        try {
          await loadServices();
          if (account) {
            await loadUserServices();
            await loadOrders();
          }
        } catch (error) {
          console.error('❌ Error loading marketplace data:', error);
        } finally {
          setLoading(false);
        }
      };
      
      loadAllData();
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