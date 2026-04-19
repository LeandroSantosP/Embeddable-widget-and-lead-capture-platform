# SPEC-02: Modelagem de Dados e Isolamento Multi-Tenant

**Status:** [x] Concluído

**Objetivo:** Criar a modelagem do banco de dados relacional (PostgreSQL) para suportar clientes (tenants), widgets e submissões, garantindo o isolamento estrito dos dados e preparando a infraestrutura para a Fase 1 da aplicação[cite: 6].

---

## 1. Estrutura de Tabelas (DDL)
- [x] Criar o script de migração inicial em `src/database/init.sql`.
- [x] **Tabela `tenants` (Clientes/Donos da Conta):**
  - `id`: UUID (Primary Key).
  - `email`: VARCHAR (Unique, Not Null).
  - `password_hash`: VARCHAR (Not Null).
  - `created_at`: TIMESTAMP (Default Now).
- [x] **Tabela `widgets`:**
  - `id`: UUID (Primary Key).
  - `tenant_id`: UUID (Foreign Key referenciando `tenants.id`, Not Null).
  - `title`: VARCHAR (Not Null).
  - `type`: VARCHAR (ex: 'signup', 'popover') (Not Null).
  - `settings`: JSONB (Para armazenar as configurações flexíveis do widget, como textos e cores).
  - `created_at`: TIMESTAMP (Default Now).
- [x] **Tabela `submissions` (Capturas/Leads):**
  - `id`: UUID (Primary Key).
  - `widget_id`: UUID (Foreign Key referenciando `widgets.id`, Not Null).
  - `data`: JSONB (O payload real com as respostas submetidas pelo visitante)[cite: 6].
  - `ip_address`: VARCHAR (Necessário para a futura proteção contra spam e rate limiting)[cite: 6].
  - `geo_data`: JSONB (Para o enriquecimento de dados da Fase 4 - permite valores nulos inicialmente)[cite: 6].
  - `created_at`: TIMESTAMP (Default Now).

## 2. Índices e Otimização
- [x] Criar índice em `widgets(tenant_id)`.
- [x] Criar índice em `submissions(widget_id)`.
- [x] Criar índice em `submissions(ip_address, created_at)`.

## 3. Conexão no Node.js
- [x] Configurar um *connection pool* em `src/config/database.js` utilizando o driver `pg`.
- [x] Consumir a conexão estritamente via `DATABASE_URL`, sem credenciais hardcoded.

## 4. Segurança e Regra de Isolamento (Tenancy) - *Atenção Agente!*
- [x] Repositórios de widgets e submissões exigem `tenantId` e filtram por tenant diretamente ou via `JOIN` com `widgets`.

---

## 🛑 Critérios de Aceitação (Definition of Done)
Para considerar esta SPEC concluída, o agente deve garantir que:
- [x] O script DDL cria as três tabelas com sucesso no banco de dados.
- [x] As restrições de Foreign Key estão ativas com `ON DELETE CASCADE`.
- [x] A aplicação Node.js conecta ao banco e executa uma query de teste simples.