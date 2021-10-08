const jwt = require('jsonwebtoken');
const nanoid = require('nanoid');
const redis = require('redis');

const redisClient = redis.createClient();

const Session = require('../schemas/session');

const createSession = async (req, reply) => {
  const { url } = req.body;

  const token = req.headers.authorization;

  const { email } = jwt.verify(token, 'sdf24sfdae1$%');
  const sessionID = nanoid.nanoid(10);

  const session = new Session({
    url, host: email, session_id: sessionID,
  });

  try {
    await session.save();

    redisClient.hmset(sessionID, 'time', 0, 'status', 0);
    reply.code(200);
    return { id: sessionID, url };
  } catch (e) {
    reply.code(500);
    return { error: { code: 5 } };
  }
};

module.exports = {
  createSession,
};
