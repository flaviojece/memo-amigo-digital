# Corrigir a tela de configuração inicial e o acesso de administrador

## O que está acontecendo

Consultei o banco: existem 3 contas cadastradas e **nenhuma** delas tem permissão de administrador.

A verificação de "sistema vazio" hoje pergunta "existe algum administrador?" — como não existe, o app entende que o sistema está vazio e manda todo mundo para a tela de configuração inicial. Lá, a criação do primeiro administrador é recusada (porque já existem contas), o que gera o erro e a tela branca.

## O que será feito

1. Corrigir a verificação para perguntar "existe alguma conta cadastrada?" — assim ninguém mais é enviado à configuração inicial.
2. Na tela de configuração inicial: quando a criação for recusada por já existirem contas, mostrar um aviso claro e levar a pessoa para a tela de entrada, em vez de deixar a tela branca.
3. Dar permissão de administrador à sua conta, para o painel de administrador funcionar.

Vou usar **flaviojece@gmail.com** (a primeira conta criada) como administrador. Se for outro e-mail, me diga antes de aprovar.

## Detalhes técnicos

- Nova migração: `create or replace function public.is_system_empty()` retornando `not exists (select 1 from auth.users)`, `stable security definer`, `set search_path = public`; `revoke all ... from public` e `grant execute` para `anon` e `authenticated`.
- Mesma migração: `insert into public.user_roles (user_id, role) select id, 'admin' from auth.users where email = 'flaviojece@gmail.com' on conflict do nothing;`
- `src/pages/SetupInicial.tsx`: tratar a resposta de erro da função `create-first-admin` (inclusive quando ela vem no corpo com status 400), exibir toast e redirecionar para `/login`.
