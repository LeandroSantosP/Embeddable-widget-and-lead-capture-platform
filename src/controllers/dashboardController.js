const { z } = require('zod');
const submissionRepository = require('../repositories/submissionRepository');

const widgetIdSchema = z.string().uuid();

function validWidgetId(request, response) {
  const parsed = widgetIdSchema.safeParse(request.params.id);
  if (!parsed.success) {
    response.status(404).json({ error: 'Widget not found' });
    return null;
  }
  return parsed.data;
}

async function listSubmissions(request, response) {
  const widgetId = validWidgetId(request, response);
  if (!widgetId) return;
  const submissions = await submissionRepository.listByWidgetForTenant(widgetId, request.tenantId);
  return response.status(200).json(submissions);
}

async function stats(request, response) {
  const widgetId = validWidgetId(request, response);
  if (!widgetId) return;
  const metrics = await submissionRepository.statsByWidgetForTenant(widgetId, request.tenantId);
  return response.status(200).json({ total_submissions: metrics.total, locations: metrics.locations });
}

module.exports = { listSubmissions, stats };