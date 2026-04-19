# FlyRank Capstone: Embeddable Widget & Lead-Capture Platform

Plataforma SaaS multi-tenant para criação de widgets de captura de leads e incorporação em sites externos usando apenas uma tag `<script>`. O backend usa Node.js, Express e PostgreSQL, com foco em CORS, validação de fronteira, isolamento por tenant, proteção contra abuso e resiliência em integrações externas.

## Arquitetura do Sistema

```text
[ Widget Owner ]
  |
  | JWT / Bearer
  v
+-------------------------+       +-------------------------+
| Widget Management API   | ----> | PostgreSQL Database     |
| Auth + CRUD + Dashboard |       | tenants                 |
+-------------------------+       | widgets                 |
              | submissions             |
              +-------------------------+

[ Customer Website :8080 ]
  |
  | GET /widget.js
  | GET /api/widgets/:id/config (CORS + cache)
  v
+-------------------------+
| Public Widget Delivery  |       Express API :3000
+-------------------------+
  |
  | POST /api/submissions
  | Zod + honeypot + rate limit
  | Geo fallback + safe notification
  v
    [ Lead saved in PostgreSQL ]
```

## Como Executar

### Pre-requisitos

- Node.js 22 ou superior
- npm
- Docker e Docker Compose

### Setup

```sh
npm install
cp .env.example .env
docker compose up -d
npm run dev
```

A API estará disponível em `http://localhost:3000`.

Para executar os testes automatizados:

```sh
npm test
```

Para abrir o site cliente em outra origem:

```sh
npx serve test-site -l 8080
```

O ID do widget usado no site está em `test-site/index.html`. Para criar um novo widget, use o Postman e substitua o ID pelo valor retornado.

## Swagger / OpenAPI

A documentação interativa está disponível em:

`http://localhost:3000/api-docs/`

O documento descreve autenticação, widgets, delivery público, submissões e dashboard. A especificação está centralizada em `src/config/swagger.js`.

## Endpoints da API

### Health e documentação

- `GET /health` - verifica se a API está disponível.
- `GET /api-docs/` - abre a interface Swagger UI.

### Autenticação

- `POST /api/auth/register` - registra um tenant e armazena a senha com hash.
- `POST /api/auth/login` - retorna um JWT com validade de 24 horas.

### Gestão de widgets autenticada

Envie `Authorization: Bearer <token>` nas rotas abaixo:

- `POST /api/widgets` - cria um widget.
- `GET /api/widgets` - lista os widgets do tenant autenticado.
- `GET /api/widgets/:id` - consulta um widget do tenant autenticado.
- `PUT /api/widgets/:id` - atualiza um widget do tenant autenticado.
- `DELETE /api/widgets/:id` - remove um widget do tenant autenticado.

As respostas de widget incluem `embed_snippet`.

### Delivery público

- `GET /widget.js` - entrega o script incorporável com cache público.
- `GET /api/widgets/:id/config` - entrega somente a configuração pública do widget.

### Submissão pública

- `OPTIONS /api/submissions` - responde ao preflight CORS.
- `POST /api/submissions` - recebe um lead, valida o payload, bloqueia honeypot, aplica rate limit, tenta geolocalização e salva a submissão.

### Dashboard autenticada

Envie `Authorization: Bearer <token>`:

- `GET /api/widgets/:id/submissions` - lista os leads do widget, do mais recente para o mais antigo.
- `GET /api/widgets/:id/stats` - retorna a contagem total e agregações por país/cidade.

## Segurança e Resiliência

- Isolamento multi-tenant aplicado nas queries de widgets e submissions.
- CORS configurado para permitir a incorporação pública do widget.
- Payloads JSON limitados a 16 KB; corpos inválidos retornam erros `4xx`.
- Rate limit padrão de cinco submissões por minuto por IP/widget.
- Honeypot `address_line_2` bloqueia bots sem persistir o lead.
- Geolocalização tenta `ip-api.com` e depois `ipapi.co`.
- Falhas de ambos os provedores salvam o lead com `geo_data` nulo.
- Falhas da notificação mockada não alteram o sucesso da submissão.
- Campos com aparência de senha são rejeitados no endpoint público.

## Postman

Importe [postman/FlyRank-Capstone.postman_collection.json](postman/FlyRank-Capstone.postman_collection.json). Execute `Register tenant`, `Login tenant` e `Create signup widget`; as variáveis `token` e `widgetId` serão preenchidas automaticamente. A collection também inclui delivery, submissions, dashboard, validações, honeypot, oversized e Swagger.

## Banco de Dados e Configuração

O PostgreSQL é executado pelo Docker Compose na porta `5432`. Em um volume novo, o arquivo `src/database/init.sql` cria `tenants`, `widgets`, `submissions`, as chaves estrangeiras e os índices.

Copie `.env.example` para `.env`. O arquivo `.env` está no `.gitignore` e não deve ser commitado. A conexão da aplicação usa exclusivamente `DATABASE_URL`.

## Evidências e Histórico

- [EVIDENCE.md](EVIDENCE.md) registra os resultados dos testes e probes.
- [BUILDLOG.md](BUILDLOG.md) registra o uso de IA, falhas encontradas e correções.
- [capstone.yaml](capstone.yaml) contém os comandos de execução, teste, seed e URLs base.

## Limitações Conhecidas

- A notificação é um mock via `console.log`; nenhum provedor real de email ou webhook está configurado.
- Os provedores de geolocalização são serviços públicos gratuitos e podem sofrer timeout ou rate limit.
- O rate limiter usa memória local e deve ser substituído por um store compartilhado em múltiplas instâncias.
- O site cliente usa portas locais diferentes (`8080` e `3000`) para simular origens cruzadas; não há CDN externa neste ambiente.
