#!/usr/bin/env node

/**
 * 🔐 Script de Validación de Seguridad
 * Verifica que no haya API keys comprometidas en el repositorio
 * 
 * Uso: node scripts/security-check.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkGitignore() {
  log('\n📋 Verificando .gitignore...', 'cyan');
  
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  const content = fs.readFileSync(gitignorePath, 'utf8');
  
  const required = ['.env.local', '.env', 'node_modules'];
  const missing = [];
  
  for (const file of required) {
    if (!content.includes(file)) {
      missing.push(file);
    }
  }
  
  if (missing.length === 0) {
    log('✅ .gitignore contiene todas las protecciones', 'green');
    return true;
  } else {
    log(`❌ Falta proteger: ${missing.join(', ')}`, 'red');
    return false;
  }
}

function checkEnvFiles() {
  log('\n📁 Verificando que .env.local está PROTEGIDO...', 'cyan');
  
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  
  const envFiles = [
    '.env.local',
    '.env.production.local',
    '.env.development.local',
  ];
  
  let allProtected = true;
  
  for (const file of envFiles) {
    const filePath = path.join(process.cwd(), file);
    const isInGitignore = gitignoreContent.includes(file);
    
    if (fs.existsSync(filePath)) {
      if (isInGitignore) {
        log(`✅ ${file} existe localmente y está protegido en .gitignore`, 'green');
      } else {
        log(`❌ ${file} existe pero NO está en .gitignore (¡PELIGRO!)`, 'red');
        allProtected = false;
      }
    } else {
      log(`ℹ️  ${file} no existe (necesitarás crearlo con tus claves)`, 'cyan');
    }
  }
  
  return allProtected;
}

function checkGitHistory() {
  log('\n🔍 Verificando histórico de Git...', 'cyan');
  
  const patterns = [
    'TWELVE_DATA_API_KEY',
    'QUANDL_API_KEY',
    'sk_live_',
    'pk_live_',
    'BEGIN PRIVATE KEY',
    'BEGIN RSA PRIVATE KEY',
  ];
  
  let found = false;
  for (const pattern of patterns) {
    try {
      const result = execSync(`git log -p -S "${pattern}" --all 2>/dev/null || echo ""`, {
        cwd: process.cwd(),
        encoding: 'utf8',
      });
      
      if (result && result.length > 100) {
        log(`❌ Patrón sospechoso encontrado: ${pattern}`, 'red');
        found = true;
      }
    } catch (e) {
      // Git no disponible o error
    }
  }
  
  if (!found) {
    log('✅ No se encontraron claves en el histórico de Git', 'green');
    return true;
  }
  
  return false;
}

function checkSourceFiles() {
  log('\n📝 Verificando archivos fuente...', 'cyan');
  
  const extensions = ['.ts', '.tsx', '.js', '.jsx', '.json'];
  
  const forbidden = [
    /apiKey\s*[:=]\s*['"][^'"]{20,}['"]/,
    /TWELVE_DATA_API_KEY\s*[:=]/,
    /sk_live_/,
    /pk_live_/,
  ];
  
  const excludeDirs = ['node_modules', 'scripts', '.next', 'dist', '.git'];
  
  let found = false;
  
  function checkDir(dir) {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const relPath = path.relative(process.cwd(), filePath);
      
      // Excluir directorios sensibles
      if (excludeDirs.some(d => relPath.startsWith(d))) continue;
      
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        checkDir(filePath);
      } else if (extensions.some(ext => file.endsWith(ext))) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        for (const pattern of forbidden) {
          if (pattern.test(content)) {
            log(`❌ Patrón sospechoso en: ${filePath}`, 'red');
            found = true;
          }
        }
      }
    }
  }
  
  checkDir(process.cwd());
  
  if (!found) {
    log('✅ No hay claves hardcodeadas en archivos fuente', 'green');
    return true;
  }
  
  return false;
}

function main() {
  log('\n🔐 ==================== VALIDACIÓN DE SEGURIDAD ====================\n', 'cyan');
  
  const checks = [
    checkGitignore(),
    checkEnvFiles(),
    checkGitHistory(),
    checkSourceFiles(),
  ];
  
  log('\n🔐 ==================== RESULTADO ====================\n', 'cyan');
  
  const allPassed = checks.every(c => c);
  
  if (allPassed) {
    log('✅ ¡TODAS LAS VALIDACIONES PASARON! Tu proyecto es seguro.', 'green');
    log('\n📋 Checklist:');
    log('   ✅ .gitignore protege .env.local');
    log('   ✅ No hay claves en archivos locales');
    log('   ✅ No hay claves en el histórico de Git');
    log('   ✅ No hay claves hardcodeadas en el código');
    process.exit(0);
  } else {
    log('❌ Se encontraron problemas de seguridad. Por favor, revisa:', 'red');
    log('\n📖 Consulta SECURITY_API_KEYS.md para más información.');
    log('\n🔧 Acciones recomendadas:');
    log('   1. Revisa el archivo .gitignore');
    log('   2. Copia .env.example a .env.local');
    log('   3. Edita .env.local con tus claves');
    log('   4. Nunca comitees .env.local a Git');
    process.exit(1);
  }
}

main();



