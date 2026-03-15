const { z } = require('zod');
const widgetRepository = require('../repositories/widgetRepository');

const widgetSchema = z.object({
  title: z.string().trim().min(1).max(255),
  type: z.enum(['signup', 'popover']),
  settings: z.record(z.unknown()).default({})
});

const updateWidgetSchema = widgetSchema.partial();

function validationError(response, error) {
  return response.status(400).json({ error: 'Validation failed', details: error.issues });
}

function withSnippet(widget) {
  return { ...widget, embed_snippet: `<script src="http://localhost:3000/widget.js?id=${widget.id}"></script>` };
}

async function create(request, response) {
  const parsed = widgetSchema.safeParse(request.body);
  if (!parsed.success) return validationError(response, parsed.error);
  const widget = await widgetRepository.createForTenant(request.tenantId, parsed.data);
  return response.status(201).json(withSnippet(widget));
}

async function list(request, response) {
  const widgets = await widgetRepository.listByTenant(request.tenantId);
  return response.status(200).json(widgets.map(withSnippet));
}

async function get(request, response) {
  const widget = await widgetRepository.findByIdForTenant(request.params.id, request.tenantId);
  if (!widget) return response.status(404).json({ error: 'Widget not found' });
  return response.status(200).json(withSnippet(widget));
}

async function update(request, response) {
  const parsed = updateWidgetSchema.safeParse(request.body);
  if (!parsed.success) return validationError(response, parsed.error);
  const widget = await widgetRepository.updateForTenant(request.params.id, request.tenantId, parsed.data);
  if (!widget) return response.status(404).json({ error: 'Widget not found' });
  return response.status(200).json(withSnippet(widget));
}

async function remove(request, response) {
  const deleted = await widgetRepository.deleteForTenant(request.params.id, request.tenantId);
  if (!deleted) return response.status(404).json({ error: 'Widget not found' });
  return response.status(204).send();
}

module.exports = { create, list, get, update, remove };