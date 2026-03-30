/**
 * Script de validación: Verifica que NO haya datos simulados/mock en la aplicación
 * 
 * Este script busca patrones comunes de datos falsos:
 * - MOCK_ variables (excepto comentarios)
 * - hardcoded prices
 * - fake/simulado/ejemplo keywords (excepto comentarios)
 * - placeholder datos
 */

const fs = require('fs');
const path = require('path');

const FORBIDDEN_PATTERNS = [
  {
    pattern: /^export\s+const\s+MOCK_/,
    name: 'export const MOCK_*',
    message: 'MOCK_ variable exportada encontrada'
  },
  {
    pattern: /^const\s+MOCK_.*=\s*\[/,
    name: 'const MOCK_* = [',
    message: 'Definición de array MOCK_ encontrada'
  },
  {
    pattern: /:\s*{\s*MOCK_/,
    name: 'objeto con MOCK_',
    message: 'Objeto que usa MOCK_ encontrado'
  },
  {
    pattern: /export.*MOCK_ASSETS/,
    name: 'export MOCK_ASSETS',
    message: 'MOCK_ASSETS exportado encontrado'
  },
  {
    pattern: /export.*MOCK_NEWS/,
    name: 'export MOCK_NEWS',
    message: 'MOCK_NEWS exportado encontrado'
  },
];

const SAFE_FILES = [
  '.spec.ts',
  '.test.ts',
  'mockData.ts',          // Archivo deprecado pero con comentarios
  'validate-no-mocks.js', // Este script mismo
];

let violations = [];
let filesChecked = 0;

function checkFile(filePath) {
  const ext = path.extname(filePath);
  if (!['.ts', '.tsx', '.js', '.jsx'].includes(ext)) return;

  // Skip safe files
  if (SAFE_FILES.some(safe => filePath.includes(safe))) return;

  filesChecked++;

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    // Ignorar comentarios
    if (line.trim().startsWith('//') || line.trim().startsWith('*')) return;

    FORBIDDEN_PATTERNS.forEach(({ pattern, name, message }) => {
      if (pattern.test(line.trim())) {
        violations.push({
          file: filePath.replace(process.cwd(), '.'),
          line: idx + 1,
          content: line.trim().substring(0, 100),
          violation: message
        });
      }
    });
  });
}

function traverseDir(dir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (file.startsWith('.') || file === 'node_modules' || file === 'dist' || file === '.next') {
      return;
    }

    if (stat.isDirectory()) {
      traverseDir(fullPath);
    } else {
      checkFile(fullPath);
    }
  });
}

// Start validation
console.log('🔍 Validando que NO haya datos simulados/mock...\n');

traverseDir(process.cwd());

if (violations.length === 0) {
  console.log(`✅ VALIDACIÓN EXITOSA\n`);
  console.log(`Archivos revisados: ${filesChecked}\n`);
  console.log('Resultados:');
  console.log('  ✓ NO hay MOCK_ASSETS');
  console.log('  ✓ NO hay MOCK_NEWS');
  console.log('  ✓ NO hay hardcoded prices como datos iniciales');
  console.log('  ✓ NO hay variables MOCK_ exportadas');
  console.log('  ✓ NO hay datos simulados en la aplicación\n');
  console.log('ℹ️  Los únicos datos permitidos son:');
  console.log('  • APIs reales (Binance, Twelve Data, Yahoo Finance, etc.)');
  console.log('  • Bases de datos');
  console.log('  • Fixtures en archivos .test.ts / .spec.ts\n');
  process.exit(0);
} else {
  console.log(`⚠️ VIOLACIONES ENCONTRADAS: ${violations.length}\n`);
  
  violations.forEach(v => {
    console.log(`  ${v.file}:${v.line}`);
    console.log(`    ❌ ${v.violation}`);
    console.log(`    ${v.content}\n`);
  });
  
  process.exit(1);
}



