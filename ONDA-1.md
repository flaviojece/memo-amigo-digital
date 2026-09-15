# Onda 1 — adesão, fotos e acessibilidade

`npm run typecheck` limpo · `npm run build` OK · `npm test` 33/33.

Aplique com o patch ou peça ao Lovable para aplicar arquivo por arquivo. **Rode a migração
`20260915120000_adesao_e_fotos.sql` antes de publicar** — sem ela a coluna `photo_url`,
o bucket de fotos e as funções de adesão não existem, e as telas novas dão erro.

---

## 1. Adesão ao tratamento

A tabela `medication_logs` já era gravada e nunca lida. Agora é a base de três telas.

**No banco** (duas funções `security definer`, ambas checando se quem pergunta é o próprio
paciente ou um anjo ativo dele):

- `get_adherence_by_day(_patient_id, _days)` — uma linha por dia: doses previstas e confirmadas.
- `get_adherence_by_medication(_patient_id, _days)` — o mesmo, quebrado por remédio.

As previstas são calculadas a partir dos horários cadastrados em cada medicamento, cruzados
com o período em que ele esteve ativo. Índice novo em `(user_id, scheduled_time)`.

**No app:**

- Card "Sua semana" na tela inicial: sete quadrados grandes, verde/amarelo/vermelho. Sem
  gráfico e sem números pequenos — leitura instantânea. O texto é sempre de reforço positivo;
  em nenhuma faixa ele cobra ou culpa.
- Tela completa em `/patient/adherence`: 7/30/90 dias, percentual grande, barra por remédio.
- **Relatório para a consulta**: botão "Imprimir ou salvar em PDF". Usa a impressão do próprio
  navegador com um CSS de impressão que esconde a navegação e acrescenta cabeçalho com nome,
  período e data. Sem dependência nova no bundle, e funciona no celular.

## 2. Foto do medicamento

- Coluna `photo_url` em `medications` e bucket **privado** `medication-photos`.
- RLS por pasta: o caminho é `<user_id>/<arquivo>`, então o dono lê e escreve, e o anjo lê.
- Componente `PhotoUpload`: abre a câmera direto no celular (`capture="environment"`),
  redimensiona para 800px e comprime para JPEG 82% antes de enviar — foto de celular tem 4 MB
  e o público costuma estar em rede móvel limitada. Apaga a foto anterior ao trocar.
- A foto aparece no card de destaque e na lista de remédios.

## 3. A tela inicial ganhou um rei

Antes eram vários cards de peso visual igual. Agora o terço superior é um único card grande:
foto, nome, dosagem, horário em 40px e um botão "Já tomei" de 72px de altura.

Confirmar dali grava em `medication_logs`, avisa os anjos, **vibra o aparelho** e atualiza a
adesão na hora. Confirmação silenciosa gera dúvida, e dúvida faz tomar dose dupla.

## 4. Acessibilidade

**Tamanho de letra escolhido pelo usuário.** Os tokens `senior-*` viraram `rem` e o `<html>`
carrega um multiplicador. Três opções (Normal / Grande / Maior) no menu "Mais"; o próprio botão
mostra o tamanho antes de aplicar. Fica no aparelho, então vale já na tela de login.

**Contraste medido, não estimado:**

| Combinação | Antes | Situação |
|---|---|---|
| Marrom sobre creme | 8.67:1 | passa AAA |
| Verde petróleo sobre branco | 5.05:1 | passa AA |
| **Vermelho queimado sobre creme** | **3.47:1** | **reprova AA** |
| **Mostarda como texto** | **2.08:1** | **ilegível** |

Adicionei `--primary-text`, `--secondary-text` e `--accent-text`: versões escurecidas dos mesmos
tons, todas acima de 4.5:1. A paleta de marca não muda — os tons originais seguem valendo para
fundo de botão e ícone decorativo. **Falta trocar `text-primary` por `text-primary-text` nos
textos existentes**, um a um; não fiz em massa para não mexer no visual sem você ver.

**Skeletons** no lugar do spinner genérico nas telas novas.

---

## O que ficou para as próximas ondas

Deixei de fora de propósito, porque cada uma muda backend ou precisa de decisão sua:

1. **Escalonamento** — se ninguém confirmar em 30 min, avisar o anjo. Precisa de job no
   `pg_cron` e política de horário (não acordar o filho às 3h).
2. **Estoque** — quantidade na cartela, aviso de recompra e de renovar receita.
3. **Cadastro por foto da receita** — extração por IA virando sugestão. Precisa de chave de API
   e de testes com receitas suas de verdade; erro aqui é erro de medicação.
4. **Onboarding** — três telas terminando em "convide seu Anjo".
5. **Consultas** — lembrete na véspera, campo de preparo, endereço que abre no mapa.
6. **Ilustrações do Dr. Memo** — é trabalho do Marcus Pablo, não meu.

Sugiro publicar a onda 1 e usar uma semana antes da próxima: a tela de adesão vai revelar
se os dados de `medication_logs` estão chegando como você espera, e isso muda o desenho do
escalonamento.
