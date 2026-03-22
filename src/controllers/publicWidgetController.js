const { z } = require('zod');
const widgetRepository = require('../repositories/widgetRepository');

const widgetIdSchema = z.string().uuid();

async function getConfig(request, response) {
  const parsedId = widgetIdSchema.safeParse(request.params.id);
  if (!parsedId.success) return response.status(404).json({ error: 'Widget not found' });

  const widget = await widgetRepository.findPublicById(parsedId.data);
  if (!widget) return response.status(404).json({ error: 'Widget not found' });

  response.set('Cache-Control', 'public, max-age=60');
  return response.status(200).json({
    id: widget.id,
    title: widget.title,
    type: widget.type,
    settings: widget.settings
  });
}

function serveScript(_request, response) {
  response.set('Cache-Control', 'public, max-age=300');
  return response.sendFile('widget.js', { root: require('path').resolve(__dirname, '../public') });
}

module.exports = { getConfig, serveScript };