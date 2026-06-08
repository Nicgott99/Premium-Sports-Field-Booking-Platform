/**
 * API documentation generator
 * Generates comprehensive API documentation from route definitions
 */

/**
 * Define API endpoint documentation
 */
export const endpoints = {
  auth: [
    {
      method: 'POST',
      path: '/api/v1/auth/register',
      name: 'Register User',
      description: 'Create a new user account with email and password',
      requiresAuth: false,
      rateLimit: '3 per hour',
      requestBody: {
        firstName: { type: 'string', required: true, example: 'John' },
        lastName: { type: 'string', required: true, example: 'Doe' },
        email: { type: 'string', required: true, example: 'john@example.com' },
        phone: { type: 'string', required: true, example: '+8801712345678' },
        password: { type: 'string', required: true, example: 'SecurePass123' },
      },
      response: {
        success: true,
        data: { token: 'jwt_token', user: { id: 'user_id', email: 'user@example.com' } },
        message: 'User registered successfully',
      },
    },
    {
      method: 'POST',
      path: '/api/v1/auth/login',
      name: 'Login User',
      description: 'Authenticate user with email and password',
      requiresAuth: false,
      rateLimit: '5 per 15 minutes',
      requestBody: {
        email: { type: 'string', required: true, example: 'john@example.com' },
        password: { type: 'string', required: true, example: 'SecurePass123' },
      },
      response: {
        success: true,
        data: { token: 'jwt_token', user: { id: 'user_id', email: 'john@example.com' } },
        message: 'Login successful',
      },
    },
  ],
  fields: [
    {
      method: 'GET',
      path: '/api/v1/fields',
      name: 'List Fields',
      description: 'Get all available sports fields with pagination and filters',
      requiresAuth: false,
      rateLimit: '60 per minute',
      queryParams: {
        page: { type: 'number', default: 1, example: 1 },
        limit: { type: 'number', default: 10, example: 10 },
        sport: { type: 'string', example: 'football' },
        location: { type: 'string', example: 'Dhaka' },
      },
      response: {
        success: true,
        data: [{ id: 'field_id', name: 'Field Name', sport: 'football', location: 'Dhaka' }],
        meta: { total: 100, page: 1, limit: 10, totalPages: 10 },
      },
    },
    {
      method: 'GET',
      path: '/api/v1/fields/:id',
      name: 'Get Field Details',
      description: 'Get detailed information about a specific field',
      requiresAuth: false,
      rateLimit: '100 per minute',
      pathParams: {
        id: { type: 'string', required: true, example: 'field_123' },
      },
      response: {
        success: true,
        data: { id: 'field_id', name: 'Field Name', description: '...' },
      },
    },
    {
      method: 'POST',
      path: '/api/v1/fields',
      name: 'Create Field',
      description: 'Create a new sports field listing',
      requiresAuth: true,
      rateLimit: '5 per hour',
      requestBody: {
        name: { type: 'string', required: true },
        description: { type: 'string', required: true },
        sport: { type: 'string', required: true },
        location: { type: 'string', required: true },
      },
      response: {
        success: true,
        data: { id: 'field_id', name: 'Field Name' },
        message: 'Field created successfully',
      },
    },
  ],
  bookings: [
    {
      method: 'POST',
      path: '/api/v1/bookings',
      name: 'Create Booking',
      description: 'Book a sports field for a specific date and time',
      requiresAuth: true,
      rateLimit: '10 per minute',
      requestBody: {
        fieldId: { type: 'string', required: true },
        startTime: { type: 'string', required: true, example: '2026-06-15T10:00:00Z' },
        endTime: { type: 'string', required: true, example: '2026-06-15T12:00:00Z' },
        participants: { type: 'number', required: true, example: 11 },
      },
      response: {
        success: true,
        data: { id: 'booking_id', status: 'confirmed' },
        message: 'Booking created successfully',
      },
    },
    {
      method: 'GET',
      path: '/api/v1/bookings',
      name: 'List User Bookings',
      description: 'Get all bookings for the authenticated user',
      requiresAuth: true,
      rateLimit: '60 per minute',
      response: {
        success: true,
        data: [{ id: 'booking_id', status: 'confirmed' }],
      },
    },
  ],
};

/**
 * Generate HTML documentation
 * @returns {string} HTML documentation
 */
export const generateHTMLDocs = () => {
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Sports Field Booking API Documentation</title>
      <style>
        body { font-family: Arial; max-width: 1200px; margin: 0 auto; padding: 20px; }
        .endpoint { border: 1px solid #ddd; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .method { display: inline-block; padding: 5px 10px; border-radius: 3px; font-weight: bold; }
        .method.get { background: #61affe; color: white; }
        .method.post { background: #49cc90; color: white; }
        .method.put { background: #fca130; color: white; }
        .method.delete { background: #f93e3e; color: white; }
        .path { font-family: monospace; background: #f4f4f4; padding: 10px; }
      </style>
    </head>
    <body>
      <h1>Sports Field Booking Platform API</h1>
  `;

  Object.entries(endpoints).forEach(([category, items]) => {
    html += `<h2>${category.charAt(0).toUpperCase() + category.slice(1)}</h2>`;
    items.forEach(endpoint => {
      html += `
        <div class="endpoint">
          <h3>${endpoint.name}</h3>
          <p>${endpoint.description}</p>
          <div>
            <span class="method ${endpoint.method.toLowerCase()}">${endpoint.method}</span>
            <span class="path">${endpoint.path}</span>
          </div>
          <p><strong>Requires Auth:</strong> ${endpoint.requiresAuth ? 'Yes' : 'No'}</p>
          <p><strong>Rate Limit:</strong> ${endpoint.rateLimit}</p>
      `;
      html += '</div>';
    });
  });

  html += '</body></html>';
  return html;
};

/**
 * Generate OpenAPI specification
 * @returns {object} OpenAPI spec
 */
export const generateOpenAPISpec = () => {
  const paths = {};

  Object.values(endpoints).forEach(items => {
    items.forEach(endpoint => {
      paths[endpoint.path] = {
        [endpoint.method.toLowerCase()]: {
          summary: endpoint.name,
          description: endpoint.description,
          parameters: endpoint.queryParams ? Object.entries(endpoint.queryParams).map(([name, param]) => ({
            name,
            in: 'query',
            required: param.required,
            schema: { type: param.type },
          })) : [],
          requestBody: endpoint.requestBody ? {
            content: { 'application/json': { schema: endpoint.requestBody } },
          } : undefined,
          responses: {
            200: { description: 'Success', content: { 'application/json': { schema: endpoint.response } } },
          },
          security: endpoint.requiresAuth ? [{ bearerAuth: [] }] : [],
        },
      };
    });
  });

  return {
    openapi: '3.0.0',
    info: { title: 'Sports Field Booking API', version: '1.0.0' },
    paths,
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer' },
      },
    },
  };
};

export default {
  endpoints,
  generateHTMLDocs,
  generateOpenAPISpec,
};
