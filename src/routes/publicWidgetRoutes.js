const express = require('express');
const cors = require('cors');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const env = require('../config/env');
const controller = require('../controllers/publicWidgetController');
const submissionController = require('../controllers/submissionController');

const router = express.Router();
const submissionRateLimit = rateLimit({
	windowMs: env.SUBMISSION_RATE_LIMIT_WINDOW_MS,
	limit: env.SUBMISSION_RATE_LIMIT_MAX,
	standardHeaders: 'draft-7',
	legacyHeaders: false,
	keyGenerator: (request) => `${ipKeyGenerator(request.ip)}:${request.body && request.body.widget_id || 'unknown'}`
});

router.get('/widget.js', controller.serveScript);
router.get('/api/widgets/:id/config', cors({ origin: '*' }), controller.getConfig);
router.options('/api/submissions', cors({ origin: '*' }));
router.post('/api/submissions', cors({ origin: '*' }), submissionRateLimit, submissionController.create);

module.exports = router;