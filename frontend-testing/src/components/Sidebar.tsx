import React from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, Divider, Box } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PersonIcon from '@mui/icons-material/Person';
import PsychologyIcon from '@mui/icons-material/Psychology';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import StorefrontIcon from '@mui/icons-material/Storefront';
import SettingsIcon from '@mui/icons-material/Settings';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarProps {
  open: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ open }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Mi Perfil', icon: <PersonIcon />, path: '/profile' },
    { text: 'Mis Habilidades', icon: <PsychologyIcon />, path: '/skills' },
    { text: 'Registro Horario', icon: <AccessTimeIcon />, path: '/time-registry' },
    { text: 'Marketplace', icon: <StorefrontIcon />, path: '/marketplace' },
    { text: 'Configuración', icon: <SettingsIcon />, path: '/settings' },
  ];

  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={open}
      sx={{
        width: 240,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 240,
          boxSizing: 'border-box',
          top: 64,
          height: 'calc(100% - 64px)',
        },
      }}
    >
      <Box sx={{ overflow: 'auto', mt: 2 }}>
        <List>
          {menuItems.map((item) => (
            <ListItem 
              button 
              key={item.text}
              onClick={() => navigate(item.path)}
              selected={location.pathname === item.path}
              sx={{
                borderRadius: '0 20px 20px 0',
                mr: 2,
                mb: 0.5,
                '&.Mui-selected': {
                  backgroundColor: 'primary.light',
                  color: 'white',
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
                '&:hover': {
                  backgroundColor: 'rgba(63, 81, 181, 0.08)',
                },
              }}
            >
              <ListItemIcon sx={{ color: location.pathname === item.path ? 'white' : 'inherit' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
        <Divider sx={{ my: 2 }} />
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <img 
            src="/logo.png" 
            alt="Musubi Logo" 
            style={{ width: 120, opacity: 0.8 }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://via.placeholder.com/120x60?text=Musubi';
            }}
          />
        </Box>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
