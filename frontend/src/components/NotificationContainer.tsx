import React from 'react';
import { Box } from '@mui/material';
import { useNotification } from '../contexts/NotificationContext';
import Notification from './Notification';

const NotificationContainer: React.FC = () => {
  const { notifications, hideNotification } = useNotification();

  return (
    <Box
      sx={{
        position: 'fixed',
        top: { xs: 16, md: 24 },
        right: { xs: 16, md: 24 },
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        maxWidth: { xs: 'calc(100vw - 32px)', md: 400 },
        pointerEvents: 'none',
        '& > *': {
          pointerEvents: 'auto'
        }
      }}
    >
      {notifications.map((notification, index) => (
        <Box
          key={notification.id}
          sx={{
            transform: `translateY(${index * 80}px)`,
            zIndex: 1000 - index,
            transition: 'transform 0.3s ease-in-out'
          }}
        >
          <Notification
            message={notification.message}
            type={notification.type}
            duration={notification.duration}
            show={true}
            onClose={() => hideNotification(notification.id)}
          />
        </Box>
      ))}
    </Box>
  );
};

export default NotificationContainer; 