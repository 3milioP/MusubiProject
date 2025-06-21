import { useState, useEffect } from 'react';

// Datos mock para testing
const MOCK_PROFILE = {
  isCompany: false,
  isActive: true,
  metadataURI: 'ipfs://mock-profile-hash'
};

const MOCK_SKILLS = [
  {
    id: 1,
    name: 'JavaScript',
    category: 'Desarrollo',
    level: 4,
    isValidated: true,
    validatedBy: '0x123...456',
    validatedAt: Date.now() - 86400000, // 1 día atrás
    description: 'Desarrollo con JavaScript moderno, ES6+, frameworks como React y Node.js'
  },
  {
    id: 2,
    name: 'React.js',
    category: 'Desarrollo',
    level: 5,
    isValidated: true,
    validatedBy: '0x789...abc',
    validatedAt: Date.now() - 172800000, // 2 días atrás
    description: 'Desarrollo de aplicaciones web con React, hooks, context, y ecosistema completo'
  },
  {
    id: 3,
    name: 'Blockchain',
    category: 'Desarrollo',
    level: 3,
    isValidated: false,
    validatedBy: null,
    validatedAt: null,
    description: 'Desarrollo de smart contracts con Solidity, Web3.js, y DApps'
  },
  {
    id: 4,
    name: 'UI/UX Design',
    category: 'Diseño',
    level: 4,
    isValidated: true,
    validatedBy: '0xdef...789',
    validatedAt: Date.now() - 259200000, // 3 días atrás
    description: 'Diseño de interfaces de usuario, experiencia de usuario, prototipado'
  }
];

const MOCK_TIME_RECORDS = [
  {
    id: 1,
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Ayer
    hours: 8,
    description: 'Desarrollo de componentes React para dashboard',
    project: 'Proyecto Musubi',
    skills: ['React.js', 'JavaScript'],
    isValidated: true,
    validatedBy: '0x123...456',
    validatedAt: Date.now() - 43200000 // 12 horas atrás
  },
  {
    id: 2,
    date: new Date(Date.now() - 172800000).toISOString().split('T')[0], // Hace 2 días
    hours: 6,
    description: 'Implementación de smart contracts',
    project: 'Proyecto Musubi',
    skills: ['Blockchain', 'Solidity'],
    isValidated: false,
    validatedBy: null,
    validatedAt: null
  },
  {
    id: 3,
    date: new Date(Date.now() - 259200000).toISOString().split('T')[0], // Hace 3 días
    hours: 7,
    description: 'Diseño de interfaz de usuario',
    project: 'Proyecto Cliente A',
    skills: ['UI/UX Design'],
    isValidated: true,
    validatedBy: '0xdef...789',
    validatedAt: Date.now() - 172800000 // 2 días atrás
  }
];

const MOCK_SERVICES = [
  {
    id: 1,
    provider: '0x742d35Cc6634C0532925a3b8D4C9db96590e4CAF',
    title: 'Desarrollo Frontend React',
    description: 'Desarrollo de aplicaciones web modernas con React, TypeScript y Material-UI. Experiencia en hooks, context, y mejores prácticas.',
    pricePerHour: 50,
    category: 'Desarrollo',
    isActive: true,
    createdAt: Date.now() - 604800000 // 1 semana atrás
  },
  {
    id: 2,
    provider: '0x123456789abcdef123456789abcdef123456789a',
    title: 'Consultoría Blockchain',
    description: 'Asesoramiento en implementación de soluciones blockchain, smart contracts y tokenización.',
    pricePerHour: 80,
    category: 'Consultoría',
    isActive: true,
    createdAt: Date.now() - 1209600000 // 2 semanas atrás
  },
  {
    id: 3,
    provider: '0xabcdef123456789abcdef123456789abcdef1234',
    title: 'Diseño UI/UX',
    description: 'Diseño de interfaces de usuario intuitivas y experiencias de usuario optimizadas para aplicaciones web y móviles.',
    pricePerHour: 45,
    category: 'Diseño',
    isActive: true,
    createdAt: Date.now() - 432000000 // 5 días atrás
  }
];

const MOCK_ORDERS = [
  {
    id: 1,
    service: MOCK_SERVICES[1], // Consultoría Blockchain
    client: '0x742d35Cc6634C0532925a3b8D4C9db96590e4CAF',
    provider: '0x123456789abcdef123456789abcdef123456789a',
    totalAmount: 400, // 5 horas * 80 KRM
    status: 1, // Aceptada
    createdAt: Date.now() - 172800000, // 2 días atrás
    completedAt: 0
  },
  {
    id: 2,
    service: MOCK_SERVICES[2], // Diseño UI/UX
    client: '0x987654321fedcba987654321fedcba9876543210',
    provider: '0xabcdef123456789abcdef123456789abcdef1234',
    totalAmount: 360, // 8 horas * 45 KRM
    status: 2, // Completada
    createdAt: Date.now() - 604800000, // 1 semana atrás
    completedAt: Date.now() - 259200000 // 3 días atrás
  }
];

// Hook para perfil
export const useProfile = () => {
  const [profile, setProfile] = useState(MOCK_PROFILE);
  const [loading, setLoading] = useState(false);
  const [txState, setTxState] = useState({
    loading: false,
    success: false,
    error: null as string | null
  });

  const registerProfile = async (isCompany: boolean, metadataURI: string) => {
    setTxState({ loading: true, success: false, error: null });
    
    // Simular transacción
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setProfile({
      isCompany,
      isActive: true,
      metadataURI
    });
    
    setTxState({ loading: false, success: true, error: null });
  };

  const updateProfile = async (metadataURI: string) => {
    setTxState({ loading: true, success: false, error: null });
    
    // Simular transacción
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setProfile(prev => ({ ...prev, metadataURI }));
    
    setTxState({ loading: false, success: true, error: null });
  };

  const clearTxState = () => {
    setTxState({ loading: false, success: false, error: null });
  };

  return {
    profile,
    loading,
    txState,
    registerProfile,
    updateProfile,
    clearTxState
  };
};

// Hook para habilidades
export const useSkills = () => {
  const [skills, setSkills] = useState(MOCK_SKILLS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const declareSkill = async (name: string, category: string, level: number, description: string) => {
    setLoading(true);
    
    // Simular transacción
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newSkill = {
      id: skills.length + 1,
      name,
      category,
      level,
      isValidated: false,
      validatedBy: null,
      validatedAt: null,
      description
    };
    
    setSkills(prev => [...prev, newSkill]);
    setLoading(false);
  };

  const validateSkill = async (skillId: number) => {
    setLoading(true);
    
    // Simular transacción
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setSkills(prev => prev.map(skill => 
      skill.id === skillId 
        ? { ...skill, isValidated: true, validatedBy: '0x742d35Cc6634C0532925a3b8D4C9db96590e4CAF', validatedAt: Date.now() }
        : skill
    ));
    
    setLoading(false);
  };

  const refreshSkills = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
  };

  return {
    skills,
    loading,
    error,
    declareSkill,
    validateSkill,
    refreshSkills
  };
};

// Hook para registro de tiempo
export const useTimeRegistry = () => {
  const [timeRecords, setTimeRecords] = useState(MOCK_TIME_RECORDS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTimeRecord = async (date: string, hours: number, description: string, project: string, skills: string[]) => {
    setLoading(true);
    
    // Simular transacción
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newRecord = {
      id: timeRecords.length + 1,
      date,
      hours,
      description,
      project,
      skills,
      isValidated: false,
      validatedBy: null,
      validatedAt: null
    };
    
    setTimeRecords(prev => [...prev, newRecord]);
    setLoading(false);
  };

  const validateTimeRecord = async (recordId: number) => {
    setLoading(true);
    
    // Simular transacción
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setTimeRecords(prev => prev.map(record => 
      record.id === recordId 
        ? { ...record, isValidated: true, validatedBy: '0x742d35Cc6634C0532925a3b8D4C9db96590e4CAF', validatedAt: Date.now() }
        : record
    ));
    
    setLoading(false);
  };

  const refreshTimeRecords = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
  };

  return {
    timeRecords,
    loading,
    error,
    createTimeRecord,
    validateTimeRecord,
    refreshTimeRecords
  };
};

// Hook para marketplace
export const useMarketplace = () => {
  const [services, setServices] = useState(MOCK_SERVICES);
  const [orders, setOrders] = useState(MOCK_ORDERS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createService = async (title: string, description: string, pricePerHour: number, category: string) => {
    setLoading(true);
    
    // Simular transacción
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newService = {
      id: services.length + 1,
      provider: '0x742d35Cc6634C0532925a3b8D4C9db96590e4CAF',
      title,
      description,
      pricePerHour,
      category,
      isActive: true,
      createdAt: Date.now()
    };
    
    setServices(prev => [...prev, newService]);
    setLoading(false);
  };

  const createOrder = async (serviceId: number, totalAmount: number) => {
    setLoading(true);
    
    // Simular transacción
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const service = services.find(s => s.id === serviceId);
    if (service) {
      const newOrder = {
        id: orders.length + 1,
        service,
        client: '0x742d35Cc6634C0532925a3b8D4C9db96590e4CAF',
        provider: service.provider,
        totalAmount,
        status: 0, // Creada
        createdAt: Date.now(),
        completedAt: 0
      };
      
      setOrders(prev => [...prev, newOrder]);
    }
    
    setLoading(false);
  };

  const acceptOrder = async (orderId: number) => {
    setLoading(true);
    
    // Simular transacción
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setOrders(prev => prev.map(order => 
      order.id === orderId 
        ? { ...order, status: 1 } // Aceptada
        : order
    ));
    
    setLoading(false);
  };

  const completeOrder = async (orderId: number) => {
    setLoading(true);
    
    // Simular transacción
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setOrders(prev => prev.map(order => 
      order.id === orderId 
        ? { ...order, status: 2, completedAt: Date.now() } // Completada
        : order
    ));
    
    setLoading(false);
  };

  const refreshServices = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
  };

  const refreshOrders = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
  };

  return {
    services,
    orders,
    loading,
    error,
    createService,
    createOrder,
    acceptOrder,
    completeOrder,
    refreshServices,
    refreshOrders
  };
};

// Hook para KRM Token
export const useKRMToken = () => {
  const [balance, setBalance] = useState('1250.75');
  const [totalSupply, setTotalSupply] = useState('1000000');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const transfer = async (to: string, amount: number) => {
    setLoading(true);
    
    // Simular transacción
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newBalance = (parseFloat(balance) - amount).toString();
    setBalance(newBalance);
    
    setLoading(false);
  };

  const refreshBalance = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
  };

  return {
    balance,
    totalSupply,
    loading,
    error,
    transfer,
    refreshBalance
  };
};

