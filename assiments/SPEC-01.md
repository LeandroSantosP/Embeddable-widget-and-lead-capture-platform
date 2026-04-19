# SPEC-01: Setup Inicial e Infraestrutura Base

**Status:** [x] Concluído

**Objetivo:** Estabelecer a fundação do projeto Node.js, configurar o banco de dados PostgreSQL via Docker, estruturar a arquitetura de pastas e garantir as regras de segurança para variáveis de ambiente.

## 1. Inicialização e Dependências

- [x] Inicializar o projeto Node.js e criar o `package.json`.
- [x] Instalar as dependências principais: `express`, `pg`, `dotenv`, `cors`, `zod`.
- [x] Instalar as dependências de desenvolvimento: `nodemon` e `jest`.
- [x] Criar a estrutura de diretórios em `src/`: `config`, `controllers`, `middlewares`, `routes` e `services`.
- [x] Criar `src/server.js` como ponto de entrada da aplicação.

## 2. Infraestrutura de Banco de Dados (Docker)

- [x] Criar `docker-compose.yml` na raiz com PostgreSQL `16-alpine`.
- [x] Configurar usuário, senha, banco, volume persistente e expor a porta `5432`.
- [x] Validar a configuração com `docker compose config`.
- [x] Executar `docker compose up` e confirmar que o PostgreSQL aceita conexões.

## 3. Segurança e Variáveis de Ambiente

- [x] Criar `.gitignore` com `.env` e `node_modules/` ignorados.
- [x] Criar `.env.example` com valores de placeholder seguros.
- [x] Criar `.env` local para desenvolvimento.
- [x] Confirmar via `git status --ignored` que `.env` não é rastreado.

## 4. Servidor e Health Check

- [x] Configurar o Express em `src/server.js`.
- [x] Adicionar o middleware global `express.json()`.
- [x] Criar `GET /health`, retornando HTTP 200 e `{ "status": "ok" }`.
- [x] Adicionar o script `npm run dev` com nodemon.

## Critérios de Aceitação

- [x] `docker compose up` inicializa o banco de dados com sucesso neste host.
- [x] `npm run dev` sobe o servidor na porta `3000` sem erros.
- [x] `git status --ignored` comprova que `.env` não está sendo rastreado.
