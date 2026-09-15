# Dr. Memo — repositório completo com as alterações

Este é o código do `memo-amigo-digital` com tudo o que fizemos aplicado.
Base: commit `4c8f4d0` ("Verificou datas e duplicidade"), que era o topo do seu
GitHub quando comecei.

`npm run typecheck` limpo · `npm run build` OK · `npm test` 33/33.

## O que tem de novo

1. **Adesão ao tratamento** — telas, relatório para levar na consulta
2. **Fotos de medicamento** — câmera, bucket privado, foto no card e na lista
3. **Acessibilidade** — tamanho de letra ajustável, contraste corrigido
4. **Escalonamento de dose perdida** — cron, horário de silêncio por anjo
5. **Estoque** — aviso antes de a cartela acabar
6. **Receita por foto** — extração com dupla revisão humana
7. **Onboarding** — três telas terminando no convite do Anjo
8. **Consultas** — preparo, endereço no mapa, lembrete da véspera
9. **Auditoria de RLS** — vazamento de push corrigido, anjo passa a enxergar o paciente
10. **Privilégio mínimo do admin** — acesso clínico reduzido e auditado
11. **Camada visual base** — campos, botões e espaçamento redimensionados
12. **Localização honesta** — idade da posição, rastros, retenção, transparência

Detalhes em ONDA-1.md, ONDA-2.md, ONDA-3.md, AUDITORIA-RLS.md e
ANALISE-RASTREAMENTO.md (este último é o estudo do rastreamento).

## Como usar

### Se for substituir o repositório local

```bash
# Faça backup do que tem hoje, por segurança
cd seu-projeto
git checkout -b melhorias-setembro

# Copie o conteúdo desta pasta por cima (menos a pasta .git, que não vem aqui)
# Depois:
npm install
npm run typecheck && npm test && npm run build
git add -A
git commit -m "Adesão, fotos, escalonamento, auditoria RLS e localização honesta"
git push origin melhorias-setembro
```

### Se preferir aplicar como patches

Use `TODAS-AS-ALTERACOES.patch`, que preserva os 6 commits separados — fica
melhor para revisar e para reverter algo isolado depois.

## Antes de publicar

**Migrações** (na ordem do nome):
`20260915120000_adesao_e_fotos` · `20260915130000_escalonamento_estoque_consultas` ·
`20260915140000_auditoria_rls` · `20260915150000_admin_privilegio_minimo` ·
`20260915160000_localizacao_honesta`

**Edge functions:** `check-missed-doses`, `extract-prescription`,
`notify-guardians` (reescrita) e `_shared/notifyGuardians.ts`

**Segredos:** `LOVABLE_API_KEY`, `HOSTINGER_EMAIL_PASSWORD`, `APP_PUBLIC_URL`,
`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`

## Pendências que continuam sendo suas

1. Trocar a senha do administrador
2. Limpar o histórico do GitHub (`git filter-repo`) — a senha segue nos commits antigos
3. Restringir o token do Mapbox por URL
4. Rotacionar a senha SMTP e as chaves VAPID
5. Testar a extração de receitas com 10–15 receitas reais antes de liberar
6. Ilustrações do Dr. Memo (Marcus Pablo)

---

## Nota sobre o `.env`

Deixei o `.env` **fora** deste pacote de propósito — ele contém a chave do
Supabase e o token do Mapbox, e não faz sentido circular isso num arquivo
compactado. Mantenha o `.env` que já existe no seu projeto (o Lovable gera
automaticamente). O `.env.example` está incluído como referência.
