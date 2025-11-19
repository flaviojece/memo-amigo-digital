-- ============================================
-- TABELA 1: location_sharing_settings
-- ============================================
CREATE TABLE IF NOT EXISTS location_sharing_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Controle de compartilhamento
  is_sharing BOOLEAN NOT NULL DEFAULT false,
  
  -- Consentimento LGPD
  consent_given_at TIMESTAMPTZ,
  consent_text TEXT,
  
  -- Configurações de atualização
  update_interval_seconds INTEGER DEFAULT 15 CHECK (update_interval_seconds >= 5),
  accuracy_threshold_meters INTEGER DEFAULT 50 CHECK (accuracy_threshold_meters >= 10),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABELA 2: live_locations
-- ============================================
CREATE TABLE IF NOT EXISTS live_locations (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Coordenadas
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION,
  
  -- Metadados de movimento
  heading DOUBLE PRECISION CHECK (heading IS NULL OR (heading >= 0 AND heading <= 360)),
  speed DOUBLE PRECISION CHECK (speed IS NULL OR speed >= 0),
  battery_level INTEGER CHECK (battery_level IS NULL OR (battery_level >= 0 AND battery_level <= 100)),
  
  -- Status
  is_moving BOOLEAN DEFAULT false,
  last_movement_at TIMESTAMPTZ,
  
  -- Timestamp
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABELA 3: location_history
-- ============================================
CREATE TABLE IF NOT EXISTS location_history (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Coordenadas
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION,
  heading DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  
  -- Timestamp
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_live_locations_updated_at 
  ON live_locations(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_location_history_user_time 
  ON location_history(user_id, recorded_at DESC);

-- ============================================
-- HABILITAR RLS (Row Level Security)
-- ============================================
ALTER TABLE location_sharing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_history ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: location_sharing_settings
-- ============================================

-- Usuário vê próprias configurações
CREATE POLICY "Users can view own sharing settings"
  ON location_sharing_settings FOR SELECT
  USING (auth.uid() = user_id);

-- Usuário edita próprias configurações
CREATE POLICY "Users can manage own sharing settings"
  ON location_sharing_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Guardiões podem ver se paciente está compartilhando
CREATE POLICY "Guardians can view patient sharing status"
  ON location_sharing_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM guardian_relationships
      WHERE patient_id = location_sharing_settings.user_id
        AND guardian_id = auth.uid()
        AND status = 'active'
    )
  );

-- ============================================
-- RLS POLICIES: live_locations
-- ============================================

-- Usuário vê própria localização
CREATE POLICY "Users can view own location"
  ON live_locations FOR SELECT
  USING (auth.uid() = user_id);

-- Usuário atualiza própria localização
CREATE POLICY "Users can manage own location"
  ON live_locations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Guardiões veem localização SE is_sharing = true
CREATE POLICY "Guardians can view patient location if sharing"
  ON live_locations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM guardian_relationships gr
      JOIN location_sharing_settings lss ON lss.user_id = gr.patient_id
      WHERE gr.patient_id = live_locations.user_id
        AND gr.guardian_id = auth.uid()
        AND gr.status = 'active'
        AND lss.is_sharing = true
    )
  );

-- ============================================
-- RLS POLICIES: location_history
-- ============================================

-- Usuário vê próprio histórico
CREATE POLICY "Users can view own location history"
  ON location_history FOR SELECT
  USING (auth.uid() = user_id);

-- Usuário insere próprio histórico
CREATE POLICY "Users can insert own location history"
  ON location_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Guardiões veem histórico do paciente
CREATE POLICY "Guardians can view patient location history"
  ON location_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM guardian_relationships
      WHERE patient_id = location_history.user_id
        AND guardian_id = auth.uid()
        AND status = 'active'
    )
  );

-- ============================================
-- TRIGGER: updated_at automático
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_location_sharing_settings_updated_at 
  BEFORE UPDATE ON location_sharing_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_live_locations_updated_at 
  BEFORE UPDATE ON live_locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- HABILITAR SUPABASE REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE live_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE location_sharing_settings;