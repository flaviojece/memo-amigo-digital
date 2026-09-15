# Adequar todo o Dr. Memo para uso mobile e futuro app nativo

## Objetivo
Revisar e corrigir todas as telas para celulares, mantendo leitura confortável para idosos, comandos fáceis de tocar e funcionamento consistente em Android e iOS, inclusive com recortes de tela, barra inferior e teclado aberto.

## Problemas confirmados
- O Painel do Anjo produz 599 px de largura em uma tela de 393 px; o cabeçalho e os botões ficam cortados.
- Abas com quatro ou cinco opções ficam comprimidas no Anjo e na Administração.
- Existem botões de 32–44 px em login, cabeçalhos, guardiões e administração, abaixo do mínimo de 48 px do projeto.
- Títulos e botões disputam espaço nas telas de medicamentos, consultas, contatos e perfil.
- Listas colocam vários botões ao lado do conteúdo, reduzindo demais a área de texto em celulares estreitos.
- A altura da navegação inferior, o botão flutuante e os espaços finais usam valores diferentes, com risco de cobrir conteúdo em iPhones.
- Janelas longas não possuem um comportamento móvel único para rolagem, teclado e área segura.
- As tabelas administrativas não têm uma apresentação adequada para celular.
- O mapa usa altura fixa e controles pequenos, com risco de sobreposição.

## Implementação

### 1. Base móvel compartilhada
- Padronizar todos os comandos interativos com área mínima de 48 × 48 px; manter 56–68 px nas ações principais para idosos.
- Corrigir os componentes compartilhados de botão, abas, janelas, campos, seletores, caixas de seleção e alternadores.
- Fazer janelas respeitarem altura dinâmica da tela, teclado virtual, rolagem interna e áreas seguras de iOS/Android.
- Criar uma única referência para a altura da navegação inferior e usá-la também no botão flutuante e no espaço final das páginas.
- Preservar os tamanhos de fonte ajustáveis e evitar medidas tipográficas fixas que não acompanhem essa configuração.

### 2. Navegação e cabeçalhos
- Reorganizar cabeçalhos para empilhar ou condensar ações em telas estreitas, sem cortar títulos, nomes ou botões.
- Corrigir imediatamente o cabeçalho do Painel do Anjo, colocando voltar e sair em uma disposição móvel estável.
- Ajustar a barra inferior do paciente para áreas seguras, cinco destinos legíveis e estados ativos claros.
- Transformar as abas do Anjo e da Administração em navegação móvel confortável, sem palavras espremidas.
- Garantir comportamento correto do botão Voltar do Android e dos retornos internos existentes.

### 3. Telas do paciente
- Revisar início, medicamentos, agenda de horários, adesão, consultas, contatos, sugestões, perfil, configurações, localização, login, cadastro, recuperação, convite e configuração inicial.
- Em listas, mover ações de editar, excluir e favorito para uma faixa inferior adequada ao celular, preservando a largura do conteúdo.
- Fazer títulos e ações principais quebrarem para linhas próprias quando necessário.
- Ajustar cartões de ações rápidas e grade semanal para 320–430 px, sem truncar informações importantes.
- Melhorar os botões de mostrar senha e demais ícones pequenos.
- Manter o botão de emergência grande e isolado, usando-o como referência de clareza e segurança.

### 4. Painel do Anjo e localização
- Eliminar toda rolagem horizontal no painel e adaptar seletor de paciente, resumos, medicamentos, consultas e sugestões.
- Reorganizar o mapa para usar altura proporcional à tela, com informações e controles sem sobreposição.
- Ampliar comandos de zoom, centralização, voltar, convite, reenviar e remover anjo.
- Adaptar as janelas de sugestão e compartilhamento para uma coluna em celulares estreitos.

### 5. Administração no celular
- Criar apresentação móvel em cartões para usuários, pacientes e localizações, mantendo tabelas apenas em telas maiores.
- Reorganizar cabeçalho, métricas, busca, filtros e ações para uso por toque.
- Remover ou completar comandos sem ação e fornecer nomes acessíveis aos botões de ícone.
- Preservar a restrição atual: administração não volta a exibir dados clínicos protegidos.

### 6. Verificação
- Testar as rotas principais autenticadas em 320×568, 360×640, 393×683 e 430×932.
- Conferir ausência de rolagem horizontal, conteúdo descoberto pela barra inferior e texto sem cortes.
- Verificar janelas e formulários com teclado móvel, orientação retrato e paisagem e fontes ampliadas.
- Validar alvos de toque de pelo menos 48 px, navegação por teclado, foco visível e leitores de tela.
- Rodar os testes existentes e conferir erros de execução e compilação.

## Limites
- Esta etapa altera somente apresentação e interação móvel; regras de medicamentos, consultas, permissões e banco permanecem iguais.
- A adaptação será feita no aplicativo web instalável atual, deixando a interface preparada para empacotamento nativo futuro, sem criar agora os projetos Android/iOS.
