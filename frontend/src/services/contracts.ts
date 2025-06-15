// Servicios para interactuar con los contratos inteligentes
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '../config';
import { 
  Profile, 
  Skill, 
  DeclaredSkill, 
  TimeRecord, 
  Service, 
  Order 
} from '../types';

// ABIs simplificados de los contratos (solo funciones necesarias)
const KRM_TOKEN_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)'
];

const PROFILE_REGISTRY_ABI = [
  'function profiles(address) view returns (bool isCompany, bool isActive, string metadataURI)',
  'function registerProfile(bool isCompany, string metadataURI)',
  'function updateProfile(string metadataURI)',
  'function deactivateProfile()',
  'function hasRole(bytes32 role, address account) view returns (bool)',
  'function DEFAULT_ADMIN_ROLE() view returns (bytes32)'
];

const SKILL_SYSTEM_ABI = [
  'function skillsCount() view returns (uint256)',
  'function skills(uint256) view returns (string name, string category, bool isActive)',
  'function declaredSkillsCount() view returns (uint256)',
  'function declaredSkills(uint256) view returns (address user, uint256 skillId, uint8 declaredLevel, bool isValidated, address validatedBy)',
  'function createSkill(string name, string category)',
  'function declareSkill(uint256 skillId, uint8 level)',
  'function validateSkill(uint256 declaredSkillId)',
  'function getUserDeclaredSkills(address user) view returns (uint256[])',
  'function hasRole(bytes32 role, address account) view returns (bool)',
  'function ADMIN_ROLE() view returns (bytes32)'
];

const TIME_REGISTRY_ABI = [
  'function timeRecordsCount() view returns (uint256)',
  'function timeRecords(uint256) view returns (address employee, address company, uint256 startTime, uint256 endTime, string description, uint8 status, uint256 validatedAt)',
  'function registerTime(address company, uint256 startTime, uint256 endTime, string description, uint256[] skillIds)',
  'function validateTimeRecord(uint256 recordId)',
  'function rejectTimeRecord(uint256 recordId)',
  'function getUserTimeRecords(address user) view returns (uint256[])',
  'function getCompanyTimeRecords(address company) view returns (uint256[])'
];

const P2P_MARKETPLACE_ABI = [
  'function serviceCounter() view returns (uint256)',
  'function orderCounter() view returns (uint256)',
  'function services(uint256) view returns (address provider, string title, string description, uint256 pricePerHour, bool isActive)',
  'function orders(uint256) view returns (uint256 serviceId, address client, address provider, uint256 hours, uint256 totalPrice, string description, uint8 status, uint256 createdAt, uint256 completedAt)',
  'function createService(string title, string description, uint256 pricePerHour, uint256[] skillIds)',
  'function createOrder(uint256 serviceId, uint256 hours, string description)',
  'function acceptOrder(uint256 orderId)',
  'function completeOrder(uint256 orderId)',
  'function cancelOrder(uint256 orderId)',
  'function getProviderServices(address provider) view returns (uint256[])',
  'function getClientOrders(address client) view returns (uint256[])',
  'function platformFee() view returns (uint256)',
  'function krmTokenAddress() view returns (address)'
];

// Clase de servicio para KRM Token
export class KRMTokenService {
  private contract: ethers.Contract;

  constructor(provider: any, signer?: any) {
    this.contract = new ethers.Contract(
      CONTRACT_ADDRESSES.krmToken,
      KRM_TOKEN_ABI,
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

  constructor(provider: any, signer?: any) {
    this.contract = new ethers.Contract(
      CONTRACT_ADDRESSES.profileRegistry,
      PROFILE_REGISTRY_ABI,
      signer || provider
    );
  }

  async getProfile(address: string): Promise<Profile | null> {
    try {
      const profile = await this.contract.profiles(address);
      if (!profile.isActive && !profile.isCompany && !profile.metadataURI) {
        return null;
      }
      
      return {
        address,
        isCompany: profile.isCompany,
        isActive: profile.isActive,
        metadataURI: profile.metadataURI
      };
    } catch (error) {
      return null;
    }
  }

  async registerProfile(isCompany: boolean, metadataURI: string): Promise<any> {
    const tx = await this.contract.registerProfile(isCompany, metadataURI);
    return tx;
  }

  async updateProfile(metadataURI: string): Promise<any> {
    const tx = await this.contract.updateProfile(metadataURI);
    return tx;
  }

  async deactivateProfile(): Promise<any> {
    const tx = await this.contract.deactivateProfile();
    return tx;
  }
}

// Clase de servicio para Skill System
export class SkillSystemService {
  private contract: ethers.Contract;

  constructor(provider: any, signer?: any) {
    this.contract = new ethers.Contract(
      CONTRACT_ADDRESSES.skillSystem,
      SKILL_SYSTEM_ABI,
      signer || provider
    );
  }

  async getSkillsCount(): Promise<number> {
    const count = await this.contract.skillsCount();
    return Number(count);
  }

  async getSkill(skillId: number): Promise<Skill> {
    const skill = await this.contract.skills(skillId);
    return {
      id: skillId,
      name: skill.name,
      category: skill.category,
      isActive: skill.isActive
    };
  }

  async getAllSkills(): Promise<Skill[]> {
    const count = await this.getSkillsCount();
    const skills: Skill[] = [];
    
    for (let i = 0; i < count; i++) {
      try {
        const skill = await this.getSkill(i);
        skills.push(skill);
      } catch (error) {
        console.error(`Error getting skill ${i}:`, error);
      }
    }
    
    return skills;
  }

  async getUserDeclaredSkills(userAddress: string): Promise<DeclaredSkill[]> {
    try {
      const skillIds = await this.contract.getUserDeclaredSkills(userAddress);
      const declaredSkills: DeclaredSkill[] = [];
      
      for (const skillId of skillIds) {
        try {
          const declaredSkill = await this.contract.declaredSkills(Number(skillId));
          const skill = await this.getSkill(declaredSkill.skillId);
          
          declaredSkills.push({
            id: Number(skillId),
            user: declaredSkill.user,
            skillId: Number(declaredSkill.skillId),
            declaredLevel: declaredSkill.declaredLevel,
            isValidated: declaredSkill.isValidated,
            validatedBy: declaredSkill.validatedBy,
            skill
          });
        } catch (error) {
          console.error(`Error getting declared skill ${skillId}:`, error);
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

  async validateSkill(declaredSkillId: number): Promise<any> {
    const tx = await this.contract.validateSkill(declaredSkillId);
    return tx;
  }
}

// Clase de servicio para Time Registry
export class TimeRegistryService {
  private contract: ethers.Contract;

  constructor(provider: any, signer?: any) {
    this.contract = new ethers.Contract(
      CONTRACT_ADDRESSES.timeRegistry,
      TIME_REGISTRY_ABI,
      signer || provider
    );
  }

  async getUserTimeRecords(userAddress: string): Promise<TimeRecord[]> {
    try {
      const recordIds = await this.contract.getUserTimeRecords(userAddress);
      const timeRecords: TimeRecord[] = [];
      
      for (const recordId of recordIds) {
        try {
          const record = await this.contract.timeRecords(Number(recordId));
          
          timeRecords.push({
            id: Number(recordId),
            employee: record.employee,
            company: record.company,
            startTime: Number(record.startTime),
            endTime: Number(record.endTime),
            description: record.description,
            skillIds: [], // Se puede obtener de eventos si es necesario
            status: record.status,
            validatedAt: Number(record.validatedAt)
          });
        } catch (error) {
          console.error(`Error getting time record ${recordId}:`, error);
        }
      }
      
      return timeRecords;
    } catch (error) {
      console.error('Error getting user time records:', error);
      return [];
    }
  }

  async registerTime(
    company: string,
    startTime: number,
    endTime: number,
    description: string,
    skillIds: number[]
  ): Promise<any> {
    const tx = await this.contract.registerTime(
      company,
      startTime,
      endTime,
      description,
      skillIds
    );
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
}

// Clase de servicio para P2P Marketplace
export class P2PMarketplaceService {
  private contract: ethers.Contract;

  constructor(provider: any, signer?: any) {
    this.contract = new ethers.Contract(
      CONTRACT_ADDRESSES.p2pMarketplace,
      P2P_MARKETPLACE_ABI,
      signer || provider
    );
  }

  async getServicesCount(): Promise<number> {
    const count = await this.contract.serviceCounter();
    return Number(count);
  }

  async getService(serviceId: number): Promise<Service> {
    const service = await this.contract.services(serviceId);
    return {
      id: serviceId,
      provider: service.provider,
      title: service.title,
      description: service.description,
      pricePerHour: ethers.formatEther(service.pricePerHour),
      skillIds: [], // Se puede obtener de eventos si es necesario
      isActive: service.isActive
    };
  }

  async getAllServices(): Promise<Service[]> {
    const count = await this.getServicesCount();
    const services: Service[] = [];
    
    for (let i = 0; i < count; i++) {
      try {
        const service = await this.getService(i);
        if (service.isActive) {
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
      const serviceIds = await this.contract.getProviderServices(providerAddress);
      const services: Service[] = [];
      
      for (const serviceId of serviceIds) {
        try {
          const service = await this.getService(Number(serviceId));
          services.push(service);
        } catch (error) {
          console.error(`Error getting service ${serviceId}:`, error);
        }
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
    const tx = await this.contract.createService(
      title,
      description,
      ethers.parseEther(pricePerHour),
      skillIds
    );
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
      const orderIds = await this.contract.getClientOrders(clientAddress);
      const orders: Order[] = [];
      
      for (const orderId of orderIds) {
        try {
          const order = await this.contract.orders(Number(orderId));
          
          orders.push({
            id: Number(orderId),
            serviceId: Number(order.serviceId),
            client: order.client,
            provider: order.provider,
            hours: Number(order.hours),
            totalPrice: ethers.formatEther(order.totalPrice),
            description: order.description,
            status: order.status,
            createdAt: Number(order.createdAt),
            completedAt: Number(order.completedAt)
          });
        } catch (error) {
          console.error(`Error getting order ${orderId}:`, error);
        }
      }
      
      return orders;
    } catch (error) {
      console.error('Error getting client orders:', error);
      return [];
    }
  }
}

