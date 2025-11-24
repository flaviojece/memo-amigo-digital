-- Criar tabela para armazenar subscrições Web Push
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Dados da subscrição (formato PushSubscription da Web Push API)
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,  -- chave pública do cliente
  auth TEXT NOT NULL,    -- chave de autenticação
  
  -- Metadados
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Evitar duplicatas
  UNIQUE(user_id, endpoint)
);

-- Índice para buscar subscrições de um usuário
CREATE INDEX idx_push_subscriptions_user ON push_subscriptions(user_id);

-- RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own subscriptions"
  ON push_subscriptions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can read all subscriptions"
  ON push_subscriptions FOR SELECT
  USING (true);

-- Configurar cron job para processar notificações a cada 5 minutos
SELECT cron.schedule(
  'process-pending-notifications',
  '*/5 * * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://qxuiymmzjptpczodbvmm.supabase.co/functions/v1/process-notifications',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4dWl5bW16anB0cGN6b2Ridm1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzODk2MzMsImV4cCI6MjA3ODk2NTYzM30.a0AG6fxvpbtL4y-nV0Ie6hyULD7BFJdJ6-aGDwddkNk"}'::jsonb,
      body := '{}'::jsonb
    ) AS request_id;
  $$
);