# Substituir o app pela versão atualizada do pacote

Vou trocar o conteúdo do projeto pelo do arquivo que você enviou (`pacote/`), que traz as 12 frentes descritas no LEIA-ME (adesão, fotos de medicamento, acessibilidade, escalonamento de dose perdida, estoque, receita por foto, onboarding, consultas, auditoria de acesso, privilégio mínimo do admin, camada visual e localização honesta).

## O que será feito

1. Copiar todos os 300 arquivos do pacote por cima do projeto — telas, funções de servidor, migrações do banco, ícones e capturas de tela.
2. Manter intocado o arquivo de configuração que a plataforma gera automaticamente (o pacote também não o inclui, de propósito). Nada de chaves circulando.
3. Instalar as bibliotecas conforme o pacote e conferir tipos, testes e build.
4. Rodar no banco as 5 novas atualizações, na ordem dos nomes:
   - adesão e fotos (inclui a área privada de fotos de medicamento)
   - escalonamento, estoque e consultas (inclui a tarefa automática de checagem de doses perdidas)
   - auditoria de acesso e correção de permissões
   - privilégio mínimo do administrador
   - localização honesta (limpeza automática do histórico às 3h30 e registro de quem viu a localização)
5. Publicar as funções de servidor novas e as reescritas: checagem de doses perdidas, leitura de receita por foto e avisos aos anjos (com o módulo compartilhado).
6. Conferir que os segredos necessários já estão configurados e, se faltar algum, pedir a você.

## Arquivos removidos

Três arquivos existem hoje e não vêm no pacote. Vou apagar apenas o resto de build antigo (`dev-dist/registerSW.js`) e **manter** os dois registros de planos anteriores em `.lovable/` — eles não afetam o app.

## Detalhes técnicos

- Cópia com `rsync -a --exclude='.git' --exclude='.env'` de `/tmp` extraído para a raiz do projeto; `.env` e `.git` preservados.
- `src/integrations/supabase/client.ts` e `previewAuthStorage.ts` do pacote são idênticos aos atuais — sem risco de sobrescrita indevida. `types.ts` vem atualizado com as novas tabelas.
- `supabase/config.toml`: o pacote adiciona `[functions.check-missed-doses] verify_jwt = false` (chamada pelo cron). Vou aplicar esse bloco no config atual em vez de substituir o arquivo inteiro.
- `package.json`: dependências novas relevantes — nenhuma além das já existentes; devDependencies mantêm `vitest ^2.1.9` (compatível com Vite 5). `npm install` depois da cópia.
- Migrações aplicadas via ferramenta de migração, uma por uma, na ordem do nome. As duas com `cron.schedule` dependem de `pg_cron`/`pg_net`; verifico as extensões antes.
- `extract-prescription` usa `LOVABLE_API_KEY` (IA da plataforma) — confirmo o segredo antes do deploy.
- Verificação final: `npm run typecheck`, `npm test`, build, e o linter de segurança do banco após as migrações.

## Riscos que vale saber

- A substituição é completa: qualquer ajuste feito só aqui na Lovable e que não esteja no pacote será perdido. O pacote diz que a base é o commit `4c8f4d0`, o mesmo estado atual do projeto, então a perda esperada é nenhuma.
- As migrações alteram permissões de acesso e reduzem o acesso clínico do administrador. Depois de aplicar, vale testar entrar como paciente, como anjo e como administrador.

## Continua por sua conta

Trocar a senha do administrador, limpar o histórico do GitHub, restringir o token do Mapbox por URL, rotacionar a senha de e-mail e as chaves de notificação, e testar a leitura de receitas com receitas reais antes de liberar para os usuários.
