# Rastreamento do paciente pelo anjo — análise completa

## Veredito em uma frase

O rastreamento está bem escrito, mas só funciona enquanto o paciente está com o app
aberto na tela — ou seja, ele não funciona exatamente na situação para a qual foi feito.

Isso não é um bug do seu código. É um limite do que um PWA pode fazer. Abaixo está a
análise do que existe, por que o limite é intransponível na arquitetura atual, e quais
são os três caminhos reais, com custo.

---

# Parte 1 — Como está desenhado hoje

## Arquitetura

```
Celular do paciente                   Supabase                 Celular do anjo
──────────────────────                ────────                 ───────────────
watchPosition (GPS)  ──┐
                       ├─► upsert live_locations ──► Realtime ──► LiveLocationMap
setInterval 15s (GPS) ─┘    insert location_history              (Mapbox GL JS)
```

Três tabelas: `location_sharing_settings` (consentimento e configuração),
`live_locations` (uma linha por usuário, sobrescrita) e `location_history` (trilha).
O anjo recebe atualização por Supabase Realtime e vê num mapa Mapbox.

## O que está bem feito

Vale registrar, porque é bastante coisa:

- **O modelo de dados está correto.** `live_locations` com chave primária no `user_id`
  e upsert é a escolha certa — não acumula lixo e a leitura é O(1).
- **Consentimento registrado com texto e data.** Poucos apps fazem isso. Está na direção
  certa para a LGPD.
- **A policy de acesso do anjo é a melhor do projeto.** Exige vínculo ativo *e*
  `is_sharing = true`. Se o paciente desliga, o anjo perde acesso na mesma hora, no banco,
  não só na interface.
- **Realtime em vez de polling.** Decisão certa: menos consumo dos dois lados.
- **Tratamento de perda de contexto WebGL** no mapa. É um detalhe que quase ninguém cobre
  e que quebra mapas em celular antigo.
- **Filtro de movimento mínimo (50m)** antes de gravar. Evita gravar ruído de GPS parado.

Quem escreveu isso sabia o que estava fazendo. O problema não é capricho, é plataforma.

---

# Parte 2 — O problema fatal

## O rastreamento para quando a tela apaga

`watchPosition` e `setInterval` rodam no JavaScript da página. Quando o paciente bloqueia
o celular, troca de app ou apenas guarda o telefone no bolso:

- **No iPhone**, o JavaScript é suspenso imediatamente. Nenhuma atualização. Não existe
  API de geolocalização em segundo plano para web no iOS, e não há como contornar.
- **No Android**, o Chrome estrangula os timers em segundo plano e congela a aba depois de
  alguns minutos. Com a tela bloqueada, para.

Então o rastreamento funciona enquanto o idoso está segurando o celular com o app aberto
na tela. E o caso de uso que justifica a funcionalidade — a pessoa com demência que saiu
de casa e se perdeu — é precisamente o caso em que o celular está no bolso, com a tela
apagada.

**O anjo vê uma posição que pode ter horas de idade, num mapa que diz "tempo real".**

## E o Service Worker não salva

A saída natural seria: o anjo pede a localização, chega um push, o Service Worker acorda e
responde com a posição. Não funciona — **`navigator.geolocation` não existe dentro de um
Service Worker**. Ele não tem acesso ao GPS, por design. Não há caminho por aí.

## Por que isso é pior que não ter a funcionalidade

Um mapa vazio deixa o anjo em dúvida e ele liga para o pai.

Um mapa mostrando o marcador na casa, com "Há 4 horas" em letra cinza pequena, deixa o
anjo tranquilo. Se o pai saiu há três horas, o app acabou de atrasar o socorro.

Informação desatualizada apresentada como atual é pior que informação nenhuma. Hoje a
idade da posição aparece, mas discreta, ao lado do nível de bateria — com o peso visual
de um detalhe, não de um alerta.

---

# Parte 3 — Problemas do código (que existiriam mesmo sem o limite de plataforma)

## 1. Dois consumidores de GPS ao mesmo tempo

```js
this.watchId = navigator.geolocation.watchPosition(... enableHighAccuracy: true ...)
this.intervalId = setInterval(() => navigator.geolocation.getCurrentPosition(...), 15000)
```

O `setInterval` foi posto como "fallback caso watchPosition falhe", mas ele não verifica
se o watch está funcionando — ele simplesmente roda **em paralelo, sempre**. São duas
linhas de GPS de alta precisão ligadas simultaneamente, com `maximumAge: 0` (proibindo
qualquer cache).

GPS contínuo em alta precisão é dos maiores consumidores de bateria de um celular. Num
aparelho de idoso, que costuma ser mais antigo e com bateria degradada, isso derruba a
carga numa fração do dia. E aí não há rastreamento **nem botão de emergência** — que é a
função que realmente funciona hoje.

## 2. O buffer de 5 leituras pode travar para sempre, em silêncio

```js
if (accuracy > this.minAccuracy) return;   // rejeita > 100m
this.gpsReadings.push(geoPosition);
if (this.gpsReadings.length < this.maxReadings) return;   // espera 5
```

Dentro de casa, com o GPS pegando mal, a precisão frequentemente passa de 100m. Nesse
caso **toda** leitura é rejeitada, o buffer nunca chega a cinco, e nenhuma posição é
gravada — sem erro, sem aviso, sem nada na tela. O anjo vê "compartilhando" e uma posição
velha.

Há ainda um desperdício: quando a pessoa está parada, o buffer enche, calcula a média,
descobre que o movimento foi menor que 50m, **limpa o buffer** e recomeça. Cinco leituras
de GPS gastas a cada ciclo para concluir que nada mudou.

## 3. A média das 3 melhores leituras está errada para quem se move

Calcular média de posições é a técnica certa para um aparelho **parado** — reduz o ruído.
Para alguém andando, ela devolve um ponto atrás da posição real, entre o início e o fim da
janela de coleta. Numa caminhada com coleta a cada 15 segundos, isso significa mostrar o
paciente onde ele estava, não onde está.

O correto é usar a leitura mais recente com precisão aceitável, e aplicar média só quando
`speed` indicar que está parado.

## 4. A configuração do usuário não é lida

`location_sharing_settings` guarda `update_interval_seconds` e
`accuracy_threshold_meters`, gravados no momento do consentimento. O serviço tem:

```js
private updateInterval = 15000;
private accuracyThreshold = 50;
```

Valores fixos no código. **As configurações do banco nunca são lidas.** A tela mostra
esses números em "Informações Técnicas" como se descrevessem o comportamento real. Se um
dia você criar o controle de "economizar bateria", ele não vai ter efeito nenhum.

## 5. `location_history` cresce para sempre

Uma linha por minuto, por paciente, enquanto compartilha. São até 1.440 linhas por dia por
pessoa — cerca de 43 mil por mês. Não existe rotina de limpeza.

Com três usuários é irrelevante. Com cem pacientes são 4,3 milhões de linhas por mês,
crescendo sem teto. Além do custo, **é um problema de LGPD**: dado pessoal sensível
guardado indefinidamente sem finalidade declarada. A lei pede prazo de retenção definido.

E, até a auditoria de RLS da semana passada, o paciente nem podia apagar o próprio
histórico.

## 6. O consentimento é frágil no caso que mais importa

O texto diz "Eu, [email], autorizo...". Três problemas:

- Identifica a pessoa por e-mail, não por nome.
- É colhido uma vez e nunca mais confirmado. Consentimento de 2025 continua valendo em
  2027 sem ninguém perguntar de novo.
- **O paciente nunca sabe quando foi olhado.** Não há registro nem aviso de visualização.

E há a questão que você, como médico, conhece melhor que eu: **uma pessoa com demência
tem capacidade para consentir com o próprio monitoramento?** Se não tem, quem consente
por ela, e isso está documentado? Esse é um problema jurídico e ético, não técnico, e
precisa de uma decisão sua antes de a funcionalidade crescer.

## 7. Custo do mapa (menor do que parece, mas com uma armadilha)

A Mapbox dá <cite index="5-1">50 mil carregamentos de mapa por mês no plano gratuito, e cobra US$ 5 por mil acima disso</cite>. <cite index="2-1">Um carregamento conta cada vez que um objeto Map é inicializado — recarregar a página conta de novo — e cada carregamento cobre interação ilimitada por até 12 horas</cite>.

O código destrói e recria o mapa a cada montagem do componente. Se um anjo ansioso abre e
fecha a tela vinte vezes por dia, são vinte carregamentos. Ainda assim, para a sua escala
atual, isso fica folgado dentro do gratuito. Vale só instrumentar antes de crescer.

Detalhe relevante para a decisão da Parte 4: <cite index="2-1">aplicativos móveis nativos têm cota separada, de 25 mil usuários ativos por mês</cite> — cobrança por usuário, não por abertura. Para este caso de uso, sair do web é **mais barato** em mapa, não mais caro.

---

# Parte 4 — Os três caminhos reais

## Caminho A — Assumir o limite e mudar a promessa

Manter PWA e parar de chamar de "tempo real". O app passa a oferecer
**"última localização conhecida"**, com honestidade sobre a idade do dado.

Como tornar isso útil de verdade: registrar a posição **nos momentos em que o app já é
aberto** — ao confirmar o remédio da manhã, ao abrir a tela inicial, ao tocar no botão de
emergência. O idoso abre o app algumas vezes por dia por causa dos remédios. Isso produz
rastros ao longo do dia, sem GPS contínuo e sem gasto de bateria.

A tela do anjo passa a dizer:

> **Última posição: hoje às 9h12**, quando confirmou o remédio da manhã.
> Há 3 horas. Isso pode não ser onde ele está agora.

- **Custo:** zero. Uma ou duas semanas de trabalho.
- **Ganha:** honestidade, bateria, e um recurso que de fato funciona.
- **Não resolve:** o caso do idoso que se perdeu. Nenhuma versão disso resolve.

## Caminho B — Empacotar como app nativo com Capacitor

O Capacitor pega este mesmo código React e gera um app Android e iOS de verdade, com
acesso às APIs nativas. Existe plugin de <cite index="8-1">geolocalização em segundo plano que continua recebendo atualizações com o app em background, em iOS e Android</cite>.

A parte boa: os plugins maduros <cite index="13-1">usam acelerômetro e giroscópio para detectar movimento, e desligam o GPS automaticamente quando o aparelho está parado</cite> — que é exatamente a economia de bateria que o seu código tenta fazer no JavaScript e não consegue.

O que muda na prática:

- **Android:** <cite index="8-1">exige mostrar uma notificação permanente enquanto rastreia em segundo plano</cite>. Não dá para esconder, e nem deveria.
- **iOS:** exige declarar o modo de background e justificar na revisão da Apple. App de
  cuidado de idoso com consentimento explícito é um caso aceito, mas a revisão é rigorosa
  com rastreamento.
- **Licenças:** Google Play US$ 25 uma vez; Apple US$ 99 por ano. Alguns plugins de
  rastreamento avançado <cite index="13-1">exigem licença paga para builds de produção no Android</cite>; há alternativas da comunidade sem custo.

- **Custo:** as taxas acima, mais o trabalho de empacotar, configurar permissões e passar
  nas revisões. Publicar no iOS ainda exige um Mac ou serviço de build na nuvem.
- **Ganha:** a funcionalidade que você quer, de verdade, funcionando com a tela apagada.
- **Estratégia:** comece pelo Android. É mais barato, a revisão é mais rápida, e é onde
  está a maioria dos usuários no Brasil. iOS depois, quando o produto provar valor.

## Caminho C — Dispositivo dedicado

Para demência avançada, a resposta honesta muitas vezes não é um celular. Relógio com GPS
e chip, ou localizador de bolso, resolvem melhor porque a pessoa não precisa lembrar de
carregar, ligar ou levar o celular. O app poderia integrar com esses dispositivos em vez
de competir com eles.

Fora de escopo agora, mas é o que eu diria a um paciente que perguntasse.

---

# Parte 5 — Minha recomendação

**Faça A agora, planeje B para o próximo trimestre.**

O caminho A não é consolo. Ele corrige um risco ativo: hoje o app faz uma promessa que não
cumpre, num contexto onde acreditar na promessa errada custa tempo de socorro. Corrigir
isso vale mais que qualquer recurso novo.

E ele prepara o terreno para o B: a mesma tela do anjo, o mesmo banco, as mesmas policies.
Quando o Capacitor entrar, muda a fonte dos dados, não a arquitetura.

O caminho B é o que transforma isso na funcionalidade "mais moderna e esperada" que você
quer. Mas ela só é moderna se funcionar com o celular no bolso. Enquanto for PWA, não vai.

## Ordem de trabalho sugerida

**Imediato (risco ativo):**

1. Tirar o `setInterval` paralelo. É duplicação pura de consumo de GPS.
2. Destacar a idade da posição: acima de 15 minutos, aviso amarelo; acima de 1 hora,
   vermelho, com o texto "esta posição pode estar desatualizada" no lugar do horário
   discreto.
3. Trocar "tempo real" por "última posição conhecida" em toda a interface.
4. Avisar quando o rastreamento parar: se o app for para segundo plano com
   compartilhamento ligado, registrar o encerramento e mostrar ao anjo.

**Curto prazo:**

5. Rastros nos momentos de abertura do app (remédio confirmado, tela inicial, emergência).
6. Corrigir o buffer: aceitar a primeira leitura boa, usar média só quando parado.
7. Ler a configuração do banco em vez dos valores fixos.
8. Retenção do histórico: 30 ou 90 dias, apagado por cron, com o prazo escrito na tela de
   consentimento.
9. Registrar em `audit_logs` cada vez que um anjo abre o mapa, e mostrar isso ao paciente.
   Quem é observado tem direito de saber quando foi observado.

**Trimestre:**

10. Capacitor no Android, com o plugin de segundo plano e detecção de movimento.
11. iOS depois, se o Android provar o valor.

---

## Uma observação final

A pergunta que eu não consigo responder por você: **a família quer localização em tempo
real, ou quer tranquilidade?**

São coisas diferentes, e a segunda costuma ser melhor atendida por outra funcionalidade.
"Seu pai tomou o remédio das 8h e abriu o app às 9h12" já entrega quase toda a
tranquilidade que o mapa promete — e essa você já tem pronta, funcionando, sem gastar
bateria nenhuma.

O mapa é o recurso que vende. O registro de rotina é o que costuma acalmar. Vale conversar
com duas ou três famílias antes de investir no caminho B.
