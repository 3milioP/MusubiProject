import { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Button, 
  CardActions,
  Chip,
  LinearProgress,
  Alert,
  Snackbar,
  Avatar,
  Divider
} from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import PendingIcon from '@mui/icons-material/Pending';
import PersonIcon from '@mui/icons-material/Person';
import { useWeb3 } from '../contexts/Web3Context';
import { useSkills } from '../hooks/useContracts';
import { ProfessionalSkill } from '../types';

interface UserWithSkills {
  address: string;
  name?: string;
  declaredSkills: ProfessionalSkill[];
}

const Users = () => {
  const { account, isConnected } = useWeb3();
  const { 
    skills, // Todas las habilidades del sistema
    txState,
    loadSkills
  } = useSkills();

  const [users, setUsers] = useState<UserWithSkills[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [validationLoading, setValidationLoading] = useState<number | null>(null);

  useEffect(() => {
    if (isConnected && account) {
      loadSkills();
      loadUsers();
    }
  }, [isConnected, account, loadSkills]);

  const loadUsers = async () => {
    if (!isConnected || !account) return;
    
    setLoadingUsers(true);
    try {
      // Por ahora, simular usuarios con habilidades declaradas
      // En el futuro, esto vendría de la API/blockchain
      const mockUsers: UserWithSkills[] = [
        {
          address: '0x1234567890123456789012345678901234567890',
          name: 'Alice Developer',
          declaredSkills: [
            {
              skillId: 0,
              name: 'React',
              category: 'Desarrollo Web',
              declaredLevel: 1,
              isValidated: false,
              validator: '',
              validationDate: null
            }
          ]
        },
        {
          address: '0x0987654321098765432109876543210987654321',
          name: 'Bob Designer',
          declaredSkills: [
            {
              skillId: 1,
              name: 'Solidity',
              category: 'Blockchain',
              declaredLevel: 2,
              isValidated: true,
              validator: '0x1234567890123456789012345678901234567890',
              validationDate: new Date()
            }
          ]
        }
      ];
      
      setUsers(mockUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      setSnackbar({
        open: true,
        message: 'Error cargando usuarios',
        severity: 'error'
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleValidateSkill = async (skillId: number) => {
    if (!isConnected || !account) {
      setSnackbar({
        open: true,
        message: 'Por favor conecta tu wallet',
        severity: 'error'
      });
      return;
    }

    // Verificar que no eres el creador de la habilidad
    const skill = skills.find(s => s.id === skillId);
    if (skill && skill.creator.toLowerCase() === account.toLowerCase()) {
      setSnackbar({
        open: true,
        message: 'No puedes validar una habilidad que creaste',
        severity: 'error'
      });
      return;
    }

    setValidationLoading(skillId);
    try {
      // Aquí iría la lógica de validación en blockchain
      // await validateSkill(userAddress, skillId, level);
      
      setSnackbar({
        open: true,
        message: 'Habilidad validada exitosamente',
        severity: 'success'
      });
      
      // Recargar usuarios para actualizar el estado
      setTimeout(() => {
        loadUsers();
      }, 2000);
    } catch (error: any) {
      console.error('Error validating skill:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Error al validar habilidad',
        severity: 'error'
      });
    } finally {
      setValidationLoading(null);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getSkillStatusColor = (skill: ProfessionalSkill) => {
    if (skill.isValidated) return 'success';
    return 'default';
  };

  const getSkillStatusIcon = (skill: ProfessionalSkill) => {
    if (skill.isValidated) return <VerifiedIcon />;
    return <PendingIcon />;
  };

  const canValidateSkill = (skill: ProfessionalSkill) => {
    if (!account) return false;
    
    // Verificar que no eres el creador de la habilidad
    const contractSkill = skills.find(s => s.id === skill.skillId);
    if (contractSkill && contractSkill.creator.toLowerCase() === account.toLowerCase()) {
      return false;
    }
    
    return !skill.isValidated;
  };

  if (!isConnected) {
    return (
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Usuarios de Musubi
        </Typography>
        <Alert severity="warning" sx={{ mt: 2 }}>
          Por favor conecta tu wallet para ver y validar habilidades de otros usuarios.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Usuarios de Musubi
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Revisa las habilidades declaradas por otros usuarios y valida aquellas que consideres apropiadas.
      </Typography>

      {txState.error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {txState.error}
        </Alert>
      )}

      {loadingUsers ? (
        <Box sx={{ width: '100%', mt: 4 }}>
          <LinearProgress />
          <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
            Cargando usuarios...
          </Typography>
        </Box>
      ) : (
        <>
          {users.length === 0 ? (
            <Card sx={{ mt: 4, textAlign: 'center', py: 4 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  No hay usuarios registrados
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Los usuarios aparecerán aquí una vez que se registren en Musubi.
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={3}>
              {users.map((user) => (
                <Grid item xs={12} key={user.address}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Avatar sx={{ mr: 2 }}>
                          <PersonIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h6">
                            {user.name || 'Usuario Anónimo'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                            {user.address}
                          </Typography>
                        </Box>
                      </Box>

                      <Divider sx={{ mb: 2 }} />

                      <Typography variant="h6" gutterBottom>
                        Habilidades Declaradas ({user.declaredSkills.length})
                      </Typography>

                      {user.declaredSkills.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          Este usuario no ha declarado habilidades aún.
                        </Typography>
                      ) : (
                        <Grid container spacing={2}>
                          {user.declaredSkills.map((skill) => (
                            <Grid item xs={12} md={6} key={skill.skillId}>
                              <Card variant="outlined">
                                <CardContent>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                    <Typography variant="h6">
                                      {skill.name || 'Habilidad'}
                                    </Typography>
                                    <Chip 
                                      icon={getSkillStatusIcon(skill)}
                                      label={skill.isValidated ? 'Validada' : 'Pendiente'}
                                      color={getSkillStatusColor(skill)}
                                      size="small"
                                    />
                                  </Box>
                                  
                                  <Chip
                                    size="small"
                                    variant="outlined"
                                    label={skill.category || 'Sin categoría'}
                                    sx={{ mb: 1 }}
                                  />

                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    <strong>Nivel:</strong> {['Principiante', 'Intermedio', 'Avanzado'][skill.declaredLevel]}
                                  </Typography>

                                  {skill.isValidated && (
                                    <Typography variant="body2" color="text.secondary" sx={{ 
                                      fontFamily: 'monospace', 
                                      fontSize: '0.75rem',
                                      wordBreak: 'break-all'
                                    }}>
                                      <strong>Validada por:</strong> {skill.validator}
                                    </Typography>
                                  )}
                                </CardContent>

                                <CardActions>
                                  {canValidateSkill(skill) ? (
                                    <Button 
                                      size="small" 
                                      color="primary"
                                      onClick={() => handleValidateSkill(skill.skillId)}
                                      disabled={validationLoading === skill.skillId}
                                    >
                                      {validationLoading === skill.skillId ? 'Validando...' : 'Validar'}
                                    </Button>
                                  ) : skill.isValidated ? (
                                    <Chip 
                                      size="small" 
                                      color="success" 
                                      label="Ya validada"
                                    />
                                  ) : (
                                    <Chip 
                                      size="small" 
                                      color="warning" 
                                      label="No puedes validar"
                                    />
                                  )}
                                </CardActions>
                              </Card>
                            </Grid>
                          ))}
                        </Grid>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Users; 