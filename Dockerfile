# Dockerfile para TradingIA con Railway PostgreSQL
#
# Uso:
# docker build -t tradingIA .
# docker run -p 3000:3000 --env-file .env.local tradingIA
#

FROM node:20-alpine

WORKDIR /app

# Metadata
LABEL maintainer="Derek López"
LABEL description="TradingIA - IA-powered financial market analysis platform"

# Copiar package files
COPY package.json package-lock.json ./

# Instalar dependencias
RUN npm install --legacy-peer-deps

# Copiar código fuente
COPY . .

# Build NextJS
RUN npm run build

# Exponer puerto
EXPOSE 3000

# Environment variables por defecto
# Serán sobrescritas por Railway
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/db/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start
CMD ["npm", "start"]

