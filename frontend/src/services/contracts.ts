// Servicios para interactuar con los contratos inteligentes
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '../config';
import { CONTRACT_ABIS } from './abis';
import { 
  Profile, 
  Skill, 
  DeclaredSkill, 
  TimeRecord, 
  Service, 
  Order,
  ProfessionalSkill
} from '../types';
import { IPFSService } from './ipfs';

// Clase de servicio para KRM Token
export class KRMTokenService {
  private contract: ethers.Contract;

  constructor(provider: any, signer?: any) {
    this.contract = new ethers.Contract(
      CONTRACT_ADDRESSES.KRMToken,
      CONTRACT_ABIS.KRMToken,
      signer || provider
    );
  }

  async getBalance(address: string): Promise<string> {
    console.log('🔍 KRMTokenService.getBalance - Llamando con dirección:', address);
    console.log('🔍 KRMTokenService.getBalance - Contrato:', this.contract.address);
    
    try {
      const balance = await this.contract.balanceOf(address);
      console.log('🔍 KRMTokenService.getBalance - Balance raw:', balance.toString());
      const formattedBalance = ethers.formatEther(balance);
      console.log('🔍 KRMTokenService.getBalance - Balance formateado:', formattedBalance);
      return formattedBalance;
    } catch (error) {
      console.error('❌ KRMTokenService.getBalance - Error:', error);
      throw error;
    }
  }

  async getTotalSupply(): Promise<string> {
    const supply = await this.contract.totalSupply();
    return ethers.formatEther(supply);
  }

  async transfer(to: string, amount: string): Promise<any> {
    const tx = await this.contract.transfer(to, ethers.parseEther(amount));
    return tx;
  }

  async approve(spender: string, amount: string): Promise<any> {
    const tx = await this.contract.approve(spender, ethers.parseEther(amount));
    return tx;
  }

  async getAllowance(owner: string, spender: string): Promise<string> {
    const allowance = await this.contract.allowance(owner, spender);
    return ethers.formatEther(allowance);
  }
}

// Clase de servicio para Profile Registry
export class ProfileRegistryService {
  private contract: ethers.Contract;

  constructor(provider: any, signer?: any) {
    const contractAddress = CONTRACT_ADDRESSES.ProfileRegistry;
    const contractABI = CONTRACT_ABIS.ProfileRegistry;
    this.contract = new ethers.Contract(contractAddress, contractABI, signer || provider);
  }

  async getProfile(address: string): Promise<Profile | null> {
    try {
      console.log('🔍 ProfileRegistryService.getProfile - Iniciando búsqueda para:', address);
      console.log('🔍 ProfileRegistryService.getProfile - Contrato en dirección:', this.contract.address);
      
      // Obtener datos básicos del contrato
      console.log('🔍 ProfileRegistryService.getProfile - Llamando al contrato...');
      const profileData = await this.contract.getProfile(address);
      console.log('🔍 ProfileRegistryService.getProfile - Datos obtenidos del contrato:', profileData);
      
      // Verificar si el perfil existe (wallet_addr no debe ser address(0))
      console.log('🔍 ProfileRegistryService.getProfile - Verificando si existe perfil...');
      if (!profileData || profileData.wallet_addr === ethers.ZeroAddress) {
        console.log('❌ No se encontró perfil para:', address);
        return null;
      }

      console.log('✅ Perfil encontrado en blockchain:', profileData);

      // Construir el objeto Profile con los datos del contrato
      console.log('🔍 ProfileRegistryService.getProfile - Construyendo objeto Profile...');
      let enrichedData: Profile = {
        address,
        name: profileData.name || '',
        bio: profileData.description || '',
        isCompany: profileData.profileType === 1, // 0 = Professional, 1 = Company
        isActive: true, // Si existe en blockchain, está activo
        metadataURI: profileData.metadataURI || '',
        karma: profileData.karma?.toNumber() || 0,
        isVerified: profileData.isVerified || false,
        disclaimerAccepted: profileData.disclaimerAccepted || false
      };

      console.log('🔍 ProfileRegistryService.getProfile - Objeto Profile construido:', enrichedData);

      // Si hay metadataURI, intentar obtener datos de IPFS
      if (profileData.metadataURI && profileData.metadataURI !== '') {
        console.log('🔍 ProfileRegistryService.getProfile - Intentando obtener datos de IPFS...');
        try {
          const ipfsData = await this.getProfileFromIPFS(profileData.metadataURI);
          console.log('🔍 ProfileRegistryService.getProfile - Datos de IPFS obtenidos:', ipfsData);
          if (ipfsData) {
            enrichedData = {
              ...enrichedData,
              name: ipfsData.name || enrichedData.name,
              bio: ipfsData.description || ipfsData.bio || enrichedData.bio,
              location: ipfsData.location || '',
              website: ipfsData.website || '',
              skills: ipfsData.skills || []
            };
            console.log('🔍 ProfileRegistryService.getProfile - Datos enriquecidos con IPFS:', enrichedData);
          }
        } catch (ipfsError) {
          console.warn('⚠️ Error obteniendo datos de IPFS, usando solo datos de blockchain:', ipfsError);
        }
      } else {
        console.log('🔍 ProfileRegistryService.getProfile - No hay metadataURI, usando solo datos de blockchain');
      }

      console.log('🔍 ProfileRegistryService.getProfile - Retornando perfil final:', enrichedData);
      return enrichedData;
    } catch (error: any) {
      console.error('❌ Error obteniendo perfil:', error);
      console.error('❌ Stack trace:', error.stack);
      return null;
    }
  }

  async getProfileFromIPFS(ipfsHash: string): Promise<any> {
    try {
      // Usar el nuevo servicio IPFS directo
      const data = await IPFSService.get(ipfsHash);
      return data;
    } catch (error) {
      console.error('Error getting profile from IPFS:', error);
      throw error;
    }
  }

  async registerProfile(
    metadataURI: string, 
    profileType: number
  ): Promise<any> {
    console.log('🔍 ProfileRegistryService.registerProfile - Llamando al contrato con:', {
      metadataURI,
      profileType,
      contractAddress: this.contract.address
    });
    
    // Validar que el contrato esté disponible
    if (!this.contract) {
      throw new Error('Contrato no disponible');
    }
    
    const tx = await this.contract.registerProfile(metadataURI, profileType);
    console.log('🔍 ProfileRegistryService.registerProfile - Transacción creada:', tx);
    return tx;
  }

  async updateProfile(name: string, description: string, metadataURI: string): Promise<any> {
    console.log('🔍 ProfileRegistryService.updateProfile - Llamando al contrato con:', {
      name,
      description,
      metadataURI,
      contractAddress: this.contract.address
    });
    
    // Validar que el contrato esté disponible
    if (!this.contract) {
      throw new Error('Contrato no disponible');
    }
    
    const tx = await this.contract.updateProfile(name, description, metadataURI);
    console.log('🔍 ProfileRegistryService.updateProfile - Transacción creada:', tx);
    return tx;
  }

  async deactivateProfile(): Promise<any> {
    // Esta función no existe en el contrato actual, pero podríamos implementarla
    throw new Error('Function not implemented');
  }
}

// Clase de servicio para Profile Registry con IPFS usando la API
export class ProfileRegistryIPFSService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = 'http://localhost:5003'; // URL correcta de la API Musubi
  }

  async registerProfileWithIPFS(
    name: string, 
    description: string, 
    profileType: number, 
    acceptDisclaimer: boolean,
    additionalData: any = {}
  ): Promise<any> {
    console.log('🔍 ProfileRegistryIPFSService.registerProfileWithIPFS - Llamando a la API con:', {
      name,
      description,
      profileType,
      acceptDisclaimer,
      additionalData
    });

    try {
      // Obtener la dirección de wallet del additionalData o usar una por defecto
      const walletAddress = additionalData.walletAddress || '0x0000000000000000000000000000000000000000';
      
      // Preparar datos del perfil en el formato que espera la API
      const profileData = {
        name: name,
        email: additionalData.email || `user_${Date.now()}@musubi.com`,
        wallet_address: walletAddress,
        profile_type: profileType === 1 ? 'company' : 'professional',
        description: description,
        skills: additionalData.skills || [],
        acceptDisclaimer: acceptDisclaimer,
        ...additionalData
      };

      console.log('🔍 ProfileRegistryIPFSService.registerProfileWithIPFS - Datos a enviar:', profileData);

      // Llamar a la API para registrar el perfil con IPFS
      const response = await fetch(`${this.apiUrl}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error response from API:', errorData);
        throw new Error(`Error en la API: ${errorData.error || errorData.detail || response.statusText}`);
      }

      const result = await response.json();
      console.log('🔍 ProfileRegistryIPFSService.registerProfileWithIPFS - Respuesta de la API:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Error en ProfileRegistryIPFSService.registerProfileWithIPFS:', error);
      throw error;
    }
  }

  async getProfileFromIPFS(walletAddress: string): Promise<Profile | null> {
    try {
      const response = await fetch(`${this.apiUrl}/api/users/wallet/${walletAddress}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Error en la API: ${response.statusText}`);
      }

      const userData = await response.json();
      
      // Verificar si la respuesta indica que el usuario no fue encontrado
      if (userData.success === false || userData.error) {
        console.log('🔍 Usuario no encontrado en la API:', userData.error);
        return null;
      }
      
      // Convertir datos de la API al formato del frontend
      return {
        address: walletAddress,
        isCompany: userData.user?.profile_type === 'company',
        isActive: true, // Asumimos que si existe en IPFS está activo
        metadataURI: userData.user?.ipfs_hash || '',
        name: userData.user?.name || '',
        bio: userData.user?.description || '',
        location: userData.user?.location || 'No especificada',
        website: userData.user?.website || '',
        skills: userData.user?.skills || [],
        karma: 0,
        isVerified: false,
        disclaimerAccepted: userData.user?.acceptDisclaimer || false
      };
    } catch (error) {
      console.error('Error getting profile from IPFS:', error);
      return null;
    }
  }

  async updateProfileInIPFS(
    walletAddress: string,
    name: string, 
    description: string, 
    additionalData: any = {}
  ): Promise<any> {
    try {
      const response = await fetch(`${this.apiUrl}/api/users/wallet/${walletAddress}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          ...additionalData,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error en la API: ${errorData.detail || response.statusText}`);
      }

      const result = await response.json();
      console.log('🔍 ProfileRegistryIPFSService.updateProfileInIPFS - Respuesta de la API:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Error en ProfileRegistryIPFSService.updateProfileInIPFS:', error);
      throw error;
    }
  }
}

// Clase de servicio para Skill System
export class SkillSystemService {
  private contract: ethers.Contract;

  constructor(provider: any, signer?: any) {
    const contractAddress = CONTRACT_ADDRESSES.SkillSystem;
    const contractABI = CONTRACT_ABIS.SkillSystem;
    this.contract = new ethers.Contract(contractAddress, contractABI, signer || provider);
  }

  async getSkill(skillId: number): Promise<Skill | null> {
    try {
      const skill = await this.contract.skills(skillId);
      
      // Intentar obtener metadatos desde IPFS
      let ipfsData = null;
      if (skill.metadataURI && skill.metadataURI.startsWith('Qm')) {
        try {
          console.log(`🔍 Intentando obtener metadatos IPFS para skill ${skillId}: ${skill.metadataURI}`);
          ipfsData = await this.getSkillFromIPFS(skill.metadataURI);
          console.log(`✅ Metadatos IPFS obtenidos para skill ${skillId}:`, ipfsData);
        } catch (ipfsError) {
          console.warn(`⚠️ No se pudieron obtener metadatos IPFS para skill ${skillId}:`, (ipfsError as Error).message);
        }
      }

      return {
        id: skillId,
        name: skill.name,
        category: skill.category,
        description: ipfsData?.description || skill.description || '',
        level: ipfsData?.level || 'No especificado',
        tags: ipfsData?.tags || [],
        metadataURI: skill.metadataURI,
        isActive: skill.isActive,
        isValidated: true, // Por defecto asumimos que está validada
        validatedBy: '',
        validatedAt: 0,
        declaredAt: 0
      };
    } catch (error) {
      console.error('Error getting skill:', error);
      return null;
    }
  }

  async getSkillFromIPFS(ipfsHash: string): Promise<any> {
    try {
      // Usar el nuevo servicio IPFS directo
      const data = await IPFSService.get(ipfsHash);
      return data;
    } catch (error) {
      console.error('Error getting skill from IPFS:', error);
      throw error;
    }
  }

  async getAllSkills(): Promise<Skill[]> {
    try {
      const skillCount = await this.contract.totalSkills();
      const skills: Skill[] = [];

      for (let i = 0; i < skillCount; i++) {
        const skill = await this.getSkill(i);
        if (skill) {
          skills.push(skill);
        }
      }

      return skills;
    } catch (error) {
      console.error('Error getting all skills:', error);
      return [];
    }
  }

  async getProfessionalSkills(address: string): Promise<ProfessionalSkill[]> {
    try {
      const skills = await this.contract.getProfessionalSkills(address);
      const enrichedSkills: ProfessionalSkill[] = [];

      for (const skill of skills) {
        // Obtener datos completos de la skill
        const skillData = await this.getSkill(skill.skillId);
        if (skillData) {
          enrichedSkills.push({
            skillId: skill.skillId,
            name: skillData.name,
            category: skillData.category,
            description: skillData.description,
            level: skillData.level,
            tags: skillData.tags,
            declaredLevel: skill.declaredLevel,
            isValidated: skill.isValidated,
            validator: skill.validator,
            validationDate: skill.validationDate ? new Date(Number(skill.validationDate) * 1000) : null
          });
        }
      }

      return enrichedSkills;
    } catch (error) {
      console.error('Error getting professional skills:', error);
      return [];
    }
  }

  async declareSkill(skillId: number, level: number): Promise<any> {
    console.log('🔍 SkillSystemService.declareSkill - Llamando al contrato con:', {
      skillId,
      level,
      contractAddress: this.contract.address
    });
    
    // NOTA: Este método ahora se usa principalmente para compatibilidad
    // La declaración real se hace a través de la API que maneja IPFS + blockchain
    // Este método puede usarse para llamadas directas al contrato si es necesario
    
    // Para compatibilidad, intentamos llamar al contrato directamente
    // pero esto requeriría que ya tengamos el declarationDataHash
    throw new Error('declareSkill debe llamarse a través de la API para manejar IPFS correctamente');
  }

  async validateSkill(professionalAddress: string, skillId: number, isValid: boolean): Promise<any> {
    console.log('🔍 SkillSystemService.validateSkill - Llamando al contrato con:', {
      professionalAddress,
      skillId,
      isValid,
      contractAddress: this.contract.address
    });
    
    const tx = await this.contract.validateSkill(professionalAddress, skillId, isValid);
    console.log('🔍 SkillSystemService.validateSkill - Transacción creada:', tx);
    return tx;
  }

  async createSkill(ipfsHash: string): Promise<any> {
    console.log('🔍 SkillSystemService.createSkill - Llamando al contrato con:', {
      ipfsHash,
      contractAddress: this.contract.address
    });
    
    const tx = await this.contract.createSkill(ipfsHash);
    console.log('🔍 SkillSystemService.createSkill - Transacción creada:', tx);
    return tx;
  }
}

// Clase de servicio para Time Registry
export class TimeRegistryService {
  private contract: ethers.Contract;

  constructor(provider: any, signer?: any) {
    this.contract = new ethers.Contract(
      CONTRACT_ADDRESSES.TimeRegistry,
      CONTRACT_ABIS.TimeRegistry,
      signer || provider
    );
  }

  async getUserTimeRecords(userAddress: string): Promise<TimeRecord[]> {
    try {
      const timeRecords: TimeRecord[] = [];
      let recordId = 0;
      
      try {
        while (true) {
          const record = await this.contract.timeRecords(recordId);
          
          // Verificar si este registro pertenece al usuario
          if (record.professional.toLowerCase() === userAddress.toLowerCase()) {
            // Obtener información de la skill
            let skillName = `Skill ${record.skillId}`;
            try {
              const skillSystem = new ethers.Contract(
                CONTRACT_ADDRESSES.SkillSystem,
                CONTRACT_ABIS.SkillSystem,
                this.contract.runner
              );
              const skill = await skillSystem.skills(record.skillId);
              skillName = skill.name;
            } catch (error) {
              console.warn(`Could not get skill name for skillId ${record.skillId}:`, error);
            }
            
            timeRecords.push({
              id: Number(recordId),
              worker: record.professional,
              company: record.company,
              skillId: Number(record.skillId),
              skillName: skillName,
              description: record.description,
              duration: Number(record.totalHours),
              timestamp: Number(record.startTime),
              isValidated: Number(record.status) === 1, // RecordStatus.Validated
              validatedBy: record.validatedBy,
              validatedAt: Number(record.validatedAt)
            });
          }
          
          recordId++;
        }
      } catch (error) {
        // Cuando falla, hemos encontrado el final
        console.log(`Found ${recordId} time records total`);
      }
      
      return timeRecords;
    } catch (error) {
      console.error('Error getting user time records:', error);
      return [];
    }
  }

  async getCompanyTimeRecords(companyAddress: string): Promise<TimeRecord[]> {
    try {
      const timeRecords: TimeRecord[] = [];
      let recordId = 0;
      
      try {
        while (true) {
          const record = await this.contract.timeRecords(recordId);
          
          // Verificar si este registro pertenece a la empresa
          if (record.company.toLowerCase() === companyAddress.toLowerCase()) {
            // Obtener información de la skill
            let skillName = `Skill ${record.skillId}`;
            try {
              const skillSystem = new ethers.Contract(
                CONTRACT_ADDRESSES.SkillSystem,
                CONTRACT_ABIS.SkillSystem,
                this.contract.runner
              );
              const skill = await skillSystem.skills(record.skillId);
              skillName = skill.name;
            } catch (error) {
              console.warn(`Could not get skill name for skillId ${record.skillId}:`, error);
            }
            
            timeRecords.push({
              id: Number(recordId),
              worker: record.professional,
              company: record.company,
              skillId: Number(record.skillId),
              skillName: skillName,
              description: record.description,
              duration: Number(record.totalHours),
              timestamp: Number(record.startTime),
              isValidated: Number(record.status) === 1, // RecordStatus.Validated
              validatedBy: record.validatedBy,
              validatedAt: Number(record.validatedAt)
            });
          }
          
          recordId++;
        }
      } catch (error) {
        // Cuando falla, hemos encontrado el final
        console.log(`Found ${recordId} time records total`);
      }
      
      return timeRecords;
    } catch (error) {
      console.error('Error getting company time records:', error);
      return [];
    }
  }

  async registerTime(
    skillId: number,
    timeDataHash: string,
    hoursWorked: number,
    hourlyRate: number
  ): Promise<any> {
    const tx = await this.contract.registerTime(skillId, timeDataHash, hoursWorked, hourlyRate);
    return tx;
  }

  async validateTimeRecord(recordId: number): Promise<any> {
    const tx = await this.contract.validateTimeRecord(recordId);
    return tx;
  }

  async rejectTimeRecord(recordId: number): Promise<any> {
    const tx = await this.contract.rejectTimeRecord(recordId);
    return tx;
  }

  async disputeTimeRecord(recordId: number): Promise<any> {
    const tx = await this.contract.disputeTimeRecord(recordId);
    return tx;
  }
}

// Clase de servicio para P2P Marketplace
export class P2PMarketplaceService {
  private contract: ethers.Contract;

  constructor(provider: any, signer?: any) {
    this.contract = new ethers.Contract(
      CONTRACT_ADDRESSES.P2PMarketplace,
      CONTRACT_ABIS.P2PMarketplace,
      signer || provider
    );
  }

  async getServicesCount(): Promise<number> {
    // Como no hay un contador público, intentamos obtener servicios hasta que falle
    let count = 0;
    try {
      while (true) {
        await this.contract.services(count);
        count++;
      }
    } catch (error) {
      // Cuando falla, hemos encontrado el final
      return count;
    }
  }

  async getService(serviceId: number): Promise<Service> {
    const service = await this.contract.services(serviceId);
    return {
      id: serviceId,
      title: service.title,
      description: service.description,
      provider: service.provider,
      pricePerHour: Number(ethers.formatEther(service.pricePerHour)),
      category: 'General', // El contrato no tiene categoría, usamos 'General'
      isActive: Number(service.status) === 0, // ServiceStatus.Active = 0
      skillIds: service.skillIds.map((id: any) => Number(id)),
      status: Number(service.status),
      createdAt: Number(service.createdAt)
    };
  }

  async getAllServices(): Promise<Service[]> {
    const services: Service[] = [];
    const count = await this.getServicesCount();
    
    for (let i = 0; i < count; i++) {
      try {
        const service = await this.getService(i);
        if (service.title && service.isActive) { // Solo servicios activos
          services.push(service);
        }
      } catch (error) {
        console.error(`Error getting service ${i}:`, error);
      }
    }
    
    return services;
  }

  async getProviderServices(providerAddress: string): Promise<Service[]> {
    try {
      // El contrato no tiene getProviderServices, necesitamos iterar
      const services: Service[] = [];
      let serviceId = 0;
      
      try {
        while (true) {
          const service = await this.contract.services(serviceId);
          
          // Verificar si este servicio pertenece al proveedor
          if (service.provider.toLowerCase() === providerAddress.toLowerCase()) {
            services.push({
              id: Number(serviceId),
              title: service.title,
              description: service.description,
              provider: service.provider,
              pricePerHour: Number(ethers.formatEther(service.pricePerHour)),
              category: 'General', // El contrato no tiene categoría, usamos 'General'
              isActive: Number(service.status) === 0, // ServiceStatus.Active = 0
              skillIds: service.skillIds.map((id: any) => Number(id)),
              status: Number(service.status),
              createdAt: Number(service.createdAt)
            });
          }
          
          serviceId++;
        }
      } catch (error) {
        // Cuando falla, hemos encontrado el final
        console.log(`Found ${serviceId} services total`);
      }
      
      return services;
    } catch (error) {
      console.error('Error getting provider services:', error);
      return [];
    }
  }

  async createService(
    title: string,
    description: string,
    pricePerHour: string,
    skillIds: number[]
  ): Promise<any> {
    const tx = await this.contract.createService(title, description, ethers.parseEther(pricePerHour), skillIds);
    return tx;
  }

  async createOrder(
    serviceId: number,
    hours: number,
    description: string
  ): Promise<any> {
    const tx = await this.contract.createOrder(serviceId, hours, description);
    return tx;
  }

  async acceptOrder(orderId: number): Promise<any> {
    const tx = await this.contract.acceptOrder(orderId);
    return tx;
  }

  async completeOrder(orderId: number): Promise<any> {
    const tx = await this.contract.completeOrder(orderId);
    return tx;
  }

  async getClientOrders(clientAddress: string): Promise<Order[]> {
    try {
      // El contrato no tiene getClientOrders, necesitamos iterar
      const orders: Order[] = [];
      let orderId = 0;
      
      try {
        while (true) {
          const order = await this.contract.orders(orderId);
          
          // Verificar si esta orden pertenece al cliente
          if (order.client.toLowerCase() === clientAddress.toLowerCase()) {
            try {
              const service = await this.contract.services(order.serviceId);
              
              orders.push({
                id: Number(orderId),
                service: {
                  id: Number(order.serviceId),
                  provider: service.provider,
                  title: service.title,
                  description: service.description,
                  pricePerHour: Number(ethers.formatEther(service.pricePerHour)),
                  category: 'General',
                  isActive: Number(service.status) === 0,
                  skillIds: service.skillIds.map((id: any) => Number(id)),
                  status: Number(service.status),
                  createdAt: Number(service.createdAt)
                },
                client: order.client,
                provider: order.provider,
                totalAmount: Number(ethers.formatEther(order.totalPrice)),
                status: Number(order.status),
                createdAt: Number(order.createdAt),
                completedAt: Number(order.completedAt)
              });
            } catch (error) {
              console.error(`Error getting service ${order.serviceId}:`, error);
            }
          }
          
          orderId++;
        }
      } catch (error) {
        // Cuando falla, hemos encontrado el final
        console.log(`Found ${orderId} orders total`);
      }
      
      return orders;
    } catch (error) {
      console.error('Error getting client orders:', error);
      return [];
    }
  }

  async getProviderOrders(providerAddress: string): Promise<Order[]> {
    try {
      // El contrato no tiene getProviderOrders, necesitamos iterar
      const orders: Order[] = [];
      let orderId = 0;
      
      try {
        while (true) {
          const order = await this.contract.orders(orderId);
          
          // Verificar si esta orden pertenece al proveedor
          if (order.provider.toLowerCase() === providerAddress.toLowerCase()) {
            try {
              const service = await this.contract.services(order.serviceId);
              
              orders.push({
                id: Number(orderId),
                service: {
                  id: Number(order.serviceId),
                  provider: service.provider,
                  title: service.title,
                  description: service.description,
                  pricePerHour: Number(ethers.formatEther(service.pricePerHour)),
                  category: 'General',
                  isActive: Number(service.status) === 0,
                  skillIds: service.skillIds.map((id: any) => Number(id)),
                  status: Number(service.status),
                  createdAt: Number(service.createdAt)
                },
                client: order.client,
                provider: order.provider,
                totalAmount: Number(ethers.formatEther(order.totalPrice)),
                status: Number(order.status),
                createdAt: Number(order.createdAt),
                completedAt: Number(order.completedAt)
              });
            } catch (error) {
              console.error(`Error getting service ${order.serviceId}:`, error);
            }
          }
          
          orderId++;
        }
      } catch (error) {
        // Cuando falla, hemos encontrado el final
        console.log(`Found ${orderId} orders total`);
      }
      
      return orders;
    } catch (error) {
      console.error('Error getting provider orders:', error);
      return [];
    }
  }

  async cancelOrder(orderId: number): Promise<any> {
    const tx = await this.contract.cancelOrder(orderId);
    return tx;
  }

  async disputeOrder(orderId: number): Promise<any> {
    const tx = await this.contract.disputeOrder(orderId);
    return tx;
  }
}

// Clase de servicio para Profile NFT
export class ProfileNFTService {
  private contract: ethers.Contract;

  constructor(provider: any, signer?: any) {
    this.contract = new ethers.Contract(
      CONTRACT_ADDRESSES.ProfileNFT,
      CONTRACT_ABIS.ProfileNFT,
      signer || provider
    );
  }

  async mintBuild(userAddress: string, metadataURI: string): Promise<any> {
    const tx = await this.contract.mintBuild(userAddress, metadataURI);
    return tx;
  }

  async getUserBuild(userAddress: string): Promise<any> {
    const build = await this.contract.getUserBuild(userAddress);
    return build;
  }

  async hasBuild(userAddress: string): Promise<boolean> {
    const hasBuild = await this.contract.hasBuild(userAddress);
    return hasBuild;
  }

  async evolveBuild(userAddress: string): Promise<any> {
    const tx = await this.contract.evolveBuild(userAddress);
    return tx;
  }

  async updateBuildMetadata(tokenId: number, newMetadataURI: string): Promise<any> {
    const tx = await this.contract.updateBuildMetadata(tokenId, newMetadataURI);
    return tx;
  }

  async burnBuild(tokenId: number): Promise<any> {
    const tx = await this.contract.burnBuild(tokenId);
    return tx;
  }

  async getBuildCount(): Promise<number> {
    const count = await this.contract.getBuildCount();
    return Number(count);
  }
}

