# SPEC-06: Suíte de Testes Automatizados (E2E & Unitários)

**Status:** [x] Concluído

**Objetivo:** Implementar testes automatizados para cobrir os cenários críticos do sistema (autenticação, isolamento multi-tenant, CORS, payloads inválidos, rate limit e degradação graciosa em falhas de API externa), garantindo que a aplicação passe nos acceptance probes do Capstone[cite: 2].

---

## 1. Configuração do Ambiente de Teste
- [x] Instalar `jest` e `supertest` para simular requisições HTTP na API do Express.
- [x] Configurar o script `npm test` como `jest --runInBand`.
- [x] Usar registros temporarios com identificadores unicos e limpeza automatica para nao corromper dados existentes.

## 2. Testes da Camada de Autenticação e Multi-Tenancy (SPEC-03)
- [x] **Teste de Registro e Login:** tenant registra e recebe token JWT valido.
- [x] **Teste de Rota Protegida:** chamadas sem token ou com token invalido retornam `401 Unauthorized`.
- [x] **Teste de Isolamento Tenant:** Tenant A nao consegue ler, atualizar ou excluir widgets do Tenant B; retorna `404 Not Found`.

## 3. Testes do Caminho de Submissão e Hardened Path (SPEC-05)
- [x] **Teste de Payload Inválido / Oversized:** entradas inválidas retornam `400` e oversized retorna `413`, nunca `500`.
- [x] **Teste de Spam (Honeypot):** submissão com honeypot preenchido é bloqueada sem persistência.
- [x] **Teste de Rate Limiting:** rajada do mesmo IP/widget retorna `429` após cinco submissões.

## 4. Testes de Resiliência e Fallbacks (Obrigatório do Capstone)
- [x] **Teste de Degradação Graciosa (Geo Fallback):** falha do provedor A usa B; falha de ambos retorna `null` e preserva o lead.
- [x] **Teste de Efeito Colateral Seguro (Side Effect):** erro forçado na notificação mantém a submissão em `201`.

---

## 🛑 Critérios de Aceitação (Definition of Done)
Para considerar esta SPEC concluída, o agente deve garantir que:
- [x] `npm test` executa com sucesso: 2 suítes e 11 testes aprovados.
- [x] `EVIDENCE.md` registra os cenários de falha externa sem quebrar o fluxo principal.