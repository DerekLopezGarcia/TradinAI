-- ============================================================================
-- TradingIA - PostgreSQL Schema
-- Database: railway
-- Created: April 9, 2026
-- ============================================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- TABLE: users
-- Description: Usuarios de la plataforma
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  password_hash VARCHAR(255),
  theme VARCHAR(20) DEFAULT 'dark',
  notifications_enabled BOOLEAN DEFAULT TRUE,
  language VARCHAR(10) DEFAULT 'es',
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  settings JSONB DEFAULT '{}'::jsonb,
  last_login_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- ============================================================================
-- TABLE: watchlists
-- Description: Listas de seguimiento de activos por usuario
-- ============================================================================
CREATE TABLE IF NOT EXISTS watchlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  settings JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_watchlists_user_id ON watchlists(user_id);
CREATE INDEX idx_watchlists_is_default ON watchlists(user_id, is_default);
CREATE INDEX idx_watchlists_created_at ON watchlists(created_at DESC);

-- ============================================================================
-- TABLE: watchlist_items
-- Description: Activos dentro de las watchlists
-- ============================================================================
CREATE TABLE IF NOT EXISTS watchlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  watchlist_id UUID NOT NULL REFERENCES watchlists(id) ON DELETE CASCADE,
  symbol VARCHAR(20) NOT NULL,
  asset_type VARCHAR(20) NOT NULL DEFAULT 'crypto', -- crypto, stock, forex, commodity
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_price NUMERIC(19,8),
  last_price_update TIMESTAMP,
  notes TEXT
);

CREATE INDEX idx_watchlist_items_watchlist_id ON watchlist_items(watchlist_id);
CREATE INDEX idx_watchlist_items_symbol ON watchlist_items(symbol);
CREATE INDEX idx_watchlist_items_asset_type ON watchlist_items(asset_type);

-- ============================================================================
-- TABLE: analyses
-- Description: Histórico de análisis técnicos
-- ============================================================================
CREATE TABLE IF NOT EXISTS analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol VARCHAR(20) NOT NULL,
  asset_type VARCHAR(20) NOT NULL DEFAULT 'crypto',
  timeframe VARCHAR(10) NOT NULL DEFAULT '1h', -- 1m, 5m, 15m, 1h, 4h, 1d, 1w
  analysis_data JSONB NOT NULL, -- Guarda indicadores, patrones, predicciones
  confidence NUMERIC(3,2) DEFAULT 0.0, -- 0.00 - 1.00
  patterns_detected TEXT[], -- Array de patrones encontrados
  recommendation VARCHAR(20), -- BUY, SELL, HOLD, NEUTRAL
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analyses_user_id ON analyses(user_id);
CREATE INDEX idx_analyses_symbol ON analyses(symbol);
CREATE INDEX idx_analyses_symbol_timeframe ON analyses(symbol, timeframe);
CREATE INDEX idx_analyses_created_at ON analyses(created_at DESC);
CREATE INDEX idx_analyses_confidence ON analyses(confidence DESC);
CREATE INDEX idx_analyses_asset_type ON analyses(asset_type);

-- ============================================================================
-- TABLE: alerts
-- Description: Alertas de precios y condiciones
-- ============================================================================
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol VARCHAR(20) NOT NULL,
  asset_type VARCHAR(20) NOT NULL DEFAULT 'crypto',
  condition_type VARCHAR(50) NOT NULL, -- price_above, price_below, percent_change, technical_signal
  target_price NUMERIC(19,8),
  trigger_percentage NUMERIC(5,2),
  trigger_condition VARCHAR(255), -- JSON serializado para condiciones complejas
  is_active BOOLEAN DEFAULT TRUE,
  is_triggered BOOLEAN DEFAULT FALSE,
  triggered_at TIMESTAMP,
  frequency VARCHAR(50) DEFAULT 'once', -- once, always, daily
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_notification_at TIMESTAMP
);

CREATE INDEX idx_alerts_user_id ON alerts(user_id);
CREATE INDEX idx_alerts_active ON alerts(user_id, is_active);
CREATE INDEX idx_alerts_symbol ON alerts(symbol);
CREATE INDEX idx_alerts_triggered ON alerts(is_triggered);

-- ============================================================================
-- TABLE: historical_prices
-- Description: Caché de datos OHLCV para análisis rápido
-- ============================================================================
CREATE TABLE IF NOT EXISTS historical_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol VARCHAR(20) NOT NULL,
  asset_type VARCHAR(20) NOT NULL DEFAULT 'crypto',
  timeframe VARCHAR(10) NOT NULL DEFAULT '1h',
  open_price NUMERIC(19,8) NOT NULL,
  high_price NUMERIC(19,8) NOT NULL,
  low_price NUMERIC(19,8) NOT NULL,
  close_price NUMERIC(19,8) NOT NULL,
  volume NUMERIC(19,2),
  timestamp TIMESTAMP NOT NULL,
  source VARCHAR(50) DEFAULT 'binance', -- binance, twelvedata, yahoo, etc
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_historical_prices_symbol_timeframe ON historical_prices(symbol, timeframe, timestamp DESC);
CREATE INDEX idx_historical_prices_timestamp ON historical_prices(timestamp DESC);
CREATE INDEX idx_historical_prices_symbol ON historical_prices(symbol);
CREATE INDEX idx_historical_prices_source ON historical_prices(source);
CREATE INDEX idx_historical_prices_asset_type ON historical_prices(asset_type);

-- ============================================================================
-- TABLE: chat_sessions
-- Description: Historial de conversaciones con IA
-- ============================================================================
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_name VARCHAR(255),
  messages JSONB NOT NULL, -- Array de {role, content, timestamp}
  summary TEXT,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_message_at TIMESTAMP
);

CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_created_at ON chat_sessions(created_at DESC);

-- ============================================================================
-- TABLE: system_logs
-- Description: Logs de operaciones críticas (auditoría)
-- ============================================================================
CREATE TABLE IF NOT EXISTS system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL, -- create_user, update_watchlist, etc
  resource_type VARCHAR(50), -- users, watchlists, alerts, etc
  resource_id VARCHAR(100),
  changes JSONB, -- Qué cambió (before/after)
  status VARCHAR(20) DEFAULT 'success', -- success, error, warning
  error_message TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_system_logs_user_id ON system_logs(user_id);
CREATE INDEX idx_system_logs_action ON system_logs(action);
CREATE INDEX idx_system_logs_created_at ON system_logs(created_at DESC);
CREATE INDEX idx_system_logs_status ON system_logs(status);

-- ============================================================================
-- VIEW: user_analysis_summary
-- Description: Resumen de análisis recientes por usuario
-- ============================================================================
CREATE OR REPLACE VIEW user_analysis_summary AS
SELECT
  u.id as user_id,
  u.email,
  COUNT(DISTINCT a.symbol) as analyzed_symbols,
  MAX(a.created_at) as last_analysis,
  AVG(a.confidence) as avg_confidence,
  COUNT(a.id) as total_analyses
FROM users u
LEFT JOIN analyses a ON u.id = a.user_id
GROUP BY u.id, u.email;

-- ============================================================================
-- FUNCTIONS: Triggers para updated_at automático
-- ============================================================================
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a tablas que tienen updated_at
CREATE TRIGGER users_update_timestamp BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER watchlists_update_timestamp BEFORE UPDATE ON watchlists
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER analyses_update_timestamp BEFORE UPDATE ON analyses
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER alerts_update_timestamp BEFORE UPDATE ON alerts
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER chat_sessions_update_timestamp BEFORE UPDATE ON chat_sessions
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================================
-- PERMISSIONS (Para usuarios no-admin)
-- ============================================================================
-- Nota: Ajusta estos permisos según tu esquema de autenticación
-- REVOKE ALL ON SCHEMA public FROM public;
-- GRANT CONNECT ON DATABASE trading_ia TO app_user;
-- GRANT USAGE ON SCHEMA public TO app_user;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- Tables: 8 principales + 1 view
-- Indexes: 30+ para performance
-- Functions: 1 (auto-update timestamp)
-- Triggers: 5 (auto-update timestamp)
-- Extensiones: uuid-ossp, pg_trgm (para búsquedas full-text)
-- ============================================================================

