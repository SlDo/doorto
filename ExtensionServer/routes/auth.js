const authHandlers = require('../handlers/auth');

const routes = [
  {
    method: 'POST',
    url: '/api/signup',
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string' },
          password: { type: 'string' },
        },
      },
    },
    handler: authHandlers.signup,
  },
  {
    method: 'POST',
    url: '/api/signin',
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password', 'fingerprint'],
        properties: {
          email: { type: 'string' },
          password: { type: 'string' },
          fingerprint: { type: 'string' },
        },
      },
    },
    handler: authHandlers.signin,
  },
  {
    method: 'POST',
    url: '/api/refresh',
    schema: {
      body: {
        type: 'object',
        required: ['fingerprint'],
        properties: {
          fingerprint: { type: 'string' },
        },
      },
    },
    handler: authHandlers.refresh,
  },
];

module.exports = routes;
