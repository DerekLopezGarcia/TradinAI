#!/bin/bash

# Script de deployment a Railway
# Usa Railway CLI para hacer deploy automático
#
# Requisitos:
# - Railway CLI instalado: npm install -g @railway/cli
# - Estar logeado: railway login
# - Proyecto linkeado: railway link
#
# Uso:
# chmod +x scripts/deploy-railway.sh
# ./scripts/deploy-railway.sh

echo "🚀 Iniciando deployment a Railway..."
echo ""

# Verificar que Railway CLI está instalado
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI no está instalado"
    echo "Instala con: npm install -g @railway/cli"
    exit 1
fi

# Verificar que el proyecto está linkeado
if [ ! -f ".railway/config.json" ]; then
    echo "⚠️  Proyecto no linkeado a Railway"
    echo "Ejecuta: railway link"
    exit 1
fi

echo "📋 Build check..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo ""
echo "📤 Enviando a Railway..."
railway up --detach

echo ""
echo "✅ Deployment iniciado"
echo "Monitor en: railway status"
echo "Logs: railway logs"


