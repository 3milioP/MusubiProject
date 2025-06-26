import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  CheckCircle,
  Error as ErrorIcon,
  Warning,
  PlayArrow,
  Stop,
  Refresh,
  ExpandMore,
  AccountBalance,
  Person,
  Work,
  Store,
  AccessTime,
  Send,
  Receipt,
  Build
} from '@mui/icons-material';
import { useWeb3 } from '../contexts/Web3Context';
import { useKRM } from '../contexts/KRMContext';
import { useProfile, useSkills, useTimeRegistry, useMarketplace, useProfileIPFS, useKRMToken } from '../hooks/useContracts';
import { formatTokenAmount } from '../utils/blockchain';
import IPFSStatus from '../components/IPFSStatus';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'warning' | 'pending';
  message: string;
  details?: any;
  timestamp: Date;
}

interface SystemStatus {
  blockchain: boolean;
  ipfs: boolean;
  api: boolean;
  frontend: boolean;
}

interface TestInput {
  toAddress?: string;
  amount?: string;
  skillName?: string;
  skillCategory?: string;
  skillLevel?: number;
  serviceTitle?: string;
  serviceDescription?: string;
  servicePrice?: string;
  timeCompany?: string;
  timeSkillId?: number;
  timeDescription?: string;
}

const DeveloperTools: React.FC = () => {
  const { isConnected, account, provider, signer } = useWeb3();
  const { balance, loadBalance } = useKRM();
  const { balance: krmBalance, transfer, loadBalance: loadKRMBalance } = useKRMToken();
  const { profile, loadProfile, registerProfile } = useProfile();
  const { profile: ipfsProfile, updateProfile: updateProfileIPFS, loadProfile: loadProfileIPFS } = useProfileIPFS();
  const { skills, userSkills, loadSkills, loadUserSkills, createSkill, declareSkill } = useSkills();
  const { timeRecords, loadTimeRecords, registerTime } = useTimeRegistry();
  const { userServices, userOrders, loadUserServices, loadOrders, createService, createOrder } = useMarketplace();
  const { registerProfile: registerProfileIPFS } = useProfileIPFS();

  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    blockchain: false,
    ipfs: false,
    api: false,
    frontend: true
  });
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [selectedTest, setSelectedTest] = useState<string>('all');
  const [testInput, setTestInput] = useState<TestInput>({});
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>('');

  // Definir todos los tests disponibles
  const availableTests = {
    // Tests de Sistema
    system: {
      name: 'Verificar Estado del Sistema',
      test: async () => {
        // Verificar estado del sistema
        const newStatus: SystemStatus = {
          blockchain: isConnected && !!provider,
          ipfs: false,
          api: false,
          frontend: true
        };

        // Verificar IPFS
        try {
          const response = await fetch('http://localhost:5001/api/v0/version', {
            method: 'POST'
          });
          newStatus.ipfs = response.ok;
        } catch (error) {
          console.log('IPFS no disponible');
        }

        // Verificar API
        try {
          const response = await fetch('http://localhost:5003/api/skills/all');
          newStatus.api = response.ok;
        } catch (error) {
          console.log('API no disponible');
        }

        setSystemStatus(newStatus);
        
        return {
          blockchain: newStatus.blockchain,
          ipfs: newStatus.ipfs,
          api: newStatus.api,
          frontend: newStatus.frontend
        };
      }
    },
    web3: {
      name: 'Verificar Conexión Web3',
      test: async () => {
        if (!isConnected) throw new Error('Wallet no conectada');
        return { account, chainId: await provider?.getNetwork() };
      }
    },

    // Tests de KRM Token
    krm: {
      name: 'Verificar Balance KRM',
      test: async () => {
        if (!isConnected) throw new Error('Wallet no conectada');
        
        console.log('🔍 Verificando balance KRM para:', account);
        
        // Recargar balance
        await loadBalance();
        await loadKRMBalance();
        
        console.log('✅ Balance actualizado:', balance);
        
        return { 
          balance: formatTokenAmount(balance),
          address: account,
          timestamp: new Date().toISOString()
        };
      }
    },
    krmTransfer: {
      name: 'Transferir KRM',
      test: async () => {
        if (!isConnected) throw new Error('Wallet no conectada');
        if (!testInput.toAddress || !testInput.amount) {
          throw new Error('Dirección y cantidad requeridas');
        }
        
        console.log('🔄 Iniciando transferencia KRM:', {
          to: testInput.toAddress,
          amount: testInput.amount,
          from: account
        });
        
        const tx = await transfer(testInput.toAddress, testInput.amount);
        console.log('📝 Transacción enviada:', tx);
        
        // Esperar a que se confirme la transacción si es una transacción real
        let receipt = null;
        if (tx && tx.wait) {
          console.log('⏳ Esperando confirmación...');
          receipt = await tx.wait();
          console.log('✅ Transacción confirmada en bloque:', receipt.blockNumber);
        }
        
        // Recargar balance después de la transferencia
        console.log('🔄 Actualizando balance...');
        await loadBalance();
        await loadKRMBalance();
        
        return { 
          to: testInput.toAddress, 
          amount: testInput.amount, 
          txHash: tx.hash || tx.txHash || 'N/A',
          blockNumber: receipt?.blockNumber || 'N/A',
          newBalance: balance,
          status: 'Transferencia completada exitosamente'
        };
      }
    },

    // Tests de Perfil
    profile: {
      name: 'Verificar Perfil (Blockchain + IPFS)',
      test: async () => {
        if (!isConnected) throw new Error('Wallet no conectada');
        
        console.log('🔍 Verificando perfil desde blockchain e IPFS...');
        
        // 1. Cargar perfil desde blockchain
        console.log('⛓️ Cargando perfil desde blockchain...');
        await loadProfile();
        
        // 2. Cargar perfil desde IPFS
        console.log('📥 Cargando perfil desde IPFS...');
        await loadProfileIPFS();
        
        console.log('✅ Perfil cargado:', {
          blockchain: profile,
          ipfs: ipfsProfile
        });
        
        return { 
          blockchainProfile: profile?.name || 'Sin perfil en blockchain',
          ipfsProfile: ipfsProfile?.name || 'Sin perfil en IPFS',
          hasBlockchainProfile: !!profile,
          hasIpfsProfile: !!ipfsProfile,
          status: 'Verificación completada'
        };
      }
    },
    profileRegister: {
      name: 'Registrar Perfil (IPFS + Blockchain)',
      test: async () => {
        if (!isConnected) throw new Error('Wallet no conectada');
        if (!testInput.skillName) {
          throw new Error('Nombre requerido');
        }
        
        console.log('🔄 Iniciando registro de perfil con flujo completo...');
        
        const profileData = {
          name: testInput.skillName,
          description: testInput.serviceDescription || 'Perfil de prueba',
          profileType: 0, // Professional
          acceptDisclaimer: true,
          additionalData: {
            location: 'Test Location',
            website: 'https://test.com',
            createdAt: new Date().toISOString()
          }
        };
        
        console.log('📋 Datos del perfil:', profileData);
        
        // 1. Registrar en IPFS
        console.log('📤 Subiendo datos a IPFS...');
        const ipfsResult = await registerProfileIPFS(
          profileData.name,
          profileData.description,
          profileData.profileType,
          profileData.acceptDisclaimer,
          {
            ...profileData.additionalData,
            walletAddress: account,
            email: `user_${Date.now()}@musubi.com`
          }
        );
        
        console.log('✅ Datos subidos a IPFS:', ipfsResult);
        
        // 2. Registrar hash en blockchain
        console.log('⛓️ Registrando hash en blockchain...');
        const blockchainResult = await registerProfile(
          ipfsResult.ipfs_hash || ipfsResult.metadataURI,
          profileData.profileType
        );
        
        console.log('✅ Hash registrado en blockchain:', blockchainResult);
        
        // 3. Recargar perfil en el hook useProfile para actualizar el Navbar
        console.log('🔄 Recargando perfil en el contexto principal...');
        await loadProfile();
        
        return { 
          profileData, 
          ipfsResult,
          blockchainResult,
          status: 'Perfil registrado exitosamente en IPFS y blockchain'
        };
      }
    },
    profileUpdate: {
      name: 'Actualizar Perfil (IPFS + Blockchain)',
      test: async () => {
        if (!isConnected) throw new Error('Wallet no conectada');
        if (!testInput.skillName) {
          throw new Error('Nombre requerido');
        }
        
        console.log('🔄 Iniciando actualización de perfil con flujo completo...');
        console.log('📋 Datos:', {
          name: testInput.skillName,
          description: testInput.serviceDescription || 'Descripción actualizada',
          account
        });
        
        // 1. Primero verificar si el perfil existe, si no, crearlo
        console.log('🔍 Verificando si el perfil existe...');
        let profileExists = false;
        try {
          const checkResponse = await fetch(`http://localhost:5003/api/users/wallet/${account}`);
          profileExists = checkResponse.ok;
        } catch (error) {
          console.log('⚠️ Error verificando perfil existente:', error);
        }
        
        let ipfsResult;
        
        if (!profileExists) {
          console.log('📝 Perfil no existe, creando primero...');
          // Crear perfil primero
          ipfsResult = await registerProfileIPFS(
            testInput.skillName,
            testInput.serviceDescription || 'Descripción inicial',
            0, // Professional
            true,
            {
              location: 'Ubicación inicial',
              website: 'https://initial.com',
              createdAt: new Date().toISOString(),
              walletAddress: account,
              email: `user_${Date.now()}@musubi.com`
            }
          );
          console.log('✅ Perfil creado inicialmente:', ipfsResult);
        }
        
        // 2. Actualizar en IPFS
        console.log('📤 Actualizando datos en IPFS...');
        ipfsResult = await updateProfileIPFS(
          testInput.skillName,
          testInput.serviceDescription || 'Descripción actualizada',
          {
            location: 'Ubicación actualizada',
            website: 'https://updated.com',
            updatedAt: new Date().toISOString()
          }
        );
        
        console.log('✅ Datos actualizados en IPFS:', ipfsResult);
        
        // 3. Actualizar hash en blockchain
        console.log('⛓️ Actualizando hash en blockchain...');
        const blockchainResult = await registerProfile(
          ipfsResult.ipfs_hash || ipfsResult.metadataURI,
          0 // Professional
        );
        
        console.log('✅ Hash actualizado en blockchain:', blockchainResult);
        
        // 4. Recargar perfil en el hook useProfile para actualizar el Navbar
        console.log('🔄 Recargando perfil en el contexto principal...');
        await loadProfile();
        
        return { 
          name: testInput.skillName,
          description: testInput.serviceDescription || 'Descripción actualizada',
          profileCreated: !profileExists,
          ipfsResult,
          blockchainResult,
          status: 'Perfil actualizado exitosamente en IPFS y blockchain'
        };
      }
    },

    // Tests de Habilidades
    skills: {
      name: 'Verificar Habilidades (General + Usuario)',
      test: async () => {
        if (!isConnected) throw new Error('Wallet no conectada');
        
        console.log('🔍 Cargando habilidades generales...');
        await loadSkills();
        
        console.log('🔍 Cargando habilidades del usuario...');
        await loadUserSkills();
        
        // Obtener información adicional de la API
        console.log('📊 Obteniendo estadísticas de habilidades...');
        let apiStats = null;
        try {
          const countResponse = await fetch('http://localhost:5003/api/skills/count');
          if (countResponse.ok) {
            apiStats = await countResponse.json();
          }
        } catch (error) {
          console.warn('⚠️ No se pudieron obtener estadísticas de la API:', error);
        }
        
        // Obtener habilidades del usuario desde la API
        let userSkillsFromAPI = [];
        try {
          const userSkillsResponse = await fetch(`http://localhost:5003/api/skills/user/${account}`);
          if (userSkillsResponse.ok) {
            const userSkillsData = await userSkillsResponse.json();
            userSkillsFromAPI = userSkillsData.data?.skills || [];
          }
        } catch (error) {
          console.warn('⚠️ No se pudieron obtener habilidades del usuario desde la API:', error);
        }
        
        return { 
          totalSkills: skills.length, 
          userSkills: userSkills.length,
          apiTotalSkills: apiStats?.data?.total_skills || 'N/A',
          userSkillsFromAPI: userSkillsFromAPI.length,
          userSkillsDetails: userSkills.map(skill => ({
            skillId: skill.skillId,
            name: skill.name,
            category: skill.category,
            level: skill.declaredLevel,
            isValidated: skill.isValidated
          })),
          userSkillsFromAPIDetails: userSkillsFromAPI.map((skill: any) => ({
            skillId: skill.id,
            name: skill.name,
            category: skill.category,
            level: skill.level,
            isValidated: skill.is_validated
          })),
          status: 'Habilidades cargadas exitosamente',
          note: 'Habilidades creadas: disponibles en el sistema. Habilidades declaradas: que el usuario ha declarado tener.'
        };
      }
    },
    skillCreate: {
      name: 'Crear Habilidad (IPFS + Blockchain)',
      test: async () => {
        if (!isConnected) throw new Error('Wallet no conectada');
        if (!testInput.skillName || !testInput.skillCategory) {
          throw new Error('Nombre y categoría requeridos');
        }
        
        console.log('🔄 Iniciando creación de habilidad con flujo completo...');
        console.log('📋 Datos de entrada:', {
          name: testInput.skillName,
          category: testInput.skillCategory,
          account,
          description: `Habilidad de ${testInput.skillCategory}`,
          tags: [testInput.skillCategory]
        });
        
        // Verificar que no existe una habilidad con el mismo nombre
        console.log('🔍 Verificando habilidades existentes...');
        try {
          const skillsResponse = await fetch('http://localhost:5003/api/skills/all');
          if (skillsResponse.ok) {
            const skillsData = await skillsResponse.json();
            const existingSkill = skillsData.data.skills.find((skill: any) => 
              skill.name && skill.name.toLowerCase() === (testInput.skillName || '').toLowerCase()
            );
            if (existingSkill) {
              console.warn('⚠️ Ya existe una habilidad con nombre similar');
            }
          }
        } catch (error) {
          console.warn('⚠️ No se pudieron verificar habilidades existentes:', error);
        }
        
        // Crear la habilidad
        console.log('📤 Creando habilidad en IPFS y blockchain...');
        const result = await createSkill(testInput.skillName, testInput.skillCategory);
        
        console.log('✅ Habilidad creada:', result);
        
        // Recargar habilidades para actualizar la UI
        console.log('🔄 Recargando lista de habilidades...');
        await loadSkills();
        
        return { 
          name: testInput.skillName, 
          category: testInput.skillCategory,
          creator: account,
          skillHash: result.skill_hash || result.ipfs_hash,
          blockchainTx: result.blockchain_tx || result.txHash,
          skillData: result.skill_data,
          status: 'Habilidad creada exitosamente en IPFS y blockchain'
        };
      }
    },
    skillDeclare: {
      name: 'Declarar Habilidad (IPFS + Blockchain)',
      test: async () => {
        if (!isConnected) throw new Error('Wallet no conectada');
        if (!testInput.timeSkillId || !testInput.skillLevel) {
          throw new Error('ID de habilidad y nivel requeridos');
        }
        
        console.log('🔄 Iniciando declaración de habilidad con flujo completo...');
        console.log('📋 Datos de entrada:', {
          skillId: testInput.timeSkillId,
          level: testInput.skillLevel,
          account,
          description: `Declaración de habilidad nivel ${testInput.skillLevel}`,
          experience: 'Experiencia profesional'
        });
        
        // Verificar que la habilidad existe antes de declararla
        console.log('🔍 Verificando que la habilidad existe...');
        try {
          const skillResponse = await fetch(`http://localhost:5003/api/skills/${testInput.timeSkillId}`);
          if (!skillResponse.ok) {
            throw new Error(`Habilidad con ID ${testInput.timeSkillId} no encontrada`);
          }
          const skillData = await skillResponse.json();
          console.log('✅ Habilidad encontrada:', skillData.data);
        } catch (error) {
          console.warn('⚠️ No se pudo verificar la habilidad:', error);
        }
        
        // Declarar la habilidad
        console.log('📤 Declarando habilidad en IPFS y blockchain...');
        const result = await declareSkill(testInput.timeSkillId, testInput.skillLevel);
        
        console.log('✅ Declaración completada:', result);
        
        // Recargar habilidades del usuario para actualizar la UI
        console.log('🔄 Recargando habilidades del usuario...');
        await loadUserSkills();
        
        return { 
          skillId: testInput.timeSkillId, 
          level: testInput.skillLevel,
          professional: account,
          declarationHash: result.declaration_hash || result.ipfs_hash,
          blockchainTx: result.blockchain_tx || result.txHash,
          declarationData: result.declaration_data,
          status: 'Habilidad declarada exitosamente en IPFS y blockchain'
        };
      }
    },

    // Tests de Registro de Tiempo
    time: {
      name: 'Verificar Registro de Tiempo',
      test: async () => {
        if (!isConnected) throw new Error('Wallet no conectada');
        await loadTimeRecords();
        return { recordsCount: timeRecords.length };
      }
    },
    timeRegister: {
      name: 'Registrar Tiempo',
      test: async () => {
        if (!isConnected) throw new Error('Wallet no conectada');
        if (!testInput.timeCompany || !testInput.timeSkillId || !testInput.timeDescription) {
          throw new Error('Empresa, ID de habilidad y descripción requeridos');
        }
        const startTime = Math.floor(Date.now() / 1000) - 3600; // 1 hora atrás
        const endTime = Math.floor(Date.now() / 1000); // Ahora
        const result = await registerTime(
          testInput.timeCompany,
          testInput.timeSkillId,
          startTime,
          endTime,
          testInput.timeDescription
        );
        
        // Manejar diferentes tipos de respuesta
        const txHash = result?.hash || result?.txHash || result?.transactionHash || 'N/A';
        
        return { 
          company: testInput.timeCompany,
          skillId: testInput.timeSkillId,
          duration: '1 hora',
          txHash: txHash,
          result: result
        };
      }
    },

    // Tests de Marketplace
    marketplace: {
      name: 'Verificar Marketplace',
      test: async () => {
        if (!isConnected) throw new Error('Wallet no conectada');
        await loadUserServices();
        await loadOrders();
        return { 
          servicesCount: userServices.length, 
          ordersCount: userOrders.length 
        };
      }
    },
    serviceCreate: {
      name: 'Crear Servicio',
      test: async () => {
        if (!isConnected) throw new Error('Wallet no conectada');
        if (!testInput.serviceTitle || !testInput.serviceDescription || !testInput.servicePrice) {
          throw new Error('Título, descripción y precio requeridos');
        }
        const result = await createService(
          testInput.serviceTitle,
          testInput.serviceDescription,
          testInput.servicePrice,
          [testInput.timeSkillId || 0]
        );
        
        // Manejar diferentes tipos de respuesta
        const txHash = result?.hash || result?.txHash || result?.transactionHash || 'N/A';
        
        return { 
          title: testInput.serviceTitle,
          price: testInput.servicePrice,
          txHash: txHash,
          result: result
        };
      }
    },
    orderCreate: {
      name: 'Crear Orden',
      test: async () => {
        if (!isConnected) throw new Error('Wallet no conectada');
        if (!testInput.serviceTitle) {
          throw new Error('ID de servicio requerido');
        }
        const serviceId = parseInt(testInput.serviceTitle) || 0;
        const result = await createOrder(serviceId, 2, 'Orden de prueba');
        
        // Manejar diferentes tipos de respuesta
        const txHash = result?.hash || result?.txHash || result?.transactionHash || 'N/A';
        
        return { 
          serviceId, 
          hours: 2, 
          txHash: txHash,
          result: result
        };
      }
    },

    // Tests de IPFS
    ipfs: {
      name: 'Verificar IPFS',
      test: async () => {
        try {
          const response = await fetch('http://localhost:5001/api/v0/version', {
            method: 'POST'
          });
          if (!response.ok) throw new Error('IPFS no responde');
          const data = await response.json();
          return { 
            version: data.Version,
            available: true 
          };
        } catch (error) {
          throw new Error('IPFS no disponible');
        }
      }
    },

    // Tests de Verificación de Datos IPFS
    ipfsData: {
      name: 'Verificar Datos en IPFS',
      test: async () => {
        if (!isConnected) throw new Error('Wallet no conectada');
        
        try {
          // Primero obtener las habilidades del usuario
          await loadUserSkills();
          
          if (userSkills.length === 0) {
            return { 
              message: 'No hay habilidades declaradas para verificar',
              skillsCount: 0
            };
          }
          
          // Verificar que podemos obtener datos de IPFS para cada habilidad
          const verificationResults = [];
          
          for (const skill of userSkills) {
            try {
              // Buscar hash de declaración en diferentes propiedades posibles
              const skillAny = skill as any;
              const declarationHash = skillAny.declarationDataHash || 
                                    skillAny.declarationHash || 
                                    skillAny.ipfsHash || 
                                    skillAny.metadataURI;
              
              if (declarationHash) {
                const ipfsResponse = await fetch(`http://localhost:5001/api/v0/cat?arg=${declarationHash}`, {
                  method: 'POST'
                });
                
                if (ipfsResponse.ok) {
                  const ipfsData = await ipfsResponse.json();
                  verificationResults.push({
                    skillId: skill.skillId,
                    skillName: skill.name,
                    ipfsHash: declarationHash,
                    dataRetrieved: true,
                    data: ipfsData
                  });
                } else {
                  verificationResults.push({
                    skillId: skill.skillId,
                    skillName: skill.name,
                    ipfsHash: declarationHash,
                    dataRetrieved: false,
                    error: `IPFS error: ${ipfsResponse.status} ${ipfsResponse.statusText}`
                  });
                }
              } else {
                verificationResults.push({
                  skillId: skill.skillId,
                  skillName: skill.name,
                  ipfsHash: 'No encontrado',
                  dataRetrieved: false,
                  error: 'No se encontró hash de declaración'
                });
              }
            } catch (error: any) {
              const skillAny = skill as any;
              const declarationHash = skillAny.declarationDataHash || 
                                    skillAny.declarationHash || 
                                    skillAny.ipfsHash || 
                                    skillAny.metadataURI || 'No encontrado';
              
              verificationResults.push({
                skillId: skill.skillId,
                skillName: skill.name,
                ipfsHash: declarationHash,
                dataRetrieved: false,
                error: error.message || 'Error desconocido'
              });
            }
          }
          
          return {
            totalSkills: userSkills.length,
            verifiedSkills: verificationResults.filter(r => r.dataRetrieved).length,
            failedSkills: verificationResults.filter(r => !r.dataRetrieved).length,
            results: verificationResults
          };
        } catch (error: any) {
          throw new Error(`Error verificando datos IPFS: ${error.message || 'Error desconocido'}`);
        }
      }
    },

    // Tests de API
    api: {
      name: 'Verificar API',
      test: async () => {
        try {
          // Probar múltiples endpoints de la API
          const endpoints = [
            { name: 'Skills All', url: 'http://localhost:5003/api/skills/all' },
            { name: 'Skills Count', url: 'http://localhost:5003/api/skills/count' },
            { name: 'Skills Categories', url: 'http://localhost:5003/api/skills/categories' },
            { name: 'Users', url: 'http://localhost:5003/api/users/all' }
          ];
          
          const results = [];
          
          for (const endpoint of endpoints) {
            try {
              const response = await fetch(endpoint.url);
              if (response.ok) {
                const data = await response.json();
                results.push({
                  endpoint: endpoint.name,
                  status: 'success',
                  data: data
                });
              } else {
                results.push({
                  endpoint: endpoint.name,
                  status: 'error',
                  error: `${response.status} ${response.statusText}`
                });
              }
            } catch (error: any) {
              results.push({
                endpoint: endpoint.name,
                status: 'error',
                error: error.message
              });
            }
          }
          
          const successfulEndpoints = results.filter(r => r.status === 'success').length;
          
          return { 
            totalEndpoints: endpoints.length,
            successfulEndpoints,
            failedEndpoints: results.length - successfulEndpoints,
            results
          };
        } catch (error) {
          throw new Error('API no disponible');
        }
      }
    },

    // Tests de Contratos
    contracts: {
      name: 'Verificar Contratos',
      test: async () => {
        if (!isConnected) throw new Error('Wallet no conectada');
        
        try {
          const contractChecks = [];
          
          // Verificar KRM Token
          try {
            const krmService = new (await import('../services/contracts')).KRMTokenService(provider, signer);
            const totalSupply = await krmService.getTotalSupply();
            contractChecks.push({
              contract: 'KRMToken',
              status: 'success',
              totalSupply: totalSupply
            });
          } catch (error: any) {
            contractChecks.push({
              contract: 'KRMToken',
              status: 'error',
              error: error.message
            });
          }
          
          // Verificar SkillSystem
          try {
            const skillService = new (await import('../services/contracts')).SkillSystemService(provider, signer);
            const totalSkills = await skillService.getAllSkills();
            contractChecks.push({
              contract: 'SkillSystem',
              status: 'success',
              totalSkills: totalSkills.length
            });
          } catch (error: any) {
            contractChecks.push({
              contract: 'SkillSystem',
              status: 'error',
              error: error.message
            });
          }
          
          // Verificar ProfileRegistry
          try {
            const profileService = new (await import('../services/contracts')).ProfileRegistryService(provider, signer);
            const userProfile = await profileService.getProfile(account || '');
            contractChecks.push({
              contract: 'ProfileRegistry',
              status: 'success',
              hasProfile: !!userProfile
            });
          } catch (error: any) {
            contractChecks.push({
              contract: 'ProfileRegistry',
              status: 'error',
              error: error.message
            });
          }
          
          const successfulContracts = contractChecks.filter(c => c.status === 'success').length;
          
          return {
            totalContracts: contractChecks.length,
            successfulContracts,
            failedContracts: contractChecks.length - successfulContracts,
            results: contractChecks
          };
        } catch (error: any) {
          throw new Error(`Error verificando contratos: ${error.message}`);
        }
      }
    }
  };

  // Verificar estado del sistema
  useEffect(() => {
    checkSystemStatus();
  }, [isConnected]);

  const checkSystemStatus = async () => {
    const newStatus: SystemStatus = {
      blockchain: isConnected && !!provider,
      ipfs: false,
      api: false,
      frontend: true
    };

    // Verificar IPFS (necesita método POST)
    try {
      const response = await fetch('http://localhost:5001/api/v0/version', {
        method: 'POST'
      });
      newStatus.ipfs = response.ok;
    } catch (error) {
      console.log('IPFS no disponible');
    }

    // Verificar API (usar un endpoint que existe)
    try {
      const response = await fetch('http://localhost:5003/api/skills/all');
      newStatus.api = response.ok;
    } catch (error) {
      console.log('API no disponible');
    }

    setSystemStatus(newStatus);
  };

  const addTestResult = (result: TestResult) => {
    setTestResults(prev => [result, ...prev.slice(0, 49)]); // Mantener solo los últimos 50
  };

  const runInteractiveTest = async (testName: string) => {
    if (!isConnected) {
      addTestResult({
        name: testName,
        status: 'error',
        message: 'Wallet no conectada',
        timestamp: new Date()
      });
      return;
    }

    setCurrentTest(testName);
    
    try {
      const test = availableTests[testName as keyof typeof availableTests];
      if (!test) {
        throw new Error(`Test ${testName} no encontrado`);
      }

      addTestResult({
        name: test.name,
        status: 'pending',
        message: 'Ejecutando...',
        timestamp: new Date()
      });

      const result = await test.test();
      
      // Actualizar el resultado existente
      setTestResults(prev => prev.map(r => 
        r.name === test.name 
          ? { ...r, status: 'success', message: 'Test completado exitosamente', details: result }
          : r
      ));

      console.log(`✅ Test ${testName} completado:`, result);
    } catch (error: any) {
      // Actualizar el resultado existente
      setTestResults(prev => prev.map(r => 
        r.name === availableTests[testName as keyof typeof availableTests]?.name
          ? { ...r, status: 'error', message: error.message }
          : r
      ));
      
      console.error(`❌ Error en test ${testName}:`, error);
    } finally {
      setCurrentTest('');
    }
  };

  const runAllTests = async () => {
    if (!isConnected) {
      addTestResult({
        name: 'Conexión',
        status: 'error',
        message: 'Wallet no conectada',
        timestamp: new Date()
      });
      return;
    }

    setIsRunningTests(true);
    setTestResults([]);

    // Ejecutar tests en paralelo
    const testPromises = Object.entries(availableTests).map(async ([key, test]) => {
      try {
        addTestResult({
          name: test.name,
          status: 'pending',
          message: 'Ejecutando...',
          timestamp: new Date()
        });

        const result = await test.test();
        
        // Actualizar el resultado existente
        setTestResults(prev => prev.map(r => 
          r.name === test.name 
            ? { ...r, status: 'success', message: 'Test completado exitosamente', details: result }
            : r
        ));

        return { key, success: true, result };
      } catch (error: any) {
        // Actualizar el resultado existente
        setTestResults(prev => prev.map(r => 
          r.name === test.name 
            ? { ...r, status: 'error', message: error.message }
            : r
        ));
        
        return { key, success: false, error: error.message };
      }
    });

    await Promise.all(testPromises);
    setIsRunningTests(false);
  };

  const runSpecificTest = async (testKey: string) => {
    if (testKey === 'all') {
      await runAllTests();
      return;
    }

    await runInteractiveTest(testKey);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle color="success" fontSize="small" />;
      case 'error':
        return <ErrorIcon color="error" fontSize="small" />;
      case 'warning':
        return <Warning color="warning" fontSize="small" />;
      case 'pending':
        return <CircularProgress size={16} />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'pending':
        return 'default';
    }
  };

  if (!isConnected) {
    return (
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          🛠️ Herramientas de Desarrollador
        </Typography>
        <Alert severity="warning" sx={{ mt: 2 }}>
          Por favor, conecta tu wallet para acceder a las herramientas de desarrollador.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: '100%' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        🛠️ Herramientas de Desarrollador
      </Typography>

      {/* Estado del Sistema */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Estado del Sistema
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={3}>
              <Box display="flex" alignItems="center" gap={1}>
                <AccountBalance color={systemStatus.blockchain ? 'success' : 'error'} />
                <Box>
                  <Typography variant="body2" fontWeight="bold">
                    Blockchain
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {systemStatus.blockchain ? 'Conectado' : 'Desconectado'}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={3}>
              <Box display="flex" alignItems="center" gap={1}>
                <Build color={systemStatus.ipfs ? 'success' : 'error'} />
                <Box>
                  <Typography variant="body2" fontWeight="bold">
                    IPFS
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {systemStatus.ipfs ? 'Disponible' : 'No disponible'}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={3}>
              <Box display="flex" alignItems="center" gap={1}>
                <Receipt color={systemStatus.api ? 'success' : 'error'} />
                <Box>
                  <Typography variant="body2" fontWeight="bold">
                    API
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {systemStatus.api ? 'Respondiendo' : 'No responde'}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={3}>
              <Box display="flex" alignItems="center" gap={1}>
                <Person color={systemStatus.frontend ? 'success' : 'error'} />
                <Box>
                  <Typography variant="body2" fontWeight="bold">
                    Frontend
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {systemStatus.frontend ? 'Activo' : 'Inactivo'}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
          
          {/* Información Adicional */}
          {isConnected && (
            <Box mt={3}>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                Información de Conexión
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">
                    Wallet Address:
                  </Typography>
                  <Typography variant="body2" fontFamily="monospace">
                    {account}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">
                    Balance KRM:
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {formatTokenAmount(balance)} KRM
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      loadBalance();
                      loadKRMBalance();
                    }}
                    sx={{ mt: 1 }}
                  >
                    Actualizar Balance
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">
                    Perfil Registrado:
                  </Typography>
                  <Typography variant="body2">
                    {profile ? profile.name : 'No registrado'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">
                    Habilidades Declaradas:
                  </Typography>
                  <Typography variant="body2">
                    {userSkills.length} habilidades
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Estado de IPFS */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Estado de IPFS
          </Typography>
          <IPFSStatus showDetails={true} />
        </CardContent>
      </Card>

      {/* Controles de Testing */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Testing de Contratos
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Test Específico</InputLabel>
                <Select
                  value={selectedTest}
                  label="Test Específico"
                  onChange={(e) => setSelectedTest(e.target.value)}
                >
                  <MenuItem value="all">Todos los Tests</MenuItem>
                  
                  {/* Tests de Sistema */}
                  <MenuItem value="system">Estado del Sistema</MenuItem>
                  <MenuItem value="web3">Conexión Web3</MenuItem>
                  <MenuItem value="contracts">Verificar Contratos</MenuItem>
                  <MenuItem value="ipfs">Verificar IPFS</MenuItem>
                  <MenuItem value="ipfsData">Verificar Datos IPFS</MenuItem>
                  <MenuItem value="api">Verificar API</MenuItem>
                  
                  {/* Tests de KRM */}
                  <MenuItem value="krm">Balance KRM</MenuItem>
                  <MenuItem value="krmTransfer">Transferir KRM</MenuItem>
                  
                  {/* Tests de Perfil */}
                  <MenuItem value="profile">Verificar Perfil</MenuItem>
                  <MenuItem value="profileRegister">Registrar Perfil</MenuItem>
                  <MenuItem value="profileUpdate">Actualizar Perfil</MenuItem>
                  
                  {/* Tests de Habilidades */}
                  <MenuItem value="skills">Verificar Habilidades</MenuItem>
                  <MenuItem value="skillCreate">Crear Habilidad</MenuItem>
                  <MenuItem value="skillDeclare">Declarar Habilidad</MenuItem>
                  
                  {/* Tests de Tiempo */}
                  <MenuItem value="time">Verificar Registro de Tiempo</MenuItem>
                  <MenuItem value="timeRegister">Registrar Tiempo</MenuItem>
                  
                  {/* Tests de Marketplace */}
                  <MenuItem value="marketplace">Verificar Marketplace</MenuItem>
                  <MenuItem value="serviceCreate">Crear Servicio</MenuItem>
                  <MenuItem value="orderCreate">Crear Orden</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={8}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={runAllTests}
                  disabled={isRunningTests}
                  startIcon={isRunningTests ? <CircularProgress size={20} /> : <PlayArrow />}
                  sx={{ mr: 2 }}
                >
                  {isRunningTests ? 'Ejecutando...' : 'Ejecutar Tests'}
                </Button>
                
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => runSpecificTest(selectedTest)}
                  disabled={isRunningTests || selectedTest === 'all'}
                  startIcon={<PlayArrow />}
                  sx={{ mr: 2 }}
                >
                  Ejecutar Test Seleccionado
                </Button>
                
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => setTestResults([])}
                  startIcon={<Refresh />}
                  sx={{ mr: 2 }}
                >
                  Limpiar Resultados
                </Button>

                <Button
                  variant="contained"
                  color="success"
                  onClick={() => setShowTestDialog(true)}
                  startIcon={<Build />}
                >
                  Tests Interactivos
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Resultados de Tests */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Resultados de Tests
          </Typography>
          
          {/* Resumen de Resultados */}
          {testResults.length > 0 && (
            <Box mb={3}>
              <Grid container spacing={2}>
                <Grid item xs={3}>
                  <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      {testResults.length}
                    </Typography>
                    <Typography variant="body2">Total Tests</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={3}>
                  <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main">
                      {testResults.filter(r => r.status === 'success').length}
                    </Typography>
                    <Typography variant="body2">Exitosos</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={3}>
                  <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="error.main">
                      {testResults.filter(r => r.status === 'error').length}
                    </Typography>
                    <Typography variant="body2">Fallidos</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={3}>
                  <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="warning.main">
                      {testResults.filter(r => r.status === 'pending').length}
                    </Typography>
                    <Typography variant="body2">Pendientes</Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
          
          {testResults.length === 0 ? (
            <Alert severity="info">
              No hay resultados de tests. Ejecuta algunos tests para ver los resultados aquí.
            </Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Test</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Mensaje</TableCell>
                    <TableCell>Detalles</TableCell>
                    <TableCell>Timestamp</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {testResults.map((result, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {result.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={result.status}
                          color={
                            result.status === 'success' ? 'success' :
                            result.status === 'error' ? 'error' :
                            result.status === 'warning' ? 'warning' : 'default'
                          }
                          icon={
                            result.status === 'success' ? <CheckCircle /> :
                            result.status === 'error' ? <ErrorIcon /> :
                            result.status === 'warning' ? <Warning /> : undefined
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {result.message}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {result.details && (
                          <Box>
                            <Typography variant="caption" color="textSecondary">
                              {typeof result.details === 'object' 
                                ? JSON.stringify(result.details, null, 2)
                                : String(result.details)
                              }
                            </Typography>
                          </Box>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="textSecondary">
                          {result.timestamp.toLocaleTimeString()}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Diálogo para Tests Interactivos */}
      <Dialog 
        open={showTestDialog} 
        onClose={() => setShowTestDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Build />
            Tests Interactivos - Musubi
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            {/* Tests de KRM */}
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <AccountBalance />
                    <Typography variant="h6">Tests de KRM Token</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Dirección Destino"
                        value={testInput.toAddress || ''}
                        onChange={(e) => setTestInput({...testInput, toAddress: e.target.value})}
                        placeholder="0x..."
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Cantidad KRM"
                        value={testInput.amount || ''}
                        onChange={(e) => setTestInput({...testInput, amount: e.target.value})}
                        placeholder="10.0"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        variant="contained"
                        onClick={() => runInteractiveTest('krmTransfer')}
                        disabled={!testInput.toAddress || !testInput.amount}
                      >
                        Transferir KRM
                      </Button>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* Tests de Perfil */}
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Person />
                    <Typography variant="h6">Tests de Perfil</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Nombre"
                        value={testInput.skillName || ''}
                        onChange={(e) => setTestInput({...testInput, skillName: e.target.value})}
                        placeholder="Juan Pérez"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Descripción"
                        value={testInput.serviceDescription || ''}
                        onChange={(e) => setTestInput({...testInput, serviceDescription: e.target.value})}
                        placeholder="Desarrollador Full Stack"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        variant="contained"
                        onClick={() => runInteractiveTest('profileRegister')}
                        disabled={!testInput.skillName}
                      >
                        Registrar Perfil
                      </Button>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* Tests de Habilidades */}
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Work />
                    <Typography variant="h6">Tests de Habilidades</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        label="Nombre Habilidad"
                        value={testInput.skillName || ''}
                        onChange={(e) => setTestInput({...testInput, skillName: e.target.value})}
                        placeholder="React"
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        label="Categoría"
                        value={testInput.skillCategory || ''}
                        onChange={(e) => setTestInput({...testInput, skillCategory: e.target.value})}
                        placeholder="Frontend"
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        label="Nivel (1-5)"
                        type="number"
                        value={testInput.skillLevel || ''}
                        onChange={(e) => setTestInput({...testInput, skillLevel: parseInt(e.target.value)})}
                        placeholder="3"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Button
                        variant="contained"
                        onClick={() => runInteractiveTest('skillCreate')}
                        disabled={!testInput.skillName || !testInput.skillCategory}
                      >
                        Crear Habilidad
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button
                        variant="contained"
                        onClick={() => runInteractiveTest('skillDeclare')}
                        disabled={!testInput.timeSkillId || !testInput.skillLevel}
                      >
                        Declarar Habilidad
                      </Button>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* Tests de Tiempo */}
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <AccessTime />
                    <Typography variant="h6">Tests de Registro de Tiempo</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        label="Empresa"
                        value={testInput.timeCompany || ''}
                        onChange={(e) => setTestInput({...testInput, timeCompany: e.target.value})}
                        placeholder="TechCorp"
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        label="ID Habilidad"
                        type="number"
                        value={testInput.timeSkillId || ''}
                        onChange={(e) => setTestInput({...testInput, timeSkillId: parseInt(e.target.value)})}
                        placeholder="1"
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        label="Descripción"
                        value={testInput.timeDescription || ''}
                        onChange={(e) => setTestInput({...testInput, timeDescription: e.target.value})}
                        placeholder="Desarrollo de features"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        variant="contained"
                        onClick={() => runInteractiveTest('timeRegister')}
                        disabled={!testInput.timeCompany || !testInput.timeSkillId || !testInput.timeDescription}
                      >
                        Registrar Tiempo
                      </Button>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* Tests de Marketplace */}
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Store />
                    <Typography variant="h6">Tests de Marketplace</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        label="Título Servicio"
                        value={testInput.serviceTitle || ''}
                        onChange={(e) => setTestInput({...testInput, serviceTitle: e.target.value})}
                        placeholder="Desarrollo Web"
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        label="Descripción"
                        value={testInput.serviceDescription || ''}
                        onChange={(e) => setTestInput({...testInput, serviceDescription: e.target.value})}
                        placeholder="Desarrollo de aplicaciones web"
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        label="Precio por Hora (KRM)"
                        value={testInput.servicePrice || ''}
                        onChange={(e) => setTestInput({...testInput, servicePrice: e.target.value})}
                        placeholder="50"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Button
                        variant="contained"
                        onClick={() => runInteractiveTest('serviceCreate')}
                        disabled={!testInput.serviceTitle || !testInput.serviceDescription || !testInput.servicePrice}
                      >
                        Crear Servicio
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button
                        variant="contained"
                        onClick={() => runInteractiveTest('orderCreate')}
                        disabled={!testInput.serviceTitle}
                      >
                        Crear Orden
                      </Button>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTestDialog(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DeveloperTools; 