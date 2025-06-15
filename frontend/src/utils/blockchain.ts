// Utilidades para interacción con blockchain
import { ethers } from 'ethers';

// Formatear direcciones de wallet
export const formatAddress = (address: string): string => {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

// Formatear cantidades de tokens
export const formatTokenAmount = (amount: string | number, decimals: number = 18): string => {
  try {
    const formatted = ethers.formatUnits(amount.toString(), decimals);
    const num = parseFloat(formatted);
    
    if (num === 0) return '0';
    if (num < 0.001) return '< 0.001';
    if (num < 1) return num.toFixed(3);
    if (num < 1000) return num.toFixed(2);
    if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
    return `${(num / 1000000).toFixed(1)}M`;
  } catch (error) {
    return '0';
  }
};

// Parsear cantidades de tokens
export const parseTokenAmount = (amount: string, decimals: number = 18): string => {
  try {
    return ethers.parseUnits(amount, decimals).toString();
  } catch (error) {
    throw new Error('Invalid token amount');
  }
};

// Formatear tiempo Unix a fecha legible
export const formatTimestamp = (timestamp: number): string => {
  if (!timestamp || timestamp === 0) return 'N/A';
  return new Date(timestamp * 1000).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Calcular duración entre timestamps
export const calculateDuration = (startTime: number, endTime: number): string => {
  const duration = endTime - startTime;
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
};

// Validar dirección Ethereum
export const isValidAddress = (address: string): boolean => {
  try {
    return ethers.isAddress(address);
  } catch {
    return false;
  }
};

// Obtener nombre de red por Chain ID
export const getNetworkName = (chainId: number): string => {
  const networks: { [key: number]: string } = {
    1: 'Ethereum Mainnet',
    3: 'Ropsten Testnet',
    4: 'Rinkeby Testnet',
    5: 'Goerli Testnet',
    42: 'Kovan Testnet',
    137: 'Polygon Mainnet',
    80001: 'Polygon Mumbai',
    31337: 'Hardhat Local'
  };
  
  return networks[chainId] || `Unknown Network (${chainId})`;
};

// Manejar errores de transacciones
export const parseTransactionError = (error: any): string => {
  if (error?.reason) return error.reason;
  if (error?.message) {
    if (error.message.includes('user rejected')) {
      return 'Transacción cancelada por el usuario';
    }
    if (error.message.includes('insufficient funds')) {
      return 'Fondos insuficientes';
    }
    if (error.message.includes('gas')) {
      return 'Error de gas - intenta aumentar el límite';
    }
    return error.message;
  }
  return 'Error desconocido en la transacción';
};

// Esperar confirmación de transacción
export const waitForTransaction = async (
  provider: any,
  txHash: string,
  confirmations: number = 1
): Promise<any> => {
  try {
    const receipt = await provider.waitForTransaction(txHash, confirmations);
    return receipt;
  } catch (error) {
    throw new Error(`Error esperando confirmación: ${parseTransactionError(error)}`);
  }
};

// Obtener balance de ETH
export const getEthBalance = async (provider: any, address: string): Promise<string> => {
  try {
    const balance = await provider.getBalance(address);
    return ethers.formatEther(balance);
  } catch (error) {
    return '0';
  }
};

// Verificar si MetaMask está instalado
export const isMetaMaskInstalled = (): boolean => {
  return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
};

// Obtener provider de MetaMask
export const getMetaMaskProvider = () => {
  if (!isMetaMaskInstalled() || !window.ethereum) {
    throw new Error('MetaMask no está instalado');
  }
  return new ethers.BrowserProvider(window.ethereum);
};

// Cambiar a red específica
export const switchToNetwork = async (chainId: number): Promise<void> => {
  if (!isMetaMaskInstalled() || !window.ethereum) {
    throw new Error('MetaMask no está instalado');
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${chainId.toString(16)}` }],
    });
  } catch (error: any) {
    // Si la red no está agregada, intentar agregarla (solo para redes conocidas)
    if (error.code === 4902) {
      if (chainId === 31337) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x539',
            chainName: 'Hardhat Local',
            nativeCurrency: {
              name: 'ETH',
              symbol: 'ETH',
              decimals: 18
            },
            rpcUrls: ['http://localhost:8545'],
            blockExplorerUrls: null
          }]
        });
      } else {
        throw new Error('Red no soportada');
      }
    } else {
      throw error;
    }
  }
};

// Formatear nivel de habilidad
export const formatSkillLevel = (level: number): string => {
  const levels = ['Principiante', 'Intermedio', 'Avanzado'];
  return levels[level] || 'Desconocido';
};

// Formatear estado de orden
export const formatOrderStatus = (status: number): string => {
  const statuses = ['Pendiente', 'Aceptada', 'Completada', 'Cancelada'];
  return statuses[status] || 'Desconocido';
};

// Formatear estado de registro de tiempo
export const formatTimeRecordStatus = (status: number): string => {
  const statuses = ['Pendiente', 'Validado', 'Rechazado'];
  return statuses[status] || 'Desconocido';
};

