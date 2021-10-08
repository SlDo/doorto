const port = process.env.PORT || 3000;
const dbURL = process.env.DB_URL || 'mongodb://localhost:27017/syncw';

const fastify = require('fastify')({ logger: true });
const mongoose = require('mongoose');

const jwt = require('jsonwebtoken');
const Session = require('./schemas/session');

const { addInstance, log } = require('./utils/logger');

addInstance(fastify);

const database = require('./utils/database');

fastify.register(require('fastify-socket.io'), {});

fastify.register(require('fastify-cors'), {
  origin: 'http://localhost:3001',
  credentials: true,
});

fastify.register(require('fastify-cookie'), {
  secret: 'sdgFSDask1#',
  options: {},
});

fastify.ready(() => {
  fastify.io.on('connection', (socket) => {
    socket.on('join', async ({ room }, arg, response) => {
      const session = await Session.findOne({ session_id: room });
      const roomAdapter = fastify.io.sockets.adapter.rooms;

      if (session && !roomAdapter?.get(room)?.has(socket.id)) {
        let isAdmin = false;
        const { host } = session;
        const { token } = socket.handshake.query;

        socket.join(room);

        if (token != null) {
          jwt.verify(token, 'sdf24sfdae1$%', (err, decoded) => {
            if (decoded != null && decoded.email === host && roomAdapter != null) {
              roomAdapter.get(room).host = socket.id;
              isAdmin = true;
            }
          });
        }

        session.watchers = [...session.watchers, socket.id];

        fastify.io.sockets.in(room).emit('pause');

        await session.save();

        response({
          payload: { room, url: session.url, isAdmin },
        });
      }
    });

    socket.on('leave', async ({ room }, arg2, response) => {
      const session = await Session.findOne({ session_id: room });

      if (session) {
        session.watchers = session.watchers.filter((watcher) => watcher !== socket.id);

        await session.save();

        response({
          payload: { room },
        });

        socket.leave(room);
      }
    });

    socket.on('pause', ({ room }) => {
      fastify.io.sockets.in(room).emit('pause');
    });
    socket.on('play', ({ room }) => {
      fastify.io.sockets.in(room).emit('play');
    });
    socket.on('progress', ({ room, time }) => {
      fastify.io.sockets.in(room).emit('progress', { time });
    });

    socket.on('disconnect', () => { console.log('disconnected'); });
  });
});

const authRoutes = require('./routes/auth');

authRoutes.forEach((route) => {
  fastify.route(route);
});

const sessionRoutes = require('./routes/session');

sessionRoutes.forEach((route) => {
  fastify.route(route);
});

const start = async () => {
  try {
    await fastify.listen(port);
  } catch (err) {
    log('error', err);
    process.exit(1);
  }
};

database(mongoose, dbURL, start);

process.on('SIGINT', () => {
  fastify.close();

  mongoose.connection.close(() => {
    log('info', 'Database closed');

    process.exit(0);
  });
});
