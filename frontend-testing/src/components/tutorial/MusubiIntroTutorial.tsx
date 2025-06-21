import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Avatar,
  Chip,
  Grid,
  Paper,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  AccountBalanceWallet,
  Work,
  AccessTime,
  Store,
  TrendingUp,
  CheckCircle,
  PlayArrow,
  Security,
  Public,
  Speed,
  MonetizationOn,
  Groups,
  Verified,
  Timeline,
  Handshake,
  School,
  BusinessCenter,
  EmojiObjects,
  Rocket,
  Star,
  AutoAwesome,
  Psychology,
  FactCheck,
  Update,
  Badge
} from '@mui/icons-material';

interface MusubiIntroTutorialProps {
  onComplete: () => void;
}

const MusubiIntroTutorial: React.FC<MusubiIntroTutorialProps> = ({ onComplete }) => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      label: '¿Qué es Musubi?',
      icon: <EmojiObjects />,
      content: (
        <Box>
          <Typography variant="h5" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
            🎯 Autenticidad y Trazabilidad del Talento
          </Typography>
          
          <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.7 }}>
            <strong>Musubi</strong> es una plataforma revolucionaria que resuelve el problema fundamental 
            del mundo laboral moderno: <strong>la falta de autenticidad en la validación de habilidades</strong>. 
            Mientras que las redes sociales profesionales se basan en "me gusta" y conexiones superficiales, 
            Musubi crea un sistema donde tu talento se valida por <strong>méritos reales y trabajo demostrable</strong>.
          </Typography>

          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
                <FactCheck sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="h6" gutterBottom>Validación Real</Typography>
                <Typography variant="body2">
                  Tus habilidades se validan por trabajo real, no por popularidad en redes sociales
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
                <Timeline sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                <Typography variant="h6" gutterBottom>Trazabilidad Total</Typography>
                <Typography variant="body2">
                  Cada hora trabajada y habilidad validada queda registrada de forma inmutable
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
                <Psychology sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                <Typography variant="h6" gutterBottom>Karma Dinámico</Typography>
                <Typography variant="body2">
                  Tu reputación se basa en honestidad y se actualiza constantemente
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="body2">
              <strong>💡 Concepto Clave:</strong> Musubi significa "conexión" en japonés. 
              Conectamos tu talento real con oportunidades auténticas, eliminando la superficialidad 
              de las métricas tradicionales de redes sociales.
            </Typography>
          </Alert>
        </Box>
      )
    },
    {
      label: 'El Problema de la Validación Superficial',
      icon: <BusinessCenter />,
      content: (
        <Box>
          <Typography variant="h5" gutterBottom sx={{ color: 'error.main', fontWeight: 'bold' }}>
            🚫 Más Allá de los "Me Gusta" y Conexiones
          </Typography>
          
          <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.7 }}>
            El mundo profesional actual está dominado por métricas superficiales que no reflejan 
            el verdadero talento. LinkedIn premia la cantidad de posts y conexiones, no la calidad 
            del trabajo. Los CVs pueden falsificarse y las referencias manipularse. 
            <strong>Musubi cambia esto fundamentalmente</strong>.
          </Typography>

          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12} md={6}>
              <Card sx={{ bgcolor: 'error.light', color: 'white', height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    ❌ Problemas del Sistema Actual
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary="Validación por popularidad"
                        secondary="Los 'me gusta' no demuestran competencia real"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="CVs inflados y referencias falsas"
                        secondary="Información manipulable sin verificación real"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Habilidades estáticas"
                        secondary="No se actualiza la competencia con el tiempo"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Falta de trazabilidad"
                        secondary="Imposible verificar el trabajo real realizado"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ bgcolor: 'success.light', color: 'white', height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    ✅ Solución Musubi: Méritos Reales
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary="Validación por trabajo demostrable"
                        secondary="Empresas y colegas validan tu trabajo real"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Registro inmutable de actividad"
                        secondary="Blockchain garantiza la veracidad de tu historial"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Karma que caduca"
                        secondary="Las habilidades se actualizan o pierden validez"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Trazabilidad completa"
                        secondary="Cada hora trabajada queda registrada y verificada"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Alert severity="warning" sx={{ mt: 3 }}>
            <Typography variant="body2">
              <strong>🎯 Nuestra Misión:</strong> Crear un mundo donde el talento se reconoce por 
              méritos reales, no por métricas superficiales de redes sociales.
            </Typography>
          </Alert>
        </Box>
      )
    },
    {
      label: 'El Sistema de Karma Dinámico',
      icon: <Psychology />,
      content: (
        <Box>
          <Typography variant="h5" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
            ⚡ Karma: La Reputación que Evoluciona
          </Typography>
          
          <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.7 }}>
            El <strong>Karma</strong> en Musubi no es solo una puntuación estática. Es un sistema dinámico 
            que refleja la <strong>honestidad, competencia actual y contribución real</strong> al ecosistema. 
            Se gana diciendo la verdad sobre tus habilidades y se mantiene demostrando competencia continua.
          </Typography>

          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%', border: '2px solid', borderColor: 'success.main' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                      <TrendingUp />
                    </Avatar>
                    <Typography variant="h6" color="success.main">
                      Cómo se Gana Karma
                    </Typography>
                  </Box>
                  <List dense>
                    <ListItem>
                      <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                      <ListItemText 
                        primary="Honestidad en declaraciones"
                        secondary="Declarar habilidades reales que luego se validan"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                      <ListItemText 
                        primary="Trabajo validado por empresas"
                        secondary="Registro de tiempo aprobado por empleadores"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                      <ListItemText 
                        primary="Servicios completados exitosamente"
                        secondary="Proyectos finalizados con satisfacción del cliente"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                      <ListItemText 
                        primary="Formación continua"
                        secondary="Actualización de habilidades con entidades formadoras"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%', border: '2px solid', borderColor: 'warning.main' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                      <Update />
                    </Avatar>
                    <Typography variant="h6" color="warning.main">
                      Karma que Caduca
                    </Typography>
                  </Box>
                  <List dense>
                    <ListItem>
                      <ListItemIcon><Update color="warning" /></ListItemIcon>
                      <ListItemText 
                        primary="Habilidades obsoletas"
                        secondary="Las competencias no actualizadas pierden validez"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><Update color="warning" /></ListItemIcon>
                      <ListItemText 
                        primary="Inactividad prolongada"
                        secondary="Falta de trabajo registrado reduce el karma"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><Update color="warning" /></ListItemIcon>
                      <ListItemText 
                        primary="Validaciones expiradas"
                        secondary="Las validaciones antiguas necesitan renovación"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><Update color="warning" /></ListItemIcon>
                      <ListItemText 
                        primary="Necesidad de re-validación"
                        secondary="Demostrar competencia continua en el tiempo"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Box sx={{ mt: 4, p: 3, bgcolor: 'info.light', borderRadius: 2, color: 'white' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <Badge sx={{ mr: 1 }} />
              Ejemplo: Ciclo de Vida del Karma
            </Typography>
            <Typography variant="body2" paragraph>
              <strong>Mes 1:</strong> Declaras habilidad en React.js → <strong>+10 Karma</strong>
            </Typography>
            <Typography variant="body2" paragraph>
              <strong>Mes 2:</strong> Empresa valida tu trabajo en React → <strong>+50 Karma</strong>
            </Typography>
            <Typography variant="body2" paragraph>
              <strong>Mes 6:</strong> Completas proyecto exitoso → <strong>+30 Karma</strong>
            </Typography>
            <Typography variant="body2" paragraph>
              <strong>Mes 12:</strong> Sin actividad en React → <strong>-20 Karma (caducidad)</strong>
            </Typography>
            <Typography variant="body2">
              <strong>Mes 13:</strong> Actualizas con nuevo curso → <strong>+25 Karma (renovación)</strong>
            </Typography>
          </Box>

          <Alert severity="success" sx={{ mt: 3 }}>
            <Typography variant="body2">
              <strong>🔄 Principio Clave:</strong> El karma refleja tu competencia ACTUAL, no pasada. 
              Esto garantiza que las habilidades validadas sean relevantes y actuales.
            </Typography>
          </Alert>
        </Box>
      )
    },
    {
      label: 'Trazabilidad y Relación Empresa-Empleado',
      icon: <Handshake />,
      content: (
        <Box>
          <Typography variant="h5" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
            🤝 Consolidando la Confianza Laboral
          </Typography>
          
          <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.7 }}>
            Musubi revoluciona la relación empresa-empleado mediante <strong>registro horario transparente</strong> 
            y <strong>validación mutua de competencias</strong>. Esto no solo beneficia a ambas partes, 
            sino que también facilita auditorías con la administración y crea un historial laboral 
            inmutable y verificable.
          </Typography>

          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      <AccessTime />
                    </Avatar>
                    <Typography variant="h6">Registro Horario Inteligente</Typography>
                  </Box>
                  <Typography variant="body2" paragraph>
                    Cada hora trabajada se registra con detalles específicos: proyecto, 
                    habilidades utilizadas, descripción de actividades y validación empresarial.
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon><CheckCircle color="primary" /></ListItemIcon>
                      <ListItemText primary="Registro detallado de actividades" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CheckCircle color="primary" /></ListItemIcon>
                      <ListItemText primary="Validación empresarial en tiempo real" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CheckCircle color="primary" /></ListItemIcon>
                      <ListItemText primary="Auditoría automática para administración" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CheckCircle color="primary" /></ListItemIcon>
                      <ListItemText primary="Historial inmutable y verificable" />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                      <Verified />
                    </Avatar>
                    <Typography variant="h6">Validación de Habilidades</Typography>
                  </Box>
                  <Typography variant="body2" paragraph>
                    Las empresas pueden validar las habilidades de sus empleados basándose 
                    en trabajo real, creando un sistema de reputación auténtico y confiable.
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                      <ListItemText primary="Validación basada en trabajo real" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                      <ListItemText primary="Feedback específico por proyecto" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                      <ListItemText primary="Construcción de reputación empresarial" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                      <ListItemText primary="Certificación de competencias" />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Box sx={{ mt: 4, p: 3, bgcolor: 'grey.100', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <Security sx={{ mr: 1, color: 'primary.main' }} />
              Beneficios para Empresas y Empleados
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom color="primary">
                  👔 Para Empresas
                </Typography>
                <Typography variant="body2" paragraph>
                  • Verificación real de competencias antes de contratar
                </Typography>
                <Typography variant="body2" paragraph>
                  • Registro automático de horas para auditorías
                </Typography>
                <Typography variant="body2" paragraph>
                  • Construcción de reputación como validador confiable
                </Typography>
                <Typography variant="body2">
                  • Reducción de riesgos en contratación
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom color="primary">
                  👨‍💼 Para Empleados
                </Typography>
                <Typography variant="body2" paragraph>
                  • Historial laboral inmutable y portable
                </Typography>
                <Typography variant="body2" paragraph>
                  • Validación oficial de habilidades por empleadores
                </Typography>
                <Typography variant="body2" paragraph>
                  • Transparencia total en registro de tiempo
                </Typography>
                <Typography variant="body2">
                  • Construcción de reputación verificable
                </Typography>
              </Grid>
            </Grid>
          </Box>

          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="body2">
              <strong>🏛️ Auditoría Administrativa:</strong> El sistema facilita auditorías 
              con la administración pública, proporcionando registros inmutables y verificables 
              de actividad laboral.
            </Typography>
          </Alert>
        </Box>
      )
    },
    {
      label: 'Tokenización del Conocimiento: KRM',
      icon: <MonetizationOn />,
      content: (
        <Box>
          <Typography variant="h5" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
            💎 KRM: El Valor del Conocimiento Auténtico
          </Typography>
          
          <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.7 }}>
            El token <strong>KRM (Knowledge Recognition Mechanism)</strong> no es solo una criptomoneda, 
            es la <strong>tokenización del conocimiento auténtico y verificado</strong>. Representa el valor 
            real de las habilidades validadas, el tiempo trabajado honestamente y la contribución 
            genuina al ecosistema profesional.
          </Typography>

          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
                <Avatar sx={{ width: 60, height: 60, mx: 'auto', mb: 2, bgcolor: 'primary.main' }}>
                  <FactCheck sx={{ fontSize: 30 }} />
                </Avatar>
                <Typography variant="h6" gutterBottom>
                  Valor por Autenticidad
                </Typography>
                <Typography variant="body2">
                  Los KRM se ganan demostrando habilidades reales, no por popularidad 
                  o conexiones superficiales.
                </Typography>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
                <Avatar sx={{ width: 60, height: 60, mx: 'auto', mb: 2, bgcolor: 'success.main' }}>
                  <Timeline sx={{ fontSize: 30 }} />
                </Avatar>
                <Typography variant="h6" gutterBottom>
                  Economía del Mérito
                </Typography>
                <Typography variant="body2">
                  El valor del token crece con la calidad y autenticidad 
                  del trabajo registrado en el ecosistema.
                </Typography>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
                <Avatar sx={{ width: 60, height: 60, mx: 'auto', mb: 2, bgcolor: 'warning.main' }}>
                  <School sx={{ fontSize: 30 }} />
                </Avatar>
                <Typography variant="h6" gutterBottom>
                  Entidades Formadoras
                </Typography>
                <Typography variant="body2">
                  Universidades e instituciones pueden emitir KRM 
                  por formación completada y certificada.
                </Typography>
              </Card>
            </Grid>
          </Grid>

          <Box sx={{ mt: 4, p: 3, bgcolor: 'primary.light', borderRadius: 2, color: 'white' }}>
            <Typography variant="h6" gutterBottom>
              🔄 Casos de Uso del Token KRM
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" paragraph>
                  <strong>💰 Pagos por Servicios:</strong> Recibe KRM por trabajo realizado 
                  y validado en el marketplace.
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>🎓 Certificación Educativa:</strong> Entidades formadoras emiten KRM 
                  por cursos y certificaciones completadas.
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>🏆 Recompensas por Validación:</strong> Gana KRM por validar 
                  honestamente las habilidades de otros profesionales.
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" paragraph>
                  <strong>🔒 Garantías de Calidad:</strong> Deposita KRM como garantía 
                  de la calidad de tu trabajo.
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>🗳️ Gobernanza del Ecosistema:</strong> Vota en decisiones 
                  importantes del protocolo con tus KRM.
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>💎 Staking por Reputación:</strong> Bloquea KRM para aumentar 
                  tu credibilidad como validador.
                </Typography>
              </Grid>
            </Grid>
          </Box>

          <Alert severity="success" sx={{ mt: 3 }}>
            <Typography variant="body2">
              <strong>🌟 Diferencia Clave:</strong> A diferencia de otras criptomonedas, 
              KRM está respaldado por conocimiento real y trabajo verificado, no por especulación.
            </Typography>
          </Alert>
        </Box>
      )
    },
    {
      label: 'Tu Viaje en el Ecosistema Musubi',
      icon: <Rocket />,
      content: (
        <Box>
          <Typography variant="h5" gutterBottom sx={{ color: 'success.main', fontWeight: 'bold' }}>
            🚀 Construye tu Reputación Auténtica
          </Typography>
          
          <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.7 }}>
            Tu viaje en Musubi es una evolución continua hacia la <strong>autenticidad profesional</strong>. 
            Cada acción que realizas construye tu reputación basada en méritos reales, 
            no en métricas superficiales de redes sociales.
          </Typography>

          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%', border: '2px solid', borderColor: 'primary.main' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    📋 Primeros Pasos (Primera semana)
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon><CheckCircle color="primary" /></ListItemIcon>
                      <ListItemText 
                        primary="1. Conecta tu Wallet"
                        secondary="MetaMask para interactuar con la blockchain"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CheckCircle color="primary" /></ListItemIcon>
                      <ListItemText 
                        primary="2. Declara Habilidades Reales"
                        secondary="Solo aquellas que realmente dominas"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CheckCircle color="primary" /></ListItemIcon>
                      <ListItemText 
                        primary="3. Registra tu Primer Trabajo"
                        secondary="Documenta tiempo y actividades realizadas"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CheckCircle color="primary" /></ListItemIcon>
                      <ListItemText 
                        primary="4. Busca Validación Empresarial"
                        secondary="Solicita a tu empleador que valide tu trabajo"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%', border: '2px solid', borderColor: 'success.main' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="success.main">
                    🎯 Crecimiento Sostenible (Largo plazo)
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                      <ListItemText 
                        primary="Valida habilidades de otros"
                        secondary="Construye reputación como validador honesto"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                      <ListItemText 
                        primary="Actualiza competencias regularmente"
                        secondary="Mantén tu karma activo con formación continua"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                      <ListItemText 
                        primary="Ofrece servicios en el marketplace"
                        secondary="Monetiza tus habilidades validadas"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                      <ListItemText 
                        primary="Colabora con entidades formadoras"
                        secondary="Obtén certificaciones que emitan KRM"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Box sx={{ mt: 4, p: 3, bgcolor: 'warning.light', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <EmojiObjects sx={{ mr: 1 }} />
              Principios para el Éxito en Musubi
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" paragraph>
                  <strong>🎯 Sé Honesto:</strong> Declara solo habilidades que realmente dominas. 
                  La honestidad se recompensa con karma duradero.
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>📈 Mantente Activo:</strong> El karma caduca, así que mantén 
                  tus habilidades actualizadas y relevantes.
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" paragraph>
                  <strong>🤝 Valida con Criterio:</strong> Cuando valides a otros, hazlo 
                  basándote en evidencia real, no en favores.
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>🔄 Piensa en Ecosistema:</strong> Tu éxito depende del éxito 
                  de toda la comunidad Musubi.
                </Typography>
              </Grid>
            </Grid>
          </Box>

          <Alert severity="success" sx={{ mt: 3 }}>
            <Typography variant="body2">
              <strong>🎉 Resultado Final:</strong> Un perfil profesional auténtico, verificable 
              y valioso que te diferencia en un mundo lleno de métricas superficiales.
            </Typography>
          </Alert>
        </Box>
      )
    }
  ];

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const progress = ((activeStep + 1) / steps.length) * 100;

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Avatar sx={{ width: 100, height: 100, mx: 'auto', mb: 3, bgcolor: 'primary.main' }}>
          <AutoAwesome sx={{ fontSize: 50 }} />
        </Avatar>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Descubre Musubi
        </Typography>
        <Typography variant="h6" color="textSecondary" paragraph>
          Donde el talento auténtico encuentra su verdadero valor
        </Typography>
        
        {/* Progress bar */}
        <Box sx={{ mt: 3, mb: 2 }}>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ height: 8, borderRadius: 4 }}
          />
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Progreso: {Math.round(progress)}% completado
          </Typography>
        </Box>
      </Box>

      {/* Stepper */}
      <Stepper activeStep={activeStep} orientation="vertical">
        {steps.map((step, index) => (
          <Step key={step.label}>
            <StepLabel>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ width: 40, height: 40, mr: 2, bgcolor: 'primary.main' }}>
                  {step.icon}
                </Avatar>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  {step.label}
                </Typography>
              </Box>
            </StepLabel>
            <StepContent>
              <Box sx={{ ml: 7 }}>
                {step.content}
                <Box sx={{ mb: 2, mt: 4 }}>
                  <Button
                    variant="contained"
                    onClick={index === steps.length - 1 ? onComplete : handleNext}
                    sx={{ mr: 1, px: 4, py: 1.5 }}
                    size="large"
                  >
                    {index === steps.length - 1 ? '🚀 ¡Comenzar mi Viaje Auténtico!' : 'Continuar →'}
                  </Button>
                  <Button
                    disabled={index === 0}
                    onClick={handleBack}
                    sx={{ mr: 1 }}
                    size="large"
                  >
                    ← Atrás
                  </Button>
                  <Button
                    onClick={onComplete}
                    color="inherit"
                    size="large"
                  >
                    Saltar Tutorial
                  </Button>
                </Box>
              </Box>
            </StepContent>
          </Step>
        ))}
      </Stepper>

      {/* Completion */}
      {activeStep === steps.length && (
        <Card sx={{ mt: 4, p: 4, textAlign: 'center', bgcolor: 'primary.main', color: 'white' }}>
          <Rocket sx={{ fontSize: 80, mb: 3 }} />
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
            ¡Bienvenido al Futuro del Trabajo Auténtico!
          </Typography>
          <Typography variant="h6" paragraph sx={{ mb: 4 }}>
            Ya entiendes la filosofía de Musubi. Es hora de conectar tu wallet y 
            comenzar a construir tu reputación basada en méritos reales.
          </Typography>
          
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <FactCheck sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="body1">Autenticidad Verificada</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Psychology sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="body1">Karma Dinámico</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <MonetizationOn sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="body1">Valor Real en KRM</Typography>
              </Box>
            </Grid>
          </Grid>
          
          <Button 
            variant="contained" 
            size="large" 
            onClick={onComplete}
            sx={{ 
              bgcolor: 'white', 
              color: 'primary.main', 
              px: 6, 
              py: 2,
              fontSize: '1.2rem',
              fontWeight: 'bold',
              '&:hover': { bgcolor: 'grey.100' } 
            }}
          >
            🎯 Conectar Wallet y Empezar
          </Button>
        </Card>
      )}
    </Box>
  );
};

export default MusubiIntroTutorial;

