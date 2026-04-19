const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'FlyRank Capstone API',
      version: '1.0.0',
      description: 'Embeddable widgets and lead capture platform API.'
    },
    servers: [{ url: 'http://localhost:3000', description: 'Local server' }],
    tags: [
      { name: 'Health', description: 'Service health' },
      { name: 'Authentication', description: 'Tenant registration and login' },
      { name: 'Widgets', description: 'Authenticated widget management' },
      { name: 'Delivery', description: 'Public widget delivery' },
      { name: 'Submissions', description: 'Public lead capture' },
      { name: 'Dashboard', description: 'Authenticated lead analytics' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
      },
      schemas: {
        CredentialsInput: {
          type: 'object', required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'owner@example.com' },
            password: { type: 'string', format: 'password', minLength: 8, example: 'password-123' }
          }
        },
        WidgetInput: {
          type: 'object', required: ['title', 'type'],
          properties: {
            title: { type: 'string', example: 'Website lead form' },
            type: { type: 'string', enum: ['signup', 'popover'], example: 'signup' },
            settings: { type: 'object', additionalProperties: true, example: { buttonText: 'Send' } }
          }
        },
        Widget: {
          allOf: [{ $ref: '#/components/schemas/WidgetInput' }, {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              tenant_id: { type: 'string', format: 'uuid' },
              created_at: { type: 'string', format: 'date-time' },
              embed_snippet: { type: 'string' }
            }
          }]
        },
        SubmissionInput: {
          type: 'object', required: ['widget_id', 'data'],
          properties: {
            widget_id: { type: 'string', format: 'uuid' },
            data: { type: 'object', additionalProperties: true, example: { name: 'Visitor', email: 'visitor@example.com' } }
          }
        },
        Error: {
          type: 'object', properties: {
            error: { type: 'string' }, details: { type: 'array', items: { type: 'object' } }
          }
        }
      }
    }
  },
  apis: []
};

options.definition.paths = {
  '/health': {
    get: { tags: ['Health'], summary: 'Health check', responses: { 200: { description: 'Service is healthy' } } }
  },
  '/api/auth/register': {
    post: {
      tags: ['Authentication'], summary: 'Register a tenant', requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CredentialsInput' } } } },
      responses: { 201: { description: 'Tenant created' }, 400: { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }, 409: { description: 'Email already registered' } }
    }
  },
  '/api/auth/login': {
    post: {
      tags: ['Authentication'], summary: 'Login a tenant', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email', 'password'], properties: { email: { type: 'string', format: 'email' }, password: { type: 'string', format: 'password' } } } } } },
      responses: { 200: { description: 'JWT returned' }, 401: { description: 'Invalid credentials' } }
    }
  },
  '/widget.js': {
    get: { tags: ['Delivery'], summary: 'Get the embeddable widget script', responses: { 200: { description: 'JavaScript widget' } } }
  },
  '/api/widgets/{id}/config': {
    get: { tags: ['Delivery'], summary: 'Get safe public widget configuration', parameters: [{ $ref: '#/components/parameters/widgetId' }], responses: { 200: { description: 'Public configuration' }, 404: { description: 'Widget not found' } } }
  },
  '/api/submissions': {
    options: { tags: ['Submissions'], summary: 'CORS preflight', responses: { 204: { description: 'Preflight accepted' } } },
    post: { tags: ['Submissions'], summary: 'Capture a lead', requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/SubmissionInput' } } } }, responses: { 201: { description: 'Submission received' }, 400: { description: 'Invalid or spam submission' }, 413: { description: 'Payload too large' }, 429: { description: 'Rate limit exceeded' } } }
  },
  '/api/widgets': {
    get: { tags: ['Widgets'], security: [{ bearerAuth: [] }], summary: 'List owned widgets', responses: { 200: { description: 'Widget list' }, 401: { description: 'Authentication required' } } },
    post: { tags: ['Widgets'], security: [{ bearerAuth: [] }], summary: 'Create a widget', requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/WidgetInput' } } } }, responses: { 201: { description: 'Widget created' }, 400: { description: 'Validation failed' }, 401: { description: 'Authentication required' } } }
  },
  '/api/widgets/{id}': {
    parameters: [{ $ref: '#/components/parameters/widgetId' }],
    get: { tags: ['Widgets'], security: [{ bearerAuth: [] }], summary: 'Get an owned widget', responses: { 200: { description: 'Widget found' }, 401: { description: 'Authentication required' }, 404: { description: 'Widget not found' } } },
    put: { tags: ['Widgets'], security: [{ bearerAuth: [] }], summary: 'Update an owned widget', requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/WidgetInput' } } } }, responses: { 200: { description: 'Widget updated' }, 400: { description: 'Validation failed' }, 404: { description: 'Widget not found' } } },
    delete: { tags: ['Widgets'], security: [{ bearerAuth: [] }], summary: 'Delete an owned widget', responses: { 204: { description: 'Widget deleted' }, 404: { description: 'Widget not found' } } }
  },
  '/api/widgets/{id}/submissions': {
    get: { tags: ['Dashboard'], security: [{ bearerAuth: [] }], summary: 'List widget submissions', parameters: [{ $ref: '#/components/parameters/widgetId' }], responses: { 200: { description: 'Submission list' }, 401: { description: 'Authentication required' } } }
  },
  '/api/widgets/{id}/stats': {
    get: { tags: ['Dashboard'], security: [{ bearerAuth: [] }], summary: 'Get widget statistics', parameters: [{ $ref: '#/components/parameters/widgetId' }], responses: { 200: { description: 'Submission count and locations' }, 401: { description: 'Authentication required' } } }
  }
};

options.definition.components.parameters = {
  widgetId: { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'Widget UUID' }
};

module.exports = swaggerJsdoc(options);