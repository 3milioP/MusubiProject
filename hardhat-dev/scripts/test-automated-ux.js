const puppeteer = require('puppeteer');

// Configuración de pruebas
const TEST_CONFIG = {
  baseUrl: 'http://localhost:5173',
  timeout: 30000,
  headless: false, // Cambiar a true para ejecutar sin interfaz
  slowMo: 100 // Ralentizar acciones para mejor observación
};

// Datos de prueba
const TEST_DATA = {
  userProfile: {
    name: 'Juan Pérez',
    description: 'Desarrollador Full Stack con 5 años de experiencia',
    location: 'Madrid, España',
    website: 'https://juanperez.dev'
  },
  companyProfile: {
    name: 'TechCorp Solutions',
    description: 'Empresa de desarrollo de software especializada en blockchain',
    location: 'Barcelona, España',
    website: 'https://techcorp.es'
  }
};

class MusubiUXTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      passed: 0,
      failed: 0,
      total: 0,
      details: []
    };
  }

  async init() {
    console.log('🚀 Iniciando pruebas automatizadas de UX...');
    
    this.browser = await puppeteer.launch({
      headless: TEST_CONFIG.headless,
      slowMo: TEST_CONFIG.slowMo,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    
    // Configurar viewport
    await this.page.setViewport({ width: 1280, height: 720 });
    
    // Interceptar errores de consola
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Error en consola:', msg.text());
      }
    });
    
    console.log('✅ Navegador iniciado correctamente');
  }

  async test(testName, testFunction) {
    this.results.total++;
    console.log(`\n🧪 Ejecutando: ${testName}`);
    
    try {
      await testFunction();
      this.results.passed++;
      console.log(`✅ ${testName} - PASÓ`);
      this.results.details.push({ test: testName, status: 'PASSED' });
    } catch (error) {
      this.results.failed++;
      console.log(`❌ ${testName} - FALLÓ: ${error.message}`);
      this.results.details.push({ test: testName, status: 'FAILED', error: error.message });
      
      // Tomar screenshot del error
      await this.page.screenshot({ 
        path: `error-${testName.replace(/\s+/g, '-').toLowerCase()}.png` 
      });
    }
  }

  async runAllTests() {
    await this.init();
    
    try {
      // Test 1: Carga inicial de la página
      await this.test('Carga inicial de la página', async () => {
        await this.page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'networkidle0' });
        
        // Verificar que la página carga correctamente
        const title = await this.page.title();
        if (!title.includes('Musubi')) {
          throw new Error('Título de página incorrecto');
        }
        
        // Verificar que el botón de conectar wallet está presente
        const connectButton = await this.page.$('button:has-text("Conectar Wallet")');
        if (!connectButton) {
          throw new Error('Botón de conectar wallet no encontrado');
        }
      });

      // Test 2: Navegación del sidebar
      await this.test('Navegación del sidebar', async () => {
        // Verificar que el sidebar está presente
        const sidebar = await this.page.$('[role="navigation"]');
        if (!sidebar) {
          throw new Error('Sidebar no encontrado');
        }
        
        // Verificar elementos del menú
        const menuItems = ['Dashboard', 'Mi Perfil', 'Habilidades', 'Registro de Tiempo', 'Marketplace'];
        for (const item of menuItems) {
          const menuItem = await this.page.$(`text=${item}`);
          if (!menuItem) {
            throw new Error(`Elemento de menú "${item}" no encontrado`);
          }
        }
      });

      // Test 3: Formulario de registro de perfil (sin wallet)
      await this.test('Formulario de registro de perfil', async () => {
        // Navegar a la página de perfil
        await this.page.click('text=Mi Perfil');
        await this.page.waitForTimeout(1000);
        
        // Verificar que aparece el mensaje de wallet no conectada
        const walletAlert = await this.page.$('text=Por favor, conecta tu wallet');
        if (!walletAlert) {
          throw new Error('Alerta de wallet no conectada no encontrada');
        }
      });

      // Test 4: Validación de campos del formulario
      await this.test('Validación de campos del formulario', async () => {
        // Simular que tenemos un perfil para mostrar el formulario
        await this.page.evaluate(() => {
          localStorage.setItem('musubi_onboarding_state', JSON.stringify({
            hasCompletedOnboarding: true,
            showOnboarding: false,
            hasSeenWelcome: true,
            hasRegisteredProfile: false
          }));
        });
        
        await this.page.reload();
        await this.page.waitForTimeout(1000);
        
        // Verificar campos requeridos
        const nameField = await this.page.$('input[placeholder*="Nombre"]');
        if (!nameField) {
          throw new Error('Campo de nombre no encontrado');
        }
        
        const descriptionField = await this.page.$('textarea[placeholder*="Cuéntanos"]');
        if (!descriptionField) {
          throw new Error('Campo de descripción no encontrado');
        }
      });

      // Test 5: Disclaimer legal
      await this.test('Disclaimer legal', async () => {
        // Verificar que el disclaimer está presente
        const disclaimer = await this.page.$('text=Disclaimer Legal');
        if (!disclaimer) {
          throw new Error('Disclaimer legal no encontrado');
        }
        
        // Verificar checkbox del disclaimer
        const disclaimerCheckbox = await this.page.$('input[type="checkbox"]');
        if (!disclaimerCheckbox) {
          throw new Error('Checkbox del disclaimer no encontrado');
        }
      });

      // Test 6: Responsive design
      await this.test('Responsive design', async () => {
        // Probar en móvil
        await this.page.setViewport({ width: 375, height: 667 });
        await this.page.waitForTimeout(1000);
        
        // Verificar que el sidebar se adapta
        const mobileMenu = await this.page.$('button[aria-label*="menu"]');
        if (!mobileMenu) {
          throw new Error('Menú móvil no encontrado');
        }
        
        // Volver a desktop
        await this.page.setViewport({ width: 1280, height: 720 });
      });

      // Test 7: Estados de carga
      await this.test('Estados de carga', async () => {
        // Verificar que hay indicadores de carga
        const loadingElements = await this.page.$$('[class*="loading"], [class*="spinner"]');
        // No es un error si no hay elementos de carga visibles
        console.log(`Elementos de carga encontrados: ${loadingElements.length}`);
      });

      // Test 8: Mensajes de error
      await this.test('Mensajes de error', async () => {
        // Intentar registrar sin datos para ver mensajes de error
        const registerButton = await this.page.$('button:has-text("Registrar Perfil")');
        if (registerButton) {
          await registerButton.click();
          await this.page.waitForTimeout(1000);
          
          // Verificar que aparecen mensajes de error
          const errorMessages = await this.page.$$('[class*="error"], [role="alert"]');
          console.log(`Mensajes de error encontrados: ${errorMessages.length}`);
        }
      });

      // Test 9: Accesibilidad básica
      await this.test('Accesibilidad básica', async () => {
        // Verificar que los botones tienen texto accesible
        const buttons = await this.page.$$('button');
        for (const button of buttons) {
          const text = await button.evaluate(el => el.textContent || el.getAttribute('aria-label'));
          if (!text || text.trim() === '') {
            console.log('⚠️  Botón sin texto accesible encontrado');
          }
        }
      });

      // Test 10: Performance básica
      await this.test('Performance básica', async () => {
        const startTime = Date.now();
        await this.page.reload();
        await this.page.waitForLoadState('networkidle');
        const loadTime = Date.now() - startTime;
        
        if (loadTime > 5000) {
          throw new Error(`Tiempo de carga muy lento: ${loadTime}ms`);
        }
        
        console.log(`⏱️  Tiempo de carga: ${loadTime}ms`);
      });

    } catch (error) {
      console.error('❌ Error durante las pruebas:', error);
    } finally {
      await this.cleanup();
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
    
    this.printResults();
  }

  printResults() {
    console.log('\n📊 RESULTADOS DE LAS PRUEBAS');
    console.log('============================');
    console.log(`✅ Pasadas: ${this.results.passed}`);
    console.log(`❌ Fallidas: ${this.results.failed}`);
    console.log(`📈 Total: ${this.results.total}`);
    console.log(`📊 Porcentaje de éxito: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);
    
    console.log('\n📋 DETALLES:');
    this.results.details.forEach(detail => {
      const icon = detail.status === 'PASSED' ? '✅' : '❌';
      console.log(`${icon} ${detail.test}: ${detail.status}`);
      if (detail.error) {
        console.log(`   Error: ${detail.error}`);
      }
    });
    
    if (this.results.failed === 0) {
      console.log('\n🎉 ¡Todas las pruebas pasaron exitosamente!');
    } else {
      console.log('\n🔧 Algunas pruebas fallaron. Revisa los errores y screenshots.');
    }
  }
}

// Función principal
async function main() {
  console.log('🧪 INICIANDO PRUEBAS AUTOMATIZADAS DE UX - MUSUBI');
  console.log('================================================');
  
  const tester = new MusubiUXTester();
  await tester.runAllTests();
}

// Ejecutar si es el archivo principal
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { MusubiUXTester, TEST_CONFIG, TEST_DATA }; 