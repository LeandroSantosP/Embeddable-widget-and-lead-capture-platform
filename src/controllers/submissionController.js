const { z } = require('zod');
const submissionRepository = require('../repositories/submissionRepository');
const geoService = require('../services/geoService');
const notificationService = require('../services/notificationService');

const submissionSchema = z.object({
  widget_id: z.string().uuid(),
  data: z.record(z.unknown())
});

async function create(request, response) {
  const parsed = submissionSchema.safeParse(request.body);
  if (!parsed.success) {
    return response.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
  }

  const containsPassword = Object.keys(parsed.data.data).some((key) => /pass(word|wd)?|senha/i.test(key));
  if (containsPassword) {
    return response.status(400).json({ error: 'Password fields are not accepted by lead forms' });
  }

  if (typeof parsed.data.data.address_line_2 === 'string' && parsed.data.data.address_line_2.trim() !== '') {
    return response.status(400).json({ error: 'Spam submission rejected' });
  }

  const ipAddress = request.ip || request.socket.remoteAddress || 'unknown';
  const geoData = await geoService.enrich(ipAddress);
  const submission = await submissionRepository.createForWidget(parsed.data.widget_id, {
    data: parsed.data.data,
    ipAddress,
    geoData
  });

  if (!submission) return response.status(404).json({ error: 'Widget not found' });

  try {
    await notificationService.notify(submission);
  } catch (error) {
    console.error('Lead notification failed:', error.message);
  }

  return response.status(201).json({ id: submission.id, message: 'Submission received' });
}

module.exports = { create };