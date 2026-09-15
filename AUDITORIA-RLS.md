# Auditoria de RLS — achados e correções

91 policies em 17 tabelas. Build limpo, 33/33 testes.
Duas migrações: `20260915140000_auditoria_rls.sql` e `20260915150000_admin_privilegio_minimo.sql`.
O patch inclui também as mudanças de código do painel de admin.

---

## Vazamentos corrigidos

**1. `push_subscriptions` lida por qualquer usuário logado**

A policy `"Service role can read all subscriptions"` usava `USING (true)` sem cláusula
`TO`. Sem o `TO service_role`, ela vale para `authenticated`: qualquer pessoa com conta
podia ler endpoint e chaves de push de todos os usuários. E era inútil — o service role
ignora RLS por definição. Removida.

**2. `audit_logs` gravável por qualquer um**

`WITH CHECK (true)` para `authenticated`. Qualquer usuário podia inserir registros,
inclusive atribuindo ações a terceiros. Um log que todos podem forjar não é um log.
Agora exige `user_id = auth.uid()`; as triggers são `SECURITY DEFINER` e não dependiam
dessa brecha.

**3. Sugestão criável em nome de outro anjo**

O `WITH CHECK` validava o vínculo com o paciente, mas não que `angel_id` fosse quem
inseria. Agora exige `angel_id = auth.uid()` e `status = 'pending'` — antes dava para
inserir uma sugestão já aprovada.

## O recurso de anjo estava meio quebrado

Não existia **nenhuma** policy dando ao anjo leitura de medicamentos, doses, consultas,
contatos ou emergências do paciente. A interface tem seletor de paciente: o anjo escolhe
alguém e vê lista vazia, sem erro e sem aviso.

A mais contraintuitiva: o anjo recebia o push de emergência mas não conseguia abrir o
histórico de ativações.

Adicionei leitura nas cinco tabelas. Alteração continua passando pelo fluxo de sugestões
que o paciente aprova — o anjo lê, mas não decide pelo outro.

## Direitos do usuário sobre os próprios dados

Faltavam. Agora existem:

- apagar o próprio histórico de doses (antes nem um registro errado dava para corrigir)
- apagar o próprio histórico de localização
- o anjo encerrar o próprio vínculo — antes só o paciente podia, então um cuidador
  ficava preso à responsabilidade

## Privilégio mínimo do admin (LGPD)

As policies davam ao admin `FOR ALL` sobre todas as tabelas clínicas: ler e alterar o
prontuário de qualquer paciente, sem rastro. Mas o painel só exibe **contagens** e o mapa
de quem compartilha localização.

- Acesso amplo removido das tabelas clínicas. O admin mantém o que é administrativo:
  perfis, papéis, vínculos, convites e os próprios logs.
- `admin_patient_counts()` devolve os números para o painel sem expor conteúdo.
- `admin_live_locations()` **registra cada consulta em `audit_logs`**. Postgres não tem
  trigger de `SELECT`, então obrigar a leitura a passar por uma função é a única forma
  de auditar acesso.

Se em algum momento você precisar mesmo ler o prontuário de um paciente pelo painel,
me avise: dá para fazer uma função de acesso justificado, que exige motivo por escrito
e fica registrada. É o padrão de prontuário eletrônico.

---

## O que não mexi, e por quê

- **`live_locations` para anjos** — já estava correto: exige vínculo ativo *e*
  `is_sharing = true`. Boa policy.
- **`profiles` entre anjo e paciente** — corretamente escopada nos dois sentidos.
- **`user_roles`** — não há policy de escrita pelo cliente; papéis só mudam por edge
  function com service role. Está certo assim: impede escalonamento de privilégio.
- **Todas as funções `SECURITY DEFINER`** têm `set search_path`. Verifiquei uma a uma.

## Depois de aplicar

1. Entre como anjo e confirme que a lista de remédios do paciente aparece — é o teste
   que prova a correção principal.
2. Abra o mapa no painel de admin e rode:
   `select * from audit_logs where action_type = 'admin_viewed_locations' order by created_at desc limit 5;`
