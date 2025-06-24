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
  Order 
} from '../types';

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
    const balance = await this.contract.balanceOf(address);
    return ethers.formatEther(balance);
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
  private apiUrl: string;

  constructor(provider: any, signer?: any) {
    this.contract = new ethers.Contract(
      CONTRACT_ADDRESSES.ProfileRegistry,
      CONTRACT_ABIS.ProfileRegistry,
      signer || provider
    );
    this.apiUrl = 'http://localhost:5001'; // URL de la API de Musubi (puerto correcto)
  }

  async getProfile(address: string): Promise<Profile | null> {
    try {
      const profile = await this.contract.getProfile(address);
      
      // Verificar si el perfil existe
      if (profile.wallet_addr === '0x0000000000000000000000000000000000000000') {
        return null;
      }
      
      return {
        address: address,
        isCompany: profile.profileType === 1, // 0 = Professional, 1 = Company
        isActive: profile.isVerified,
        metadataURI: profile.metadataURI,
        name: profile.name,
        bio: profile.description,
        location: 'No especificada',
        website: '',
        skills: [],
        karma: Number(profile.karma),
        isVerified: profile.isVerified,
        disclaimerAccepted: profile.disclaimerAccepted
      };
    } catch (error) {
      console.error('Error getting profile:', error);
      return null;
    }
  }

  async registerProfile(
    name: string, 
    description: string, 
    metadataURI: string, 
    profileType: number, 
    acceptDisclaimer: boolean
  ): Promise<any> {
    console.log('🔍 ProfileRegistryService.registerProfile - Llamando al contrato con:', {
      name,
      description,
      metadataURI,
      profileType,
      acceptDisclaimer,
      contractAddress: this.contract.address
    });
    
    // Validar que el contrato esté disponible
    if (!this.contract) {
      throw new Error('Contrato no disponible');
    }
    
    const tx = await this.contract.registerProfile(name, description, metadataURI, profileType, acceptDisclaimer);
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
    this.apiUrl = 'http://localhost:5001'; // URL de la API de Musubi (puerto correcto)
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
      // Preparar datos del perfil para IPFS
      const profileData = {
        name,
        description,
        profileType: profileType === 1 ? 'company' : 'professional',
        acceptDisclaimer,
        ...additionalData,
        timestamp: new Date().toISOString()
      };

      // Llamar a la API para registrar el perfil con IPFS
      const response = await fetch(`${this.apiUrl}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet_address: additionalData.walletAddress || '0x0000000000000000000000000000000000000000',
          name: profileData.name,
          email: additionalData.email || '',
          profile_data: profileData,
          ipfs_hash: '', // La API lo generará automáticamente
          storage_type: 'decentralized_ipfs'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error en la API: ${errorData.detail || response.statusText}`);
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
      const response = await fetch(`${this.apiUrl}/api/users/${walletAddress}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Error en la API: ${response.statusText}`);
      }

      const userData = await response.json();
      
      // Convertir datos de la API al formato del frontend
      return {
        address: walletAddress,
        isCompany: userData.profile_data?.profileType === 'company',
        isActive: true, // Asumimos que si existe en IPFS está activo
        metadataURI: userData.ipfs_hash || '',
        name: userData.name || userData.profile_data?.name || '',
        bio: userData.profile_data?.description || '',
        location: userData.profile_data?.location || 'No especificada',
        website: userData.profile_data?.website || '',
        skills: [],
        karma: 0,
        isVerified: false,
        disclaimerAccepted: userData.profile_data?.acceptDisclaimer || false
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
      const response = await fetch(`${this.apiUrl}/api/users/${walletAddress}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          profile_data: {
            name,
            description,
            ...additionalData,
            timestamp: new Date().toISOString()
          }
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
    this.contract = new ethers.Contract(
      CONTRACT_ADDRESSES.SkillSystem,
      CONTRACT_ABIS.SkillSystem,
      signer || provider
    );
  }

  async getSkillsCount(): Promise<number> {
    // Como no hay un contador público, intentamos obtener habilidades hasta que falle
    let count = 0;
    try {
      while (true) {
        await this.contract.skills(count);
        count++;
      }
    } catch (error) {
      // Cuando falla, hemos encontrado el final
      return count;
    }
  }

  async getSkill(skillId: number): Promise<Skill> {
    const skill = await this.contract.skills(skillId);
    return {
      id: skillId,
      name: skill.name,
      category: skill.category,
      isValidated: true, // Por defecto asumimos que está validada
      validatedBy: '',
      validatedAt: 0,
      declaredAt: 0
    };
  }

  async getAllSkills(): Promise<Skill[]> {
    const skills: Skill[] = [];
    const count = await this.getSkillsCount();
    
    for (let i = 0; i < count; i++) {
      try {
        const skill = await this.getSkill(i);
        if (skill.name) {
          skills.push(skill);
        }
      } catch (error) {
        console.error(`Error getting skill ${i}:`, error);
      }
    }
    
    return skills;
  }

  async getUserDeclaredSkills(userAddress: string): Promise<DeclaredSkill[]> {
    try {
      const declaredSkills: DeclaredSkill[] = [];
      
      // Usar la nueva función del contrato
      const skillIds = await this.contract.getProfessionalSkills(userAddress);
      
      for (let i = 0; i < skillIds.length; i++) {
        try {
          const declaredSkill = await this.contract.getDeclaredSkill(userAddress, skillIds[i]);
          const skill = await this.contract.skills(skillIds[i]);
          
          declaredSkills.push({
            id: Number(skillIds[i]),
            skillId: Number(skillIds[i]),
            skillName: skill.name,
            skillCategory: skill.category,
            declaredLevel: Number(declaredSkill.level),
            karma: Number(declaredSkill.level) * 10, // Karma basado en nivel
            isValidated: declaredSkill.isValidated,
            validatedBy: declaredSkill.validatedBy,
            validatedAt: Number(declaredSkill.validationDate),
            declaredAt: Number(declaredSkill.declaredAt)
          });
        } catch (error) {
          console.error(`Error getting declared skill ${skillIds[i]}:`, error);
        }
      }
      
      return declaredSkills;
    } catch (error) {
      console.error('Error getting user declared skills:', error);
      return [];
    }
  }

  async createSkill(name: string, category: string): Promise<any> {
    const tx = await this.contract.createSkill(name, category);
    return tx;
  }

  async declareSkill(skillId: number, level: number): Promise<any> {
    const tx = await this.contract.declareSkill(skillId, level);
    return tx;
  }

  async validateSkill(professional: string, skillId: number, isValid: boolean): Promise<any> {
    const tx = await this.contract.validateSkill(professional, skillId, isValid);
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
      // El contrato no tiene getEmployeeRecords, necesitamos iterar
      const timeRecords: TimeRecord[] = [];
      let recordId = 0;
      
      try {
        while (true) {
          const record = await this.contract.timeRecords(recordId);
          
          // Verificar si este registro pertenece al usuario
          if (record.employee.toLowerCase() === userAddress.toLowerCase()) {
            timeRecords.push({
              id: Number(recordId),
              worker: record.employee,
              company: record.company,
              description: record.description,
              duration: Number(record.endTime) - Number(record.startTime),
              timestamp: Number(record.startTime),
              isValidated: Number(record.status) === 1, // RecordStatus.Validated
              validatedBy: '',
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
      // El contrato no tiene getCompanyRecords, necesitamos iterar
      const timeRecords: TimeRecord[] = [];
      let recordId = 0;
      
      try {
        while (true) {
          const record = await this.contract.timeRecords(recordId);
          
          // Verificar si este registro pertenece a la empresa
          if (record.company.toLowerCase() === companyAddress.toLowerCase()) {
            timeRecords.push({
              id: Number(recordId),
              worker: record.employee,
              company: record.company,
              description: record.description,
              duration: Number(record.endTime) - Number(record.startTime),
              timestamp: Number(record.startTime),
              isValidated: Number(record.status) === 1, // RecordStatus.Validated
              validatedBy: '',
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
    company: string,
    skillId: number,
    startTime: number,
    endTime: number,
    description: string
  ): Promise<any> {
    const tx = await this.contract.recordTime(company, skillId, startTime, endTime, description);
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

