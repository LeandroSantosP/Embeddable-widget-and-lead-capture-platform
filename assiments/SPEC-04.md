# SPEC-04: Widget Delivery e Teste no Site do Cliente (Front-end)

**Status:** [x] Concluído

**Objetivo:** Servir o script do widget (`widget.js`), expor a configuração pública do formulário e criar um ambiente de teste (site do cliente) em uma origem (porta) diferente para validar o comportamento real e as regras de CORS[cite: 2].

---

## 1. Endpoints Públicos de Entrega (Delivery)
- [x] **Script do Widget (`GET /widget.js`):**
  - Servir um arquivo JavaScript estático ou gerado dinamicamente.
  - Adicionar cabeçalhos de cache apropriados (`Cache-Control`)[cite: 2].
  - O script deve ler o parâmetro `id` da URL de onde foi importado (ex: `?id=123`).
- [x] **Configuração do Widget (`GET /api/widgets/:id/config`):**
  - Endpoint **público** (sem necessidade de token JWT).
  - Retornar apenas dados seguros do widget (título, tipo, configuração visual/campos).
  - **Requisito Crítico:** Habilitar CORS neste endpoint para permitir chamadas de qualquer origem (`*`)[cite: 2].

## 2. O Motor do Widget (Lógica do `widget.js`)
- [x] O arquivo JavaScript servido pela API deve:
  - Fazer um `fetch` para `/api/widgets/:id/config` para obter os dados.
  - Criar elementos no DOM dinamicamente (ex: uma `<div id="flyrank-widget">`, um formulário, campos de input e botão de submit) com base na configuração recebida.
  - Injetar esse HTML na página do cliente.
  - Adicionar um *event listener* no formulário para interceptar o `submit`, prevenir o comportamento padrão (`e.preventDefault()`) e preparar o envio via `fetch` para a futura rota `POST /api/submissions`.

## 3. Ambiente de Teste (O Site do Cliente)
- [x] Criar uma pasta `test-site/` (fora do fluxo principal da API) contendo um arquivo `index.html` básico.
- [x] Colar a tag gerada na SPEC-03 dentro do `<body>` deste HTML:
  ```html
  <script src="http://localhost:3000/widget.js?id=<ID_DE_UM_WIDGET_REAL>"></script>