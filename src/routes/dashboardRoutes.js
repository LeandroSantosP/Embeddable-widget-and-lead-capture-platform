const express = require('express');
const authenticate = require('../middlewares/auth');
const controller = require('../controllers/dashboardController');

const router = express.Router();

router.get('/api/widgets/:id/submissions', authenticate, controller.listSubmissions);
router.get('/api/widgets/:id/stats', authenticate, controller.stats);

module.exports = router;