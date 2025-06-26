/**
 * Servicio IPFS para el frontend
 * Accede directamente a IPFS sin necesidad de API intermediaria
 */

const IPFS_API_URL = 'http://localhost:5001/api/v0';
const IPFS_GATEWAY_URL = 'http://localhost:8080/ipfs';

// Verificar si IPFS está disponible
export const checkIPFSConnection = async (): Promise<boolean> => {
    try {
        const response = await fetch(`${IPFS_API_URL}/version`, {
            method: 'POST'
        });
        return response.ok;
    } catch (error) {
        console.warn('IPFS no está disponible:', error);
        return false;
    }
};

// Obtener información de IPFS
export const getIPFSInfo = async () => {
    try {
        const response = await fetch(`${IPFS_API_URL}/version`, {
            method: 'POST'
        });
        if (response.ok) {
            const data = await response.json();
            return {
                version: data.Version,
                available: true,
                apiUrl: IPFS_API_URL,
                gatewayUrl: IPFS_GATEWAY_URL
            };
        }
    } catch (error) {
        console.warn('Error obteniendo información de IPFS:', error);
    }
    
    return {
        version: 'No disponible',
        available: false,
        apiUrl: IPFS_API_URL,
        gatewayUrl: IPFS_GATEWAY_URL
    };
};

// Subir datos a IPFS
export const uploadToIPFS = async (data: any): Promise<string> => {
    try {
        // Convertir datos a JSON
        const jsonData = JSON.stringify(data);
        const blob = new Blob([jsonData], { type: 'application/json' });
        
        // Crear FormData para subir
        const formData = new FormData();
        formData.append('file', blob, 'data.json');
        
        const response = await fetch(`${IPFS_API_URL}/add`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`Error subiendo a IPFS: ${response.statusText}`);
        }
        
        const result = await response.json();
        return result.Hash;
    } catch (error) {
        console.error('Error subiendo a IPFS:', error);
        throw error;
    }
};

// Obtener datos de IPFS
export const getFromIPFS = async (hash: string): Promise<any> => {
    try {
        // Intentar obtener desde el gateway local primero
        const response = await fetch(`${IPFS_GATEWAY_URL}/${hash}`);
        
        if (!response.ok) {
            // Fallback a gateway público
            const publicResponse = await fetch(`https://ipfs.io/ipfs/${hash}`);
            if (!publicResponse.ok) {
                throw new Error(`Error obteniendo datos de IPFS: ${response.statusText}`);
            }
            return await publicResponse.json();
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error obteniendo de IPFS:', error);
        throw error;
    }
};

// Verificar si un hash existe en IPFS
export const checkIPFSHash = async (hash: string): Promise<boolean> => {
    try {
        const response = await fetch(`${IPFS_API_URL}/cat?arg=${hash}`);
        return response.ok;
    } catch (error) {
        console.warn(`Hash ${hash} no encontrado en IPFS:`, error);
        return false;
    }
};

// Obtener URL completa para un hash
export const getIPFSURL = (hash: string): string => {
    return `${IPFS_GATEWAY_URL}/${hash}`;
};

// Obtener URL pública para un hash (fallback)
export const getPublicIPFSURL = (hash: string): string => {
    return `https://ipfs.io/ipfs/${hash}`;
};

// Servicio completo de IPFS
export const IPFSService = {
    checkConnection: checkIPFSConnection,
    getInfo: getIPFSInfo,
    upload: uploadToIPFS,
    get: getFromIPFS,
    checkHash: checkIPFSHash,
    getURL: getIPFSURL,
    getPublicURL: getPublicIPFSURL
};

export default IPFSService; 