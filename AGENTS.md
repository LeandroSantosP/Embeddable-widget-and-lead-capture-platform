# Contexto do Projeto: Embeddable Widget & Lead-Capture Platform (FlyRank Capstone)

## 1. Visão Geral da Missão
O objetivo deste projeto é construir uma plataforma SaaS onde clientes podem criar widgets (formulários de contato, captura de leads, popovers) e incorporá-los em qualquer site utilizando apenas uma tag `<script>`.
A aplicação receberá requisições diretamente de navegadores na internet pública (sites de terceiros), o que exige forte segurança, tratamento de CORS, proteção contra abusos e validação rigorosa de dados.

## 2. Stack Tecnológica
- **Backend:** Node.js com Express.
- **Banco de Dados:** PostgreSQL (via Docker) para persistência real e isolamento multi-tenant.
- **Validação:** Zod (para schema de entrada).
- **Integrações Externas (Enrichment):** APIs de geolocalização (ip-api.com e ipapi.co).
- **Ambiente de Teste:** Um arquivo HTML puro rodando em uma porta diferente (ex: via `npx serve`) para simular o site do cliente e testar o CORS.

## 3. Arquitetura e Fases de Construção

### Fase 1: Widget Management API (Autenticada)
- Endpoints CRUD para o cliente criar e gerenciar seus widgets.
- **Isolamento Multi-tenant:** Um cliente (tenant A) nunca pode ver ou alterar dados do tenant B.
- Geração automática do snippet de incorporação (ex: `<script src="http://localhost:3000/widget.js?id=123"></script>`).

### Fase 2: Widget Delivery (Público & Otimizado)
- O script do widget e suas configurações devem ser servidos via endpoints públicos.
- Implementar cabeçalhos de cache HTTP corretos (`Cache-Control`) para respostas rápidas, simulando o comportamento de uma CDN.

### Fase 3: Public Submission Endpoint (O Desafio Principal)
- Rota que recebe os dados submetidos pelo visitante no site do cliente.
- **CORS:** Deve aceitar requisições *cross-origin* e responder corretamente a requisições de *preflight* (`OPTIONS`).
- **Validação de Fronteira:** Rejeitar payloads malformados ou muito grandes com erros `4xx` limpos (nunca retornar erro `500` por erro do usuário).

### Fase 4: Proteção, Enriquecimento e Efeitos Colaterais (Side Effects)
- **Rate Limiting:** Limitar requisições por IP/Widget (Status `429`) para evitar floods.
- **Spam Control:** Implementar um *honeypot* (campo invisível) ou heurística para barrar bots.
- **Enriquecimento (Fallback Chain):** Capturar o IP do visitante e buscar dados de geolocalização. Se o provedor A falhar, tentar o provedor B. Se ambos falharem, salvar o lead sem os dados de geo (degradação graciosa, nunca quebrar o fluxo principal).
- **Efeitos Colaterais:** Disparar um webhook ou e-mail (mockado). Se essa ação falhar, a submissão do formulário ainda deve retornar sucesso.

### Fase 5: Dashboard API
- Endpoints autenticados para o dono do widget visualizar os leads recebidos e estatísticas básicas (ex: contagem de envios, localização geográfica).

## 4. Regras Rígidas (Non-negotiables)
1. **Zero Custos:** Não utilizar nenhum serviço pago. Tudo deve rodar localmente ou em tiers gratuitos sem cartão de crédito.
2. **Segurança de Chaves:** NUNCA commitar chaves de API, senhas ou arquivos `.env`. Manter apenas um `.env.example`.
3. **Resiliência:** Uma falha em um serviço externo (e-mail ou API de geo) não pode impedir o salvamento do lead no banco de dados.
4. **Evidências (Definition of Done):** O projeto exige arquivos de comprovação (`EVIDENCE.md` com logs e resultados de testes) e um `README.md` claro que permita rodar o sistema com apenas um comando (ex: `docker compose up`).

## 5. Instruções para o Agente IA (Opencode)
- Escreva código defensivo: assuma que toda entrada pública é maliciosa.
- Ao configurar o CORS, seja explícito nas origens permitidas ou no tratamento de origens dinâmicas, e garanta que o preflight funcione.
- Ao implementar o envio (submission), separe a lógica de negócios da rota HTTP.
- Estruture testes automatizados ou scripts para validar os casos críticos: falha na API de Geo, envio de spam no honeypot e estouro do rate limit.