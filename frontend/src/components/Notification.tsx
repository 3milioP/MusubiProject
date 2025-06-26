import React, { useState, useEffect } from 'react';
import { 
  Alert, 
  AlertTitle, 
  IconButton, 
  Collapse,
  Box
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';

interface NotificationProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose?: () => void;
  show: boolean;
}

const Notification: React.FC<NotificationProps> = ({ 
  message, 
  type, 
  duration = 5000, 
  onClose, 
  show 
}) => {
  const [isVisible, setIsVisible] = useState(show);

  useEffect(() => {
    setIsVisible(show);
    
    if (show && duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon />;
      case 'error':
        return <ErrorIcon />;
      case 'warning':
        return <WarningIcon />;
      case 'info':
        return <InfoIcon />;
      default:
        return <InfoIcon />;
    }
  };

  return (
    <Collapse in={isVisible} timeout={300}>
      <Box sx={{ mb: 1 }}>
        <Alert
          severity={type}
          icon={getIcon()}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={handleClose}
              sx={{ 
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
          sx={{
            borderRadius: 2,
            boxShadow: 3,
            minWidth: { xs: '100%', md: 400 },
            maxWidth: { xs: '100%', md: 400 },
            '& .MuiAlert-message': {
              width: '100%'
            }
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            width: '100%'
          }}>
            <AlertTitle sx={{ 
              fontWeight: 600,
              fontSize: '0.9rem',
              mb: 0.5
            }}>
              {type === 'success' && 'Éxito'}
              {type === 'error' && 'Error'}
              {type === 'warning' && 'Advertencia'}
              {type === 'info' && 'Información'}
            </AlertTitle>
            <Box sx={{ 
              fontSize: '0.875rem',
              lineHeight: 1.4
            }}>
              {message}
            </Box>
          </Box>
        </Alert>
      </Box>
    </Collapse>
  );
};

export default Notification; 