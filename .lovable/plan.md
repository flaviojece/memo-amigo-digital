# Aplicar as correções de segurança e bugs do Dr. Memo

Vou aplicar no projeto as mudanças do arquivo que você enviou, adaptando os pontos que não funcionam do mesmo jeito aqui dentro da Lovable.

## O que será feito

### Segurança
- Remover a tela de reset de desenvolvimento (tinha e-mail e senha de admin escritos no código) e a função de servidor que apagava todos os usuários.
- As telas de desenvolvimento (`/dev/...`) passam a existir apenas no ambiente de desenvolvimento, nunca no app publicado.
- Nos envios de alerta de emergência, avisos aos anjos, aviso de sugestão e reenvio de convite: a identidade de quem pediu passa a vir do login (não mais de dados enviados pelo navegador), com verificação de vínculo ativo entre anjo e paciente e de dono do registro.
- O convite por e-mail passa a ler os dados direto do banco e só aceita links dos domínios do próprio app.
- Cache do app offline: deixa de guardar respostas do backend por 24h; agora só leituras simples por 1h, e nunca dados de login ou funções.

### Correções de comportamento
- "Próximo remédio" passa a mostrar o horário realmente mais próximo entre todos os medicamentos ativos, recalculando a cada minuto.
- Administrador não é mais jogado para a tela de paciente enquanto as permissões carregam.
- Verificação de "sistema vazio" passa a usar uma função própria no banco.
- Reenvio de convite passa a usar o código correto do convite (o link estava quebrado).
- As abas do paciente viram endereços próprios, então o botão "voltar" do Android funciona.
- A aba "Mais" (sair da conta, gerenciar anjos, notificações) volta a ficar acessível ao paciente.
- O card "Localização dos Pacientes" deixa de aparecer para quem não tem anjos.
- "Última sincronização" passa a refletir o estado real da conexão.

### Manutenção
- Adicionar os comandos de teste e verificação de tipos.
- Mover as bibliotecas de teste para dependências de desenvolvimento.
- Ajustar a configuração de testes para não tentar rodar os testes de navegador.

## Detalhes técnicos

- O patch será aplicado arquivo por arquivo (não via `git am`, já que o histórico git é gerenciado pela plataforma).
- Exceções ao patch:
  - `.env` **não** será apagado: é gerado automaticamente pela plataforma e o app para de funcionar sem ele. O `.gitignore` e o `.env.example` serão atualizados.
  - `package-lock.json` não será aplicado como diff; as mudanças de `package.json` (scripts + devDependencies) serão feitas e as dependências reinstaladas.
  - `src/integrations/supabase/types.ts` é gerado automaticamente; a nova RPC aparece lá após a migração.
- Nova migração: função `is_system_empty()` (security definer) + `GRANT EXECUTE` para `anon`/`authenticated`.
- Novo módulo compartilhado `supabase/functions/_shared/auth.ts` para validar o JWT nas funções.
- Rotas do paciente: `/patient`, `/patient/meds`, `/patient/more`, etc.
- Depois de aplicar: rodar migração, redeploy das funções, e verificar build/testes.

## Ações fora do código (por sua conta)

Estas eu não consigo fazer:
1. Trocar a senha do administrador (ela ficou exposta).
2. Limpar o histórico do git do seu repositório no GitHub (`git filter-repo`) — remover o arquivo agora não apaga a senha dos commits antigos; esse passo continua sendo necessário e é seu.
3. Restringir o token do Mapbox por URL no painel da Mapbox.
4. Rotacionar a senha de e-mail SMTP e as chaves de notificação push.

Sobre o endereço público usado no link de convite: o app publicado é `https://drmemo.com.br` (domínio próprio já ativo, além de `memo-amigo-digital.lovable.app`), então vou usar `https://drmemo.com.br` como valor do segredo `APP_PUBLIC_URL`. Se preferir outro, me diga antes de aprovar.

