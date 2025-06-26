import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  Box,
  Typography
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  Psychology as PsychologyIcon,
  Schedule as ScheduleIcon,
  Store as StoreIcon,
  Settings as SettingsIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarProps {
  isOpen: boolean;
  currentPage: string;
  onPageChange: (page: string) => void;
  onClose: () => void;
}

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, component: 'dashboard' },
  { text: 'Perfil', icon: <PersonIcon />, component: 'profile' },
  { text: 'Habilidades', icon: <PsychologyIcon />, component: 'skills' },
  { text: 'Registro de Tiempo', icon: <ScheduleIcon />, component: 'timeregistry' },
  { text: 'Marketplace', icon: <StoreIcon />, component: 'marketplace' },
  { text: 'Configuración', icon: <SettingsIcon />, component: 'settings' },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, currentPage, onPageChange, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  return (
    <Drawer
      variant="temporary"
      anchor="left"
      open={isOpen}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: 280,
          boxSizing: 'border-box',
        },
      }}
    >
      <Box sx={{ width: 280 }} role="presentation">
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h6" color="primary">
            🎯 Musubi
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Blockchain + IPFS
          </Typography>
        </Box>
        
        <Divider />
        
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.component} disablePadding>
              <ListItemButton
                selected={currentPage === item.component}
                onClick={() => {
                  onPageChange(item.component);
                  onClose();
                }}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: 'primary.light',
                    '&:hover': {
                      backgroundColor: 'primary.light',
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ color: currentPage === item.component ? 'primary.main' : 'inherit' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text}
                  sx={{ 
                    color: currentPage === item.component ? 'primary.main' : 'inherit',
                    fontWeight: currentPage === item.component ? 'bold' : 'normal'
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
