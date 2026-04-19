# SPEC-03: Autenticação e Gestão de Widgets (CRUD)

**Status:** [x] Concluído

**Objetivo:** Implementar a autenticação de Tenants via JWT e construir a API de gerenciamento de widgets com validação rigorosa de entrada e isolamento multi-tenant garantido[cite: 2].

---

## 1. Autenticação (Tenant Management)
- [x] Instalar `bcryptjs` para hash de senhas e `jsonwebtoken` para geração de tokens.
- [x] Criar o endpoint `POST /api/auth/register`:
  - Receber `email` e `password`, validar o formato usando Zod.
  - Fazer o hash da senha antes de salvar na tabela `tenants`.
- [x] Criar o endpoint `POST /api/auth/login`:
  - Validar credenciais e retornar um token JWT com expiração (ex: 24h).
  - O payload do JWT deve conter o `id` do tenant.
- [x] Criar o **Middleware de Autenticação** (`src/middlewares/auth.js`):
  - Interceptar requisições, verificar o header `Authorization: Bearer <token>`.
  - Se inválido/ausente, retornar `401 Unauthorized`[cite: 2].
  - Se válido, injetar o ID do tenant no objeto da requisição (ex: `req.tenantId = decoded.id`) e chamar `next()`.

## 2. API de Gerenciamento de Widgets (CRUD Autenticado)
Todas as rotas abaixo devem ser protegidas pelo middleware de autenticação e injetar o `tenant_id` garantindo o isolamento[cite: 2].

- [x] **Criar Widget (`POST /api/widgets`):**
  - Validar payload com Zod (ex: `title` string, `type` enum ['signup', 'popover', etc], `settings` object).
  - Inserir no banco associando obrigatoriamente ao `req.tenantId`[cite: 2].
- [x] **Listar Widgets (`GET /api/widgets`):**
  - Retornar apenas os widgets onde `tenant_id = req.tenantId`[cite: 2].
- [x] **Obter Widget Específico (`GET /api/widgets/:id`):**
  - Buscar pelo ID **E** pelo `tenant_id`. Se não encontrar ou pertencer a outro, retornar `404 Not Found`.
- [x] **Atualizar Widget (`PUT /api/widgets/:id`):**
  - Validar payload parcial com Zod.
  - Atualizar apenas se o widget pertencer ao `req.tenantId`[cite: 2].
- [x] **Deletar Widget (`DELETE /api/widgets/:id`):**
  - Excluir do banco apenas se pertencer ao `req.tenantId`[cite: 2].

## 3. Geração do Snippet de Incorporação
- [x] Ao retornar os dados de um widget, incluir o campo virtual `embed_snippet`.
  - Formato esperado: `<script src="http://localhost:3000/widget.js?id=<WIDGET_ID>"></script>`[cite: 2].

---

## 🛑 Critérios de Aceitação (Definition of Done)
Para considerar esta SPEC concluída, o agente deve garantir que:
- [x] Requisições para `/api/widgets` sem token ou com token inválido são rejeitadas com `401`.
- [x] O isolamento multi-tenant foi provado com leitura, atualização e exclusão retornando `404` para outro tenant.
- [x] O snippet `<script>` é gerado corretamente por widget.
- [x] Payload inválido retorna `400 Bad Request` detalhado pelo Zod.