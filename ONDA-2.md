# Onda 2 — escalonamento, estoque, receita por foto, onboarding e consultas

`npm run typecheck` limpo · `npm run build` OK · `npm test` 33/33.

**Aplique depois da onda 1.** Rode a migração `20260915130000_...sql` e faça o deploy
das edge functions antes de publicar.

---

## Descoberta durante o trabalho: os anjos nunca foram avisados

A `notify-guardians` montava a mensagem, escrevia no log `"Would notify guardian: ..."`
e retornava sucesso. Havia dois `TODO` no lugar do envio. Ou seja: desde sempre, todo
aviso de remédio tomado, consulta criada e afins **não saía do servidor** — e o app
respondia "notificado" para o paciente.

Implementei o envio de verdade num módulo compartilhado (`_shared/notifyGuardians.ts`):
push para quem tem inscrição (chega na hora, que é o que importa numa dose perdida) e
e-mail pelo mesmo SMTP da Hostinger já usado nos convites. Se `HOSTINGER_EMAIL_PASSWORD`
não estiver configurada, o e-mail é pulado com aviso no log em vez de falhar calado.

## 1. Escalonamento de dose perdida

O ciclo estava aberto: a notificação tocava e, se ninguém confirmasse, acabava ali.

- `registrar_doses_perdidas()` marca como `missed` o que passou da tolerância e devolve
  a lista. Só olha as últimas 12h, para não inundar de avisos antigos depois de uma queda.
- Cron a cada 10 minutos (`check-missed-doses`).
- Índice único em `(medication_id, scheduled_time)`: a função é idempotente, então
  chamada repetida não gera aviso repetido.
- **Horário de silêncio por anjo** (padrão 22h–7h) e tolerância configurável
  (15 min a 2h, ou desligado). Ninguém é acordado às 3h por um remédio das 22h.

## 2. Estoque

- `stock_quantity` e `stock_alert_at` em `medications`, ambos opcionais — nem todo
  remédio vem em cartela contável.
- Trigger desconta uma dose a cada confirmação.
- Card na tela inicial quando algo chega ao limite, com o texto virado para a ação:
  comprar ou pedir renovação da receita.

## 3. Receita por foto

Este é o item que eu tinha marcado como o mais delicado, e o desenho reflete isso:

- A edge function `extract-prescription` **não grava nada**. Só propõe.
- O prompt proíbe explicitamente inventar dosagem ou frequência, e manda marcar
  `confianca: "baixa"` em vez de chutar.
- A tela mostra cada medicamento em campos **editáveis**, com selo de confiança, e o
  usuário revisa antes de confirmar.
- Se quem escaneou foi um anjo, o resultado vira **sugestão** — o paciente ainda aprova.
  São duas revisões humanas antes de qualquer remédio entrar no sistema.

**Precisa do segredo `LOVABLE_API_KEY`** (gateway de IA da Lovable, modelo
`google/gemini-2.5-flash`). Sem ele a função responde 503 com mensagem clara, e o resto
do app segue normal.

> Antes de liberar isso para pacientes, teste com 10 ou 15 receitas suas de verdade —
> manuscritas, impressas, amassadas, mal iluminadas. Você é a pessoa certa para julgar
> se a extração está boa o bastante, e é uma decisão clínica, não técnica.

## 4. Onboarding

Três telas na primeira abertura — remédios, anjo, emergência — terminando em
"Convidar meu Anjo agora". Fica no aparelho, com opção de pular.

## 5. Consultas

- Campo **"O que levar ou preparar"** (exames, jejum, convênio).
- Endereço virou link que abre o Google Maps, com área de toque de 48px.
- Lembrete na véspera, via `consultas_de_amanha()` + o mesmo cron, com
  `reminder_24h_sent` para não repetir.

---

## Segredos a configurar no Supabase

| Segredo | Para quê | Sem ele |
|---|---|---|
| `HOSTINGER_EMAIL_PASSWORD` | e-mail aos anjos | push funciona, e-mail não |
| `LOVABLE_API_KEY` | leitura de receita | função responde 503 |
| `APP_PUBLIC_URL` | links nos e-mails | usa drmemo.com.br |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | push | push não sai |

## Duas coisas que continuam sendo suas

1. **Ilustrações do Dr. Memo** — trabalho do Marcus Pablo. Onde entram: as três telas de
   onboarding, os estados vazios e a confirmação de remédio tomado.
2. **A troca de `text-primary` por `text-primary-text`** nos textos existentes, da onda 1.
   Continuo não fazendo em massa: muda o visual de todo o app e você precisa ver antes.

## Sugestão de ordem para publicar

Onda 1 primeiro, sozinha, e use por alguns dias. Depois a onda 2 **com o escalonamento
desligado** (tolerância "Não avisar" nas preferências) até você conferir que as doses
perdidas estão sendo detectadas corretamente. Um falso alarme de "seu pai não tomou o
remédio" custa caro na confiança da família — e ela é o que faz o app ser usado.
