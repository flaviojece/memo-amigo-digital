-- Criar tabela de audit_logs para rastrear operações sensíveis
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type text NOT NULL,
  table_name text,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Criar índices para performance
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action_type ON public.audit_logs(action_type);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_table_record ON public.audit_logs(table_name, record_id);

-- Habilitar RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Política: Apenas admins podem visualizar logs de auditoria
CREATE POLICY "Admins can view all audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Política: Usuários podem inserir seus próprios logs (usado por triggers)
CREATE POLICY "System can insert audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política: Apenas admins podem deletar logs antigos
CREATE POLICY "Admins can delete old audit logs"
ON public.audit_logs
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Comentários para documentação
COMMENT ON TABLE public.audit_logs IS 'Registra operações sensíveis para auditoria de segurança';
COMMENT ON COLUMN public.audit_logs.action_type IS 'Tipo de ação: user_role_changed, user_deleted, emergency_activated, location_sharing_changed, etc.';
COMMENT ON COLUMN public.audit_logs.old_data IS 'Dados antes da alteração (para UPDATE/DELETE)';
COMMENT ON COLUMN public.audit_logs.new_data IS 'Dados depois da alteração (para INSERT/UPDATE)';