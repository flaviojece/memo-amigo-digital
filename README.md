# 👴👵 Dr. Memo - Amigo Digital para Idosos

Dr. Memo é um aplicativo assistente digital desenvolvido especialmente para idosos, oferecendo uma interface amigável e intuitiva para gerenciar medicamentos, consultas médicas e contatos de emergência.

## 🎯 Objetivo

Facilitar o dia a dia de pessoas idosas com:
- **Gerenciamento de Medicamentos**: Lembretes de horários, histórico de tomadas
- **Agenda de Consultas**: Organização de compromissos médicos
- **Contatos de Emergência**: Acesso rápido a familiares e serviços de saúde
- **Botão de Emergência**: Ativação rápida com contagem regressiva de segurança

## 🚀 Tecnologias

- **Frontend**: React 18 + TypeScript + Vite
- **Estilização**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (via Lovable Cloud)
  - Autenticação
  - Banco de dados PostgreSQL
  - Row Level Security (RLS)
  - Edge Functions
- **Gerenciamento de Estado**: TanStack Query (React Query)
- **Formulários**: React Hook Form + Zod
- **Ícones**: Lucide React
- **Datas**: date-fns

## 📱 Funcionalidades

### ✅ Implementadas
- ✨ Sistema de autenticação (login/cadastro)
- 💊 Gerenciamento completo de medicamentos
- 📅 Agenda de consultas médicas
- 👥 Lista de contatos de emergência
- 🚨 Botão de emergência com contagem regressiva
- 📊 Dashboard com resumo do dia
- 🌙 Suporte a modo escuro/claro
- ♿ Design acessível (ARIA, alto contraste, fontes grandes)

### 🔜 Futuras
- 📱 Notificações push
- 👨‍👩‍👧‍👦 Sistema de família/cuidadores
- 📈 Relatórios e estatísticas
- 🎮 Gamificação (pontos por adesão)
- 🗣️ Assistente de voz

## 🎨 Design System

O app segue um design system voltado para idosos:
- **Fontes Grandes**: Tamanhos de texto entre 18px-32px
- **Alto Contraste**: Seguindo WCAG AA
- **Botões Grandes**: Área de toque mínima de 64x64px
- **Ícones + Texto**: Sempre combinados para clareza
- **Cores Suaves**: Gradientes suaves e cores relaxantes
- **Feedback Visual**: Animações e transições claras

## 🏗️ Estrutura do Projeto

```
src/
├── components/
│   ├── home/              # Componentes da página inicial
│   ├── medications/       # Sistema de medicamentos
│   ├── appointments/      # Sistema de consultas
│   ├── contacts/          # Sistema de contatos
│   ├── emergency/         # Sistema de emergência
│   ├── auth/              # Autenticação
│   └── ui/                # Componentes UI (shadcn)
├── contexts/              # Contextos React (Auth, etc)
├── hooks/                 # Custom hooks
├── lib/
│   ├── utils.ts           # Utilitários
│   └── validations/       # Schemas Zod
├── pages/                 # Páginas da aplicação
└── integrations/
    └── supabase/          # Cliente Supabase (auto-gerado)
```

## 🗄️ Banco de Dados

### Tabelas Principais
- `profiles` - Perfis de usuários
- `user_roles` - Papéis (admin, user, angel)
- `medications` - Medicamentos cadastrados
- `medication_logs` - Histórico de tomadas
- `appointments` - Consultas médicas
- `emergency_contacts` - Contatos de emergência
- `emergency_activations` - Histórico de ativações de emergência

### Segurança
- ✅ Row Level Security (RLS) em todas as tabelas
- ✅ Políticas baseadas em `user_id`
- ✅ Função `has_role()` para verificação de permissões
- ✅ Triggers para `updated_at` automático

## 🔧 Como Rodar Localmente

### Pré-requisitos
- Node.js 18+
- npm ou yarn ou bun

### Instalação

```bash
# Clone o repositório
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Instale as dependências
npm install

# O projeto já vem com .env configurado via Lovable Cloud
# Não é necessário configurar variáveis de ambiente

# Rode o projeto
npm run dev
```

O app estará disponível em `http://localhost:5173`

## 🧪 Testes

```bash
# Rodar testes unitários (quando implementados)
npm run test

# Rodar testes E2E (quando implementados)
npm run test:e2e
```

## 📦 Deploy

O projeto pode ser deployado com um clique via Lovable:
1. Clique em "Publish" no canto superior direito
2. Configure seu domínio customizado (plano pago)
3. O backend (Supabase) já está configurado automaticamente

## 👥 Papéis de Usuário

- **user**: Usuário padrão (idoso)
- **admin**: Administrador (pode ver todos os dados)
- **angel**: Familiar/cuidador (futuro - acesso compartilhado)

## 🔒 Segurança

- ✅ Autenticação via Supabase Auth
- ✅ RLS policies em todas as tabelas
- ✅ Validação de inputs com Zod
- ✅ Sanitização de dados
- ✅ HTTPS em produção
- ✅ Secrets gerenciados via Lovable Cloud

## 🤝 Contribuindo

Este é um projeto desenvolvido via Lovable. Para contribuir:
1. Descreva as mudanças desejadas
2. Teste em desenvolvimento
3. Valide acessibilidade
4. Deploy em produção

## 📄 Licença

Projeto desenvolvido para fins educacionais e assistenciais.

## 🙏 Agradecimentos

- shadcn/ui pelos componentes
- Supabase pela infraestrutura
- Lovable pela plataforma de desenvolvimento
- Comunidade de idosos que inspirou este projeto

---

**Desenvolvido com ❤️ para nossos queridos idosos**

## Project info

**URL**: https://lovable.dev/projects/3b144aa8-dc9a-48e3-8466-3e4963b773fe
