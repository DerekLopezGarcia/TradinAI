#!/usr/bin/env bash
# Archivo de CI/CD para validar que no haya datos simulados

echo "🔍 Validando que NO haya datos simulados..."
node scripts/validate-no-mocks.js

if [ $? -eq 0 ]; then
  echo "✅ Validación exitosa - Sin datos simulados"
  exit 0
else
  echo "❌ Validación fallida - Se encontraron datos simulados"
  exit 1
fi

