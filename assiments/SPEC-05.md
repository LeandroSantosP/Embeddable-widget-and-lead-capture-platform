# SPEC-05: The Hardened Submission Path (Seguranca, Enriquecimento e Resiliencia)

**Status:** [x] Concluido

**Objetivo:** Implementar o fluxo completo e seguro do `POST /api/submissions`, garantindo validacao extrema, bloqueio de bots/spam, limitacao de taxa e uma cadeia de requisicoes externas resiliente.

## 1. Validacao de Fronteira e CORS

- [x] `POST /api/submissions` aceita requisicoes cross-origin.
- [x] `OPTIONS /api/submissions` responde preflight corretamente.
- [x] Payloads sao validados com Zod.
- [x] JSON malformado retorna `400` e payload acima de `16kb` retorna `413`.
- [x] Inputs invalidos nao causam erro `500`.

## 2. Protecao contra Abuso

- [x] `express-rate-limit` limita por IP/widget, com maximo configuravel de 5 requisicoes por minuto.
- [x] Flood retorna `429 Too Many Requests`.
- [x] O widget inclui o campo honeypot oculto `address_line_2`.
- [x] Honeypot preenchido retorna `400` sem salvar o lead.

## 3. Enriquecimento de Dados

- [x] O IP do visitante e extraido da requisicao.
- [x] A API tenta primeiro `ip-api.com`.
- [x] Em caso de falha ou timeout, tenta `ipapi.co`.
- [x] Se ambos falharem, salva o lead com `geo_data` nulo.

## 4. Efeitos Colaterais Seguros

- [x] Apos salvar, dispara notificacao mockada via `console.log`.
- [x] Falha na notificacao e capturada e nao altera o sucesso da submissao.

## 5. Armazenamento

- [x] Payload validado, IP e dados geograficos sao persistidos em `submissions`.
- [x] Submissoes sao associadas ao `widget_id` correspondente.
- [x] Campos de senha sao rejeitados para evitar captura de credenciais.

## Criterios de Aceitacao

- [x] Payload invalido retorna erro JSON `400`.
- [x] Submissoes repetidas ativam `429`.
- [x] Honeypot bloqueia a insercao do lead.
- [x] Falha simulada nos dois provedores de Geo salva o lead com `geo_data` nulo.
- [x] Falha simulada na notificacao mantem o endpoint em `201 Success`.
