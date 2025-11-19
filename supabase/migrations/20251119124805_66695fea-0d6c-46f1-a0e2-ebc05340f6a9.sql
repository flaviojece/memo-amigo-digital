-- Habilitar extensão pg_cron se não estiver habilitada
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Habilitar extensão pg_net para fazer requisições HTTP
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Criar cron job para processar notificações a cada minuto
SELECT cron.schedule(
  'process-notifications-every-minute',
  '* * * * *', -- Todo minuto
  $$
  SELECT
    net.http_post(
      url:='https://qxuiymmzjptpczodbvmm.supabase.co/functions/v1/process-notifications',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4dWl5bW16anB0cGN6b2Ridm1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzODk2MzMsImV4cCI6MjA3ODk2NTYzM30.a0AG6fxvpbtL4y-nV0Ie6hyULD7BFJdJ6-aGDwddkNk"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);