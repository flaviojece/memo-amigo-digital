# Onda 3 — localização honesta e funcional

`npm run typecheck` limpo · `npm run build` OK · `npm test` 33/33.
Migração: `20260915160000_localizacao_honesta.sql`.

Os nove itens do caminho A, implementados. Resumo do que muda na prática.

---

## 1. Bateria: um consumidor de GPS em vez de dois

O `setInterval` de 15s rodava **em paralelo** ao `watchPosition`, não como
fallback — ele nunca verificava se o watch estava funcionando. Eram duas linhas
de GPS em alta precisão ligadas ao mesmo tempo, com `maximumAge: 0` proibindo
qualquer reaproveitamento.

Agora é só o `watchPosition`, com `maximumAge: 5000`. Mesma informação, uma
fração do consumo.

## 2. O buffer que travava em silêncio

O código exigia 5 leituras com precisão melhor que 100m antes de gravar
qualquer coisa. Dentro de casa a precisão passa disso com frequência, e aí o
buffer nunca enchia: nenhuma posição gravada, sem erro na tela.

Agora aceita a primeira leitura boa (limite de 150m) e só usa média **quando o
aparelho está parado** — que é quando a média ajuda. Em movimento a média
devolvia um ponto atrás da posição real.

## 3. A idade da posição virou a informação principal

Componente novo (`LocationFreshness`) com peso visual proporcional ao risco:

| Idade | Como aparece |
|---|---|
| Rastreando agora | "Atualizando agora — aplicativo aberto", em verde |
| Menos de 15 min | Cinza, discreto |
| 15 min a 1 hora | **Amarelo, com borda**: "Esta não é a posição atual" |
| Mais de 1 hora | **Vermelho, com `role="alert"`**: "Se você precisa saber onde a pessoa está agora, ligue para ela" |

E diz de onde veio a posição: "Registrada quando confirmou o remédio."

## 4. O app avisa quando o rastreamento para

Ouvindo `visibilitychange` e `pagehide`, o serviço grava `tracking_stopped_at` e
o motivo (`app_em_segundo_plano`, `desligado_pelo_usuario`, `permissao_negada`).
O anjo passa a ver por que o dado congelou, em vez de só ver um marcador parado.

## 5. Rastros — o que substitui o rastreamento contínuo

A posição é registrada nos momentos em que o app **já está aberto**:

- ao abrir o aplicativo (no máximo uma vez a cada 10 minutos)
- ao confirmar um remédio — o melhor momento do dia, porque é garantido
- ao acionar a emergência

Só registra se o paciente tiver o compartilhamento ligado. Sem GPS contínuo,
sem custo de bateria. Na prática isso rende mais posições ao longo do dia que o
rastreamento contínuo, que só funciona com a tela ligada.

## 6. A emergência ganhou precisão

O botão pedia a posição com `timeout: 5000` e sem alta precisão — em 5 segundos
o celular costuma devolver a posição da antena, com centenas de metros de erro.
Agora usa alta precisão e espera até 20 segundos. Numa emergência, 15 segundos a
mais valem muito menos que 300 metros de erro.

## 7. A configuração do banco passou a ser lida

`update_interval_seconds` e `accuracy_threshold_meters` estavam fixos no código.
Agora são carregados do banco ao iniciar o rastreamento. A tela de ajustes passa
a ter efeito real.

## 8. Retenção do histórico (LGPD)

`location_history` crescia sem limite — até 1.440 linhas por dia por paciente,
para sempre. Agora há `retention_days` (padrão 30) e um cron diário às 3h30 que
apaga o que passou do prazo.

O texto de consentimento foi reescrito e agora diz a verdade:

> Eu, [nome], autorizo meus Anjos cadastrados a verem minha localização. Entendo
> que o aplicativo registra minha posição apenas enquanto está aberto no meu
> celular, e que a última posição registrada pode não ser onde estou agora.
> Entendo que posso desligar a qualquer momento, e que o histórico é apagado
> automaticamente após 30 dias.

Usa o nome, não o e-mail. E a comparação com o Uber saiu da tela — ela prometia
exatamente o que o app não entrega.

## 9. Transparência: quem olhou, e quando

Cada abertura do mapa por um anjo é registrada em `audit_logs`. O paciente tem
um painel novo em Configurações de Localização: "Quem viu minha localização",
últimos 7 dias, com nome e horário.

Quem é observado tem direito de saber quando foi observado. Sem isso, o
consentimento é uma caixa marcada uma vez e esquecida.

## Bônus: bug do indicador de bateria

`battery_level > 0.5` comparado com um valor de 0 a 100 — o ícone ficava verde
mesmo com 3% de carga. Corrigido para 50 e 20.

---

## Linguagem

"Tempo real" saiu de toda a interface, substituído por "última localização
conhecida". Não é pessimismo: é a descrição correta do que o sistema faz. Quando
o app nativo chegar, a linguagem volta a mudar — e aí será verdade.

## Depois de aplicar

1. Ligue o compartilhamento, feche o app, espere 20 minutos e abra a tela do
   anjo. Deve aparecer o aviso amarelo com "Esta não é a posição atual".
2. Confirme um remédio e veja se a posição é atualizada com "Registrada quando
   confirmou o remédio".
3. Abra o mapa como anjo e confira o painel de transparência na conta do
   paciente.
4. `select * from cron.job where jobname = 'limpar-historico-localizacao';`

## O que continua valendo para a etapa nativa

Nada disto é jogado fora quando o Capacitor entrar. As tabelas, as policies, a
tela do anjo e o componente de idade da posição continuam iguais — muda só a
fonte dos dados, que passa a funcionar com a tela apagada. E aí o
`LocationFreshness` vai mostrar "Atualizando agora" de verdade, o dia inteiro.
