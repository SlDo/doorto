const sessionHandlers = require('../handlers/session');

const routes = [
  {
    method: 'POST',
    url: '/api/session/create',
    schema: {
      body: {
        type: 'object',
        required: ['url'],
        properties: {
          url: { type: 'string' },
        },
      },
    },
    handler: sessionHandlers.createSession,
  },
];

module.exports = routes;
