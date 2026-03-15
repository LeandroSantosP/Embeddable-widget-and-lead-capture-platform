const express = require('express');
const authenticate = require('../middlewares/auth');
const controller = require('../controllers/widgetController');

const router = express.Router();

router.use('/api/widgets', authenticate);
router.post('/api/widgets', controller.create);
router.get('/api/widgets', controller.list);
router.get('/api/widgets/:id', controller.get);
router.put('/api/widgets/:id', controller.update);
router.delete('/api/widgets/:id', controller.remove);

module.exports = router;