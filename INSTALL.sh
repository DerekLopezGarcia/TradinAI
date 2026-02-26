#!/bin/bash
# Script de instalación y configuración rápida para TradingIA

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     TradingIA - Instalación Rápida                          ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Verificar que Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor, instálalo desde https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v)
NPM_VERSION=$(npm -v)

echo "✅ Node.js $NODE_VERSION detectado"
echo "✅ npm $NPM_VERSION detectado"
echo ""

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install --legacy-peer-deps

if [ $? -ne 0 ]; then
    echo "❌ Error instalando dependencias"
    exit 1
fi

echo "✅ Dependencias instaladas exitosamente"
echo ""

# Compilar proyecto
echo "🔨 Compilando proyecto..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Error compilando el proyecto"
    exit 1
fi

echo "✅ Proyecto compilado exitosamente"
echo ""

# Mostrar instrucciones finales
echo "╔════════════════════════════════════════════════════════════╗"
echo "║          ¡Instalación completada! 🎉                        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Para iniciar el servidor de desarrollo, ejecuta:"
echo "  npm run dev"
echo ""
echo "Luego abre tu navegador en:"
echo "  http://localhost:3000"
echo ""
echo "Para más información, consulta:"
echo "  - README.md: Documentación completa"
echo "  - FEATURES.md: Lista de características"
echo ""

