import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Chip, 
  CircularProgress,
  Alert,
  Button
} from '@mui/material';
import { 
  CheckCircle, 
  Error, 
  Warning,
  Refresh
} from '@mui/icons-material';
import { IPFSService } from '../services/ipfs';

interface IPFSStatusProps {
    showDetails?: boolean;
}

const IPFSStatus: React.FC<IPFSStatusProps> = ({ showDetails = false }) => {
    const [ipfsInfo, setIpfsInfo] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        checkIPFSStatus();
    }, []);

    const checkIPFSStatus = async () => {
        try {
            setIsLoading(true);
            setError(null);
            
            const info = await IPFSService.getInfo();
            setIpfsInfo(info);
        } catch (err) {
            setError('Error verificando IPFS');
            console.error('Error checking IPFS status:', err);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} />
                <Typography variant="body2">Verificando IPFS...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Error color="error" fontSize="small" />
                <Typography variant="body2" color="error">Error: {error}</Typography>
                <Button 
                    size="small" 
                    startIcon={<Refresh />}
                    onClick={checkIPFSStatus}
                >
                    Reintentar
                </Button>
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                {ipfsInfo?.available ? (
                    <CheckCircle color="success" fontSize="small" />
                ) : (
                    <Warning color="warning" fontSize="small" />
                )}
                <Typography variant="body2">
                    IPFS: {ipfsInfo?.available ? 'Conectado' : 'No disponible'}
                </Typography>
                {ipfsInfo?.version && (
                    <Chip 
                        label={`v${ipfsInfo.version}`} 
                        size="small" 
                        variant="outlined"
                    />
                )}
            </Box>
            
            {showDetails && !ipfsInfo?.available && (
                <Alert severity="info" sx={{ mt: 1 }}>
                    <Typography variant="body2">
                        Para habilitar IPFS, ejecuta: <code>ipfs daemon</code>
                    </Typography>
                </Alert>
            )}
        </Box>
    );
};

export default IPFSStatus;
