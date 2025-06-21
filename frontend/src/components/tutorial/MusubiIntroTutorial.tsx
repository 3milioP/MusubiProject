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
  AutoAwesome
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
            🌟 Bienvenido al Futuro del Trabajo
          </Typography>
          
          <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.7 }}>
            <strong>Musubi</strong> es una plataforma revolucionaria que conecta el mundo del trabajo tradicional 
            con la tecnología blockchain. Imagina un lugar donde tu experiencia, habilidades y tiempo trabajado 
            quedan registrados de forma permanente e inmutable, donde puedes demostrar tu valor profesional 
            sin intermediarios y donde cada hora trabajada se convierte en valor real.
          </Typography>

          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
                <Security sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="h6" gutterBottom>Transparencia Total</Typography>
                <Typography variant="body2">
                  Todos los registros quedan en la blockchain, imposibles de falsificar o manipular
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
                <Public sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                <Typography variant="h6" gutterBottom>Sin Intermediarios</Typography>
                <Typography variant="body2">
                  Conecta directamente con clientes y empleadores sin comisiones de terceros
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
                <Speed sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                <Typography variant="h6" gutterBottom>Pagos Instantáneos</Typography>
                <Typography variant="body2">
                  Recibe pagos inmediatos en tokens KRM sin esperar procesos bancarios
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="body2">
              <strong>💡 Concepto Clave:</strong> Musubi significa "conexión" en japonés. 
              Conectamos tu talento con oportunidades reales usando la tecnología más avanzada.
            </Typography>
          </Alert>
        </Box>
      )
    },
    {
      label: 'El Problema que Resolvemos',
      icon: <BusinessCenter />,
      content: (
        <Box>
          <Typography variant="h5" gutterBottom sx={{ color: 'error.main', fontWeight: 'bold' }}>
            🚫 Los Problemas del Trabajo Tradicional
          </Typography>
          
          <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.7 }}>
            El mundo laboral actual está lleno de fricciones que limitan tanto a trabajadores como a empleadores. 
            Musubi elimina estas barreras usando tecnología blockchain para crear un ecosistema más justo y eficiente.
          </Typography>

          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12} md={6}>
              <Card sx={{ bgcolor: 'error.light', color: 'white', height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    ❌ Problemas Actuales
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary="Falta de transparencia en pagos"
                        secondary="Los trabajadores no saben cuándo ni cuánto van a cobrar"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Dificultad para validar experiencia"
                        secondary="Es difícil demostrar habilidades y experiencia real"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Intermediarios costosos"
                        secondary="Plataformas que cobran comisiones del 10-30%"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Registros manipulables"
                        secondary="CVs y referencias pueden ser falsificados"
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
                    ✅ Soluciones de Musubi
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary="Pagos automáticos y transparentes"
                        secondary="Smart contracts garantizan pagos justos y puntuales"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Validación blockchain de habilidades"
                        secondary="Sistema de validación peer-to-peer inmutable"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="0% comisiones"
                        secondary="Trabajas directamente con clientes, sin intermediarios"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Historial laboral inmutable"
                        secondary="Tu experiencia queda registrada permanentemente"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Alert severity="warning" sx={{ mt: 3 }}>
            <Typography variant="body2">
              <strong>🎯 Nuestra Misión:</strong> Crear un mundo donde el talento sea reconocido, 
              recompensado y verificado de forma justa y transparente.
            </Typography>
          </Alert>
        </Box>
      )
    },
    {
      label: 'Ecosistema Musubi: Cómo Funciona',
      icon: <Groups />,
      content: (
        <Box>
          <Typography variant="h5" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
            🔄 El Ecosistema Completo
          </Typography>
          
          <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.7 }}>
            Musubi no es solo una plataforma, es un ecosistema completo donde diferentes actores 
            interactúan para crear valor mutuo. Cada participante tiene un rol específico y 
            todos se benefician del crecimiento del ecosistema.
          </Typography>

          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', border: '2px solid', borderColor: 'primary.main' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Avatar sx={{ width: 60, height: 60, mx: 'auto', mb: 2, bgcolor: 'primary.main' }}>
                    <Work sx={{ fontSize: 30 }} />
                  </Avatar>
                  <Typography variant="h6" gutterBottom color="primary">
                    Trabajadores/Freelancers
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Profesionales que ofrecen sus habilidades y tiempo
                  </Typography>
                  <Chip label="Declaran habilidades" size="small" sx={{ mb: 1, display: 'block' }} />
                  <Chip label="Registran tiempo" size="small" sx={{ mb: 1, display: 'block' }} />
                  <Chip label="Ofrecen servicios" size="small" sx={{ mb: 1, display: 'block' }} />
                  <Chip label="Reciben KRM" size="small" sx={{ display: 'block' }} />
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', border: '2px solid', borderColor: 'success.main' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Avatar sx={{ width: 60, height: 60, mx: 'auto', mb: 2, bgcolor: 'success.main' }}>
                    <BusinessCenter sx={{ fontSize: 30 }} />
                  </Avatar>
                  <Typography variant="h6" gutterBottom color="success.main">
                    Empresas/Clientes
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Organizaciones que necesitan talento y servicios
                  </Typography>
                  <Chip label="Validan habilidades" size="small" sx={{ mb: 1, display: 'block' }} />
                  <Chip label="Aprueban tiempo" size="small" sx={{ mb: 1, display: 'block' }} />
                  <Chip label="Contratan servicios" size="small" sx={{ mb: 1, display: 'block' }} />
                  <Chip label="Pagan con KRM" size="small" sx={{ display: 'block' }} />
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', border: '2px solid', borderColor: 'warning.main' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Avatar sx={{ width: 60, height: 60, mx: 'auto', mb: 2, bgcolor: 'warning.main' }}>
                    <Verified sx={{ fontSize: 30 }} />
                  </Avatar>
                  <Typography variant="h6" gutterBottom color="warning.main">
                    Validadores
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Expertos que verifican habilidades y calidad
                  </Typography>
                  <Chip label="Evalúan habilidades" size="small" sx={{ mb: 1, display: 'block' }} />
                  <Chip label="Verifican calidad" size="small" sx={{ mb: 1, display: 'block' }} />
                  <Chip label="Construyen reputación" size="small" sx={{ mb: 1, display: 'block' }} />
                  <Chip label="Ganan recompensas" size="small" sx={{ display: 'block' }} />
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Box sx={{ mt: 4, p: 3, bgcolor: 'grey.100', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <MonetizationOn sx={{ mr: 1, color: 'primary.main' }} />
              Token KRM: El Corazón del Ecosistema
            </Typography>
            <Typography variant="body2" paragraph>
              El token KRM (Knowledge Recognition Mechanism) es la moneda nativa que permite 
              todas las transacciones en Musubi. No es solo dinero digital, es una representación 
              del valor del conocimiento y el tiempo en el ecosistema.
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>💰 Pagos</Typography>
                <Typography variant="caption">Por servicios prestados</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>🎁 Recompensas</Typography>
                <Typography variant="caption">Por validar habilidades</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>🔒 Garantías</Typography>
                <Typography variant="caption">Para asegurar calidad</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>🗳️ Gobernanza</Typography>
                <Typography variant="caption">Para votar mejoras</Typography>
              </Grid>
            </Grid>
          </Box>
        </Box>
      )
    },
    {
      label: 'Funcionalidades Principales',
      icon: <AutoAwesome />,
      content: (
        <Box>
          <Typography variant="h5" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
            🛠️ Herramientas Poderosas para Profesionales
          </Typography>
          
          <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.7 }}>
            Musubi te proporciona un conjunto completo de herramientas diseñadas para maximizar 
            tu potencial profesional y crear nuevas oportunidades de ingresos.
          </Typography>

          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      <AccountBalanceWallet />
                    </Avatar>
                    <Typography variant="h6">Perfil Blockchain</Typography>
                  </Box>
                  <Typography variant="body2" paragraph>
                    Tu identidad profesional verificada en la blockchain. Incluye información 
                    personal, profesional y un historial inmutable de tu experiencia.
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon><CheckCircle color="primary" /></ListItemIcon>
                      <ListItemText primary="Registro permanente e inmutable" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CheckCircle color="primary" /></ListItemIcon>
                      <ListItemText primary="Verificación de identidad opcional" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CheckCircle color="primary" /></ListItemIcon>
                      <ListItemText primary="Portabilidad total entre plataformas" />
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
                      <Work />
                    </Avatar>
                    <Typography variant="h6">Sistema de Habilidades</Typography>
                  </Box>
                  <Typography variant="body2" paragraph>
                    Declara, valida y monetiza tus habilidades. Cada habilidad validada 
                    aumenta tu credibilidad y oportunidades de trabajo.
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                      <ListItemText primary="Declaración de habilidades con niveles" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                      <ListItemText primary="Validación peer-to-peer" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                      <ListItemText primary="Creación de nuevas habilidades" />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                      <AccessTime />
                    </Avatar>
                    <Typography variant="h6">Registro de Tiempo</Typography>
                  </Box>
                  <Typography variant="body2" paragraph>
                    Registra cada hora trabajada con transparencia total. Las empresas 
                    pueden validar tu tiempo, creando un historial laboral verificable.
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon><CheckCircle color="warning" /></ListItemIcon>
                      <ListItemText primary="Registro detallado de actividades" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CheckCircle color="warning" /></ListItemIcon>
                      <ListItemText primary="Validación empresarial" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CheckCircle color="warning" /></ListItemIcon>
                      <ListItemText primary="Estadísticas automáticas" />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                      <Store />
                    </Avatar>
                    <Typography variant="h6">Marketplace P2P</Typography>
                  </Box>
                  <Typography variant="body2" paragraph>
                    Conecta directamente con clientes sin intermediarios. Publica servicios, 
                    recibe órdenes y gestiona proyectos de forma descentralizada.
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon><CheckCircle color="info" /></ListItemIcon>
                      <ListItemText primary="Publicación de servicios personalizados" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CheckCircle color="info" /></ListItemIcon>
                      <ListItemText primary="Sistema de órdenes automatizado" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CheckCircle color="info" /></ListItemIcon>
                      <ListItemText primary="Pagos seguros con smart contracts" />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Alert severity="success" sx={{ mt: 3 }}>
            <Typography variant="body2">
              <strong>🚀 Ventaja Competitiva:</strong> Todas estas funcionalidades trabajan juntas 
              para crear un perfil profesional completo y verificable que te diferencia en el mercado.
            </Typography>
          </Alert>
        </Box>
      )
    },
    {
      label: 'Beneficios y Oportunidades',
      icon: <TrendingUp />,
      content: (
        <Box>
          <Typography variant="h5" gutterBottom sx={{ color: 'success.main', fontWeight: 'bold' }}>
            📈 Transforma tu Carrera Profesional
          </Typography>
          
          <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.7 }}>
            Musubi no es solo una herramienta, es una oportunidad de transformar completamente 
            tu carrera profesional y crear nuevas fuentes de ingresos que antes no existían.
          </Typography>

          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%', bgcolor: 'success.light', color: 'white' }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <MonetizationOn sx={{ mr: 1 }} />
                  Beneficios Económicos
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon><Star sx={{ color: 'white' }} /></ListItemIcon>
                    <ListItemText 
                      primary="Ingresos Pasivos"
                      secondary="Gana KRM por validar habilidades de otros profesionales"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Star sx={{ color: 'white' }} /></ListItemIcon>
                    <ListItemText 
                      primary="Pagos Instantáneos"
                      secondary="Recibe pagos inmediatos sin esperar procesos bancarios"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Star sx={{ color: 'white' }} /></ListItemIcon>
                    <ListItemText 
                      primary="Sin Comisiones"
                      secondary="Mantén el 100% de tus ganancias, sin intermediarios"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Star sx={{ color: 'white' }} /></ListItemIcon>
                    <ListItemText 
                      primary="Valorización del Token"
                      secondary="Benefíciate del crecimiento del ecosistema Musubi"
                    />
                  </ListItem>
                </List>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%', bgcolor: 'primary.light', color: 'white' }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <Rocket sx={{ mr: 1 }} />
                  Beneficios Profesionales
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon><Star sx={{ color: 'white' }} /></ListItemIcon>
                    <ListItemText 
                      primary="Credibilidad Verificable"
                      secondary="Tu experiencia queda registrada de forma inmutable"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Star sx={{ color: 'white' }} /></ListItemIcon>
                    <ListItemText 
                      primary="Red Global"
                      secondary="Accede a oportunidades en todo el mundo"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Star sx={{ color: 'white' }} /></ListItemIcon>
                    <ListItemText 
                      primary="Autonomía Total"
                      secondary="Controla completamente tu carrera y tarifas"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Star sx={{ color: 'white' }} /></ListItemIcon>
                    <ListItemText 
                      primary="Crecimiento Continuo"
                      secondary="Sistema de reputación que mejora con el tiempo"
                    />
                  </ListItem>
                </List>
              </Paper>
            </Grid>
          </Grid>

          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ textAlign: 'center' }}>
              🎯 Casos de Uso Reales
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={4}>
                <Card sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom color="primary">
                    Desarrollador Freelance
                  </Typography>
                  <Typography variant="body2">
                    "Registro mis horas de desarrollo, las empresas validan mi trabajo, 
                    y construyo un historial verificable que me permite cobrar más."
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom color="primary">
                    Consultora de Marketing
                  </Typography>
                  <Typography variant="body2">
                    "Valido las habilidades de otros marketers y gano tokens KRM. 
                    Mis propias habilidades validadas me traen más clientes."
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom color="primary">
                    Startup Tecnológica
                  </Typography>
                  <Typography variant="body2">
                    "Encontramos talento verificado rápidamente y pagamos solo 
                    por trabajo validado, reduciendo riesgos de contratación."
                  </Typography>
                </Card>
              </Grid>
            </Grid>
          </Box>

          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="body2">
              <strong>💎 Valor Único:</strong> Musubi es la primera plataforma que combina 
              validación de habilidades, registro de tiempo y marketplace en un solo ecosistema blockchain.
            </Typography>
          </Alert>
        </Box>
      )
    },
    {
      label: 'Primeros Pasos',
      icon: <School />,
      content: (
        <Box>
          <Typography variant="h5" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
            🚀 Tu Viaje en Musubi Comienza Aquí
          </Typography>
          
          <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.7 }}>
            Empezar en Musubi es fácil y te guiaremos paso a paso. En pocos minutos 
            tendrás tu perfil configurado y estarás listo para comenzar a generar valor.
          </Typography>

          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%', border: '2px solid', borderColor: 'primary.main' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    📋 Configuración Inicial (5 minutos)
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon><CheckCircle color="primary" /></ListItemIcon>
                      <ListItemText 
                        primary="1. Conecta tu Wallet"
                        secondary="MetaMask o cualquier wallet compatible con Ethereum"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CheckCircle color="primary" /></ListItemIcon>
                      <ListItemText 
                        primary="2. Crea tu Perfil"
                        secondary="Información básica y profesional"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CheckCircle color="primary" /></ListItemIcon>
                      <ListItemText 
                        primary="3. Declara tus Habilidades"
                        secondary="Añade las habilidades que dominas"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CheckCircle color="primary" /></ListItemIcon>
                      <ListItemText 
                        primary="4. Explora el Marketplace"
                        secondary="Ve qué servicios se ofrecen y demandan"
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
                    🎯 Primeras Acciones (Primera semana)
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                      <ListItemText 
                        primary="Valida habilidades de otros"
                        secondary="Gana tus primeros tokens KRM"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                      <ListItemText 
                        primary="Registra tu primer trabajo"
                        secondary="Documenta tu tiempo y actividades"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                      <ListItemText 
                        primary="Publica tu primer servicio"
                        secondary="Ofrece algo que sabes hacer bien"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                      <ListItemText 
                        primary="Conecta con la comunidad"
                        secondary="Únete a nuestros canales de Discord/Telegram"
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
              Consejos para el Éxito
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" paragraph>
                  <strong>🎨 Sé Específico:</strong> Declara habilidades específicas en lugar de generales. 
                  "React.js" es mejor que "Programación".
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>📝 Documenta Todo:</strong> Registra incluso trabajos pequeños. 
                  La consistencia construye credibilidad.
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" paragraph>
                  <strong>🤝 Valida Activamente:</strong> Valida habilidades de otros para ganar tokens 
                  y construir tu propia reputación como validador.
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>💎 Piensa a Largo Plazo:</strong> Tu perfil Musubi es una inversión 
                  que crece en valor con el tiempo.
                </Typography>
              </Grid>
            </Grid>
          </Box>

          <Alert severity="success" sx={{ mt: 3 }}>
            <Typography variant="body2">
              <strong>🎉 ¡Estás Listo!</strong> Con estos conocimientos, estás preparado para 
              aprovechar al máximo todo lo que Musubi tiene para ofrecer.
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
          La plataforma que revoluciona el mundo del trabajo con blockchain
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
                    {index === steps.length - 1 ? '🚀 ¡Empezar mi Viaje en Musubi!' : 'Continuar →'}
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
            ¡Bienvenido al Futuro del Trabajo!
          </Typography>
          <Typography variant="h6" paragraph sx={{ mb: 4 }}>
            Ya conoces todo sobre Musubi. Es hora de conectar tu wallet y 
            comenzar a construir tu futuro profesional en blockchain.
          </Typography>
          
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <CheckCircle sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="body1">Perfil Verificado</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <MonetizationOn sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="body1">Ingresos en KRM</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Groups sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="body1">Red Global</Typography>
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

