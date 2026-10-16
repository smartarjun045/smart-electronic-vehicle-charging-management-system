import swaggerJSDoc from 'swagger-jsdoc';

export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Smart Electronic Vehicle Charging Management System API',
      version: '1.0.0',
      description:
        'Smart Electronic Vehicle Charging Management System — REST API. ' +
        'See docs/API.md in the repository for the full endpoint reference; ' +
        'this Swagger UI documents the same routes for interactive exploration.',
    },
    servers: [{ url: '/api', description: 'API base path' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [],
});
