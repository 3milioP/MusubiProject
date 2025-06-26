// Tipos TypeScript para el sistema Musubi
export interface User {
  address: string;
  isConnected: boolean;
  balance: string;
  krmBalance: string;
}

export interface Profile {
  address: string;
  isCompany: boolean;
  isActive: boolean;
  metadataURI: string;
  // Datos del metadata
  name?: string;
  bio?: string;
  location?: string;
  website?: string;
  skills?: string[];
  // Nuevos campos del contrato
  karma?: number;
  isVerified?: boolean;
  disclaimerAccepted?: boolean;
  // Datos adicionales de IPFS
  github?: string;
  linkedin?: string;
  hourlyRate?: number;
  languages?: string[];
  industry?: string;
  size?: string;
  founded?: number;
  services?: string[];
  availability?: string;
  project?: string;
  budget?: string;
  timeline?: string;
}

export interface Skill {
  id: number;
  name: string;
  category: string;
  description?: string;
  level?: string;
  tags?: string[];
  metadataURI?: string;
  isActive?: boolean;
  isValidated: boolean;
  validatedBy: string;
  validatedAt: number;
  declaredAt: number;
}

export interface ProfessionalSkill {
  skillId: number;
  name: string;
  category: string;
  description?: string;
  level?: string;
  tags?: string[];
  declaredLevel: number;
  isValidated: boolean;
  validator: string;
  validationDate: Date | null;
}

export interface DeclaredSkill {
  id: number;
  skillId: number;
  skillName: string;
  skillCategory: string;
  declaredLevel: number; // 0: Beginner, 1: Intermediate, 2: Advanced, 3: Expert
  karma: number;
  isValidated: boolean;
  validatedBy: string;
  validatedAt: number;
  declaredAt: number;
}

export interface TimeRecord {
  id: number;
  worker: string;
  company: string;
  skillId: number;
  skillName: string;
  description: string;
  duration: number;
  timestamp: number;
  isValidated: boolean;
  validatedBy: string;
  validatedAt: number;
}

export interface Service {
  id: number;
  provider: string;
  title: string;
  description: string;
  pricePerHour: number;
  category: string;
  isActive: boolean;
  skillIds: number[];
  status: number;
  createdAt: number;
}

export interface Order {
  id: number;
  service: Service;
  client: string;
  provider: string;
  totalAmount: number;
  status: number; // 0: Created, 1: Accepted, 2: Completed, 3: Cancelled
  createdAt: number;
  completedAt: number;
}

export interface ContractAddresses {
  KRMToken: string;
  ProfileRegistry: string;
  SkillSystem: string;
  TimeRegistry: string;
  P2PMarketplace: string;
  ProfileNFT: string;
  IPFSRegistry: string;
}

export interface TransactionState {
  loading: boolean;
  error: string | null;
  success: boolean;
}

export interface Web3State {
  isConnected: boolean;
  account: string | null;
  chainId: number | null;
  provider: any;
  signer: any;
  connecting: boolean;
  error: string | null;
}

// Enums para mejor tipado
export enum SkillLevel {
  Beginner = 0,
  Intermediate = 1,
  Advanced = 2
}

export enum TimeRecordStatus {
  Pending = 0,
  Validated = 1,
  Rejected = 2
}

export enum OrderStatus {
  Pending = 0,
  Accepted = 1,
  Completed = 2,
  Cancelled = 3
}

