# Sistema de Gerenciamento de Pedidos para Pizzarias

Sistema completo SaaS multi-tenant para gerenciamento de pizzarias com interface web moderna.

## 🚀 Funcionalidades

- **Multi-Tenant**: Suporte a múltiplas pizzarias com isolamento completo de dados
- **Gerenciamento de Pedidos**: Controle completo do fluxo de pedidos
- **Cardápio Digital**: Sistema flexível de categorias e itens
- **Base de Clientes**: Histórico completo de clientes e pedidos
- **Relatórios**: Analytics e métricas de desempenho
- **Autenticação**: Integração com Replit Auth

## 🛠️ Tecnologias

### Backend
- **Node.js** + **Express.js**
- **TypeScript**
- **PostgreSQL** + **Drizzle ORM**
- **Replit Auth** (OpenID Connect)

### Frontend
- **React 18** + **TypeScript**
- **Tailwind CSS** + **Shadcn/UI**
- **Wouter** (roteamento)
- **TanStack Query** (gerenciamento de estado)

## 📁 Estrutura do Projeto

```
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Componentes UI
│   │   ├── pages/         # Páginas da aplicação
│   │   ├── hooks/         # React hooks
│   │   └── lib/           # Utilitários
├── server/                # Backend Express
│   ├── routes.ts          # Rotas da API
│   ├── storage.ts         # Camada de dados
│   ├── replitAuth.ts      # Autenticação
│   └── db.ts             # Configuração do banco
├── shared/                # Código compartilhado
│   └── schema.ts         # Schema do banco de dados
└── components.json        # Configuração Shadcn/UI
```

## 🗄️ Modelo de Dados

### Principais Entidades
- **Users**: Usuários do sistema
- **Tenants**: Pizzarias (multi-tenant)
- **MenuCategories**: Categorias do cardápio
- **MenuItems**: Itens com preços flexíveis (JSON)
- **Customers**: Base de clientes
- **Orders**: Pedidos completos

### Relacionamentos
- Usuários podem pertencer a múltiplas pizzarias
- Cada pizzaria tem seus próprios dados isolados
- Histórico completo de pedidos por cliente

## 🎯 Páginas da Aplicação

1. **Landing Page**: Apresentação do sistema
2. **Dashboard**: Visão geral e métricas
3. **Pedidos**: Gerenciamento de pedidos em tempo real
4. **Cardápio**: Gestão de categorias e itens
5. **Clientes**: Base de clientes e histórico
6. **Relatórios**: Analytics e dashboards
7. **Configurações**: Configurações da pizzaria

## 🔧 Instalação e Uso

### Pré-requisitos
- Node.js 18+
- PostgreSQL
- Conta Replit (para autenticação)

### Configuração
1. Clone o repositório
2. Instale as dependências: `npm install`
3. Configure as variáveis de ambiente
4. Execute as migrações: `npm run db:push`
5. Inicie o servidor: `npm run dev`

### Variáveis de Ambiente Necessárias
```
DATABASE_URL=postgresql://...
SESSION_SECRET=seu-secret-aqui
REPL_ID=seu-repl-id
ISSUER_URL=https://replit.com/oidc
REPLIT_DOMAINS=seu-dominio.replit.app
```

## 📊 Recursos do Sistema

### Gerenciamento de Pedidos
- Status em tempo real (pendente → preparando → pronto → entregando → entregue)
- Histórico completo de pedidos
- Cálculo automático de totais e taxas
- Integração com dados de clientes

### Cardápio Digital
- Categorias organizadas
- Preços flexíveis (pequeno/médio/grande ou preço único)
- Controle de disponibilidade
- Upload de imagens

### Analytics
- Total de pedidos e faturamento
- Tempo médio de entrega
- Itens mais populares
- Relatórios por período

### Multi-Tenant
- Isolamento completo de dados entre pizzarias
- Configurações independentes
- Usuários podem gerenciar múltiplas pizzarias

## 🔐 Segurança

- Autenticação via OpenID Connect
- Sessões seguras com armazenamento em PostgreSQL
- Isolamento de dados por tenant
- Validação de entrada com Zod

## 🎨 Interface

- Design moderno e responsivo
- Componentes reutilizáveis com Shadcn/UI
- Tema escuro/claro (configurável)
- Experiência mobile-friendly

## 📝 Licença

Este projeto é um sistema de demonstração para gerenciamento de pizzarias.

---

**Desenvolvido com ❤️ para o setor de delivery de pizzas**