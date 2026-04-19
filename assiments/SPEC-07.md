# SPEC-07: Dashboard API (Analytics) & Submission Pack Final

**Status:** [x] Concluído

**Objetivo:** Construir os endpoints autenticados da dashboard para consulta de leads e estatísticas, além de preparar todos os arquivos obrigatórios de documentação, evidências e manifestos para submissão do Capstone[cite: 2].

---

## 1. Endpoints da Dashboard (Autenticados)
- [x] **Listar Submissões por Widget (`GET /api/widgets/:id/submissions`):**
  - Rota protegida pelo middleware de autenticação JWT[cite: 2].
  - Garantir o isolamento multi-tenant: o cliente só pode ver as submissões se o widget pertencer a ele (`tenant_id`)[cite: 2].
  - Suportar paginação básica ou ordenação decrescente (leads mais recentes primeiro).
- [x] **Estatísticas e Métricas (`GET /api/widgets/:id/stats`):**
  - Retornar contagem total de submissões.
  - Agregação simples por data ou quebra por geolocalização (país/cidade obtidos na Fase 4)[cite: 2].

## 2. Geração do Submission Pack (Documentação e Evidências)
Criar e preencher os arquivos obrigatórios na raiz do repositório exigidos pelo FlyRank[cite: 2]:
- [x] **`capstone.yaml`:** Manifesto com execução, teste, seed e URLs base.
- [x] **`EVIDENCE.md`:** Evidências dos critérios de aceitação.
- [x] **`BUILDLOG.md`:** Registro honesto do uso de IA e dos ajustes realizados.
- [x] **`.env.example`:** Template com valores fictícios e seguros.
- [x] **`README.md`:** Diagrama, setup, endpoints e limitações documentados.

---

## 🛑 Critérios de Aceitação (Definition of Done)
Para considerar esta SPEC concluída (e o Capstone pronto para envio), o agente deve garantir que:
- [x] O dono do widget acessa submissões e estatísticas autenticadas; outro tenant não acessa os leads.
- [x] Todos os arquivos do Submission Pack estão presentes na raiz.
- [x] O setup e `npm test` estão documentados para um avaliador externo.