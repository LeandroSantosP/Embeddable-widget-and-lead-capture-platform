(function loadFlyRankWidget() {
  const script = document.currentScript;
  if (!script) return;

  const scriptUrl = new URL(script.src, window.location.href);
  const widgetId = scriptUrl.searchParams.get('id');
  const apiOrigin = scriptUrl.origin;
  const container = document.createElement('div');
  container.id = 'flyrank-widget';
  (script.parentElement || document.body).appendChild(container);

  if (!widgetId) {
    container.textContent = 'Widget configuration is missing.';
    return;
  }

  fetch(`${apiOrigin}/api/widgets/${encodeURIComponent(widgetId)}/config`)
    .then((response) => {
      if (!response.ok) throw new Error('Unable to load widget configuration.');
      return response.json();
    })
    .then((config) => renderWidget(container, config, apiOrigin))
    .catch(() => {
      container.textContent = 'This widget is temporarily unavailable.';
    });
})();

function renderWidget(container, config, apiOrigin) {
  const settings = config.settings || {};
  const fields = Array.isArray(settings.fields) && settings.fields.length > 0
    ? settings.fields
    : [
        { name: 'name', label: 'Name', type: 'text' },
        { name: 'email', label: 'Email', type: 'email' }
      ];
  const form = document.createElement('form');
  const title = document.createElement('h2');
  title.textContent = config.title;
  form.appendChild(title);

  fields.forEach((field) => {
    if (!field || typeof field.name !== 'string') return;
    const label = document.createElement('label');
    label.textContent = typeof field.label === 'string' ? field.label : field.name;
    const input = document.createElement('input');
    input.name = field.name;
    input.type = ['email', 'number', 'tel', 'url'].includes(field.type) ? field.type : 'text';
    input.required = field.required !== false;
    label.appendChild(input);
    form.appendChild(label);
  });

  const honeypot = document.createElement('input');
  honeypot.name = 'address_line_2';
  honeypot.type = 'text';
  honeypot.tabIndex = -1;
  honeypot.autocomplete = 'off';
  honeypot.setAttribute('aria-hidden', 'true');
  honeypot.style.position = 'absolute';
  honeypot.style.left = '-9999px';
  form.appendChild(honeypot);

  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.textContent = settings.buttonText || 'Submit';
  form.appendChild(submit);

  const status = document.createElement('p');
  status.setAttribute('role', 'status');
  form.appendChild(status);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    status.textContent = 'Sending...';
    fetch(`${apiOrigin}/api/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ widget_id: config.id, data })
    })
      .then((response) => {
        if (!response.ok) throw new Error('Submission failed.');
        status.textContent = 'Thanks for reaching out.';
        form.reset();
      })
      .catch(() => {
        status.textContent = 'Unable to send your message right now.';
      });
  });
  container.replaceChildren(form);
}