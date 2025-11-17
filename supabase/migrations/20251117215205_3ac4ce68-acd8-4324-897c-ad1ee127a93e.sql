-- Criar tabela para agendamentos de notificações
CREATE TABLE IF NOT EXISTS notification_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Tipo de notificação
  type TEXT NOT NULL CHECK (type IN ('medication', 'appointment')),
  
  -- Referência ao item relacionado
  medication_id UUID REFERENCES medications(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  
  -- Quando enviar a notificação
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Status
  sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP WITH TIME ZONE,
  
  -- Conteúdo da notificação
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  icon TEXT DEFAULT '/icon-192.png',
  
  -- Para onde redirecionar ao clicar
  click_action TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Garantir integridade
  CONSTRAINT valid_reference CHECK (
    (type = 'medication' AND medication_id IS NOT NULL) OR
    (type = 'appointment' AND appointment_id IS NOT NULL)
  )
);

-- Índices para performance
CREATE INDEX idx_notification_schedules_pending 
  ON notification_schedules(scheduled_for) 
  WHERE sent = FALSE;

CREATE INDEX idx_notification_schedules_user 
  ON notification_schedules(user_id);

-- Adicionar coluna para controle de notificações no perfil
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT TRUE;

-- RLS Policies para notification_schedules
ALTER TABLE notification_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notification_schedules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications"
  ON notification_schedules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notification_schedules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON notification_schedules FOR DELETE
  USING (auth.uid() = user_id);