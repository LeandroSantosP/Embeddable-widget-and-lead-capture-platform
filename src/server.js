const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const widgetRoutes = require('./routes/widgetRoutes');
const publicWidgetRoutes = require('./routes/publicWidgetRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./config/swagger');

const app = express();

app.use(cors());
app.use(express.json({ limit: '16kb' }));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(healthRoutes);
app.use(authRoutes);
app.use(publicWidgetRoutes);
app.use(dashboardRoutes);
app.use(widgetRoutes);

app.use((error, _request, response, _next) => {
  if (error && error.type === 'entity.too.large') {
    return response.status(413).json({ error: 'Request body too large' });
  }
  if (error instanceof SyntaxError && error.status === 400 && error.type === 'entity.parse.failed') {
    return response.status(400).json({ error: 'Malformed JSON body' });
  }
  return response.status(500).json({ error: 'Internal server error' });
});

if (require.main === module) {
  app.listen(env.PORT, () => {
    console.log(`Server listening on port ${env.PORT}`);
  });
}

module.exports = app;