const bcrypt = require('bcrypt');
const nanoid = require('nanoid');
const jwt = require('jsonwebtoken');
const redis = require('redis');
const { promisify } = require('util');

const redisClient = redis.createClient();

const User = require('../schemas/user');

const getAsync = promisify(redisClient.get).bind(redisClient);

const signup = async (req, reply) => {
  const { email, password } = req.body;

  const hashed = await bcrypt.hash(password, 10);

  const user = new User({
    email,
    password: hashed,
  });

  try {
    await user.save();
    reply.code(200);
    return { response: 1 };
  } catch {
    reply.code(500);
    return { type: 1 };
  }
};

const signin = async (req, reply) => {
  const { email, password, fingerprint } = req.body;

  const user = await User.findOne({ email });

  const isEqual = await bcrypt.compare(password, user.password);

  if (!isEqual) {
    reply.code(400);
    return { error: { code: 2 } };
  }

  const token = nanoid.nanoid(60);
  const ttl = 60 * 60 * 24 * 120;

  redisClient.set(token, JSON.stringify({
    email, fingerprint, token, timestamp: new Date(),
  }), 'EX', ttl);

  const jwtToken = jwt.sign({ email }, 'sdf24sfdae1$%', { expiresIn: '40m' });

  reply.cookie('refresh_token', token, {
    expires: ttl,
    domain: 'localhost',
    path: '/',
    httpOnly: true,
    maxAge: ttl,
  }).send({ token: jwtToken });

  return reply.code(200);
};

const refresh = async (req, reply) => {
  const { fingerprint } = req.body;

  const refreshToken = req.cookies.refresh_token;

  const redisToken = await getAsync(refreshToken);

  const redisResponse = JSON.parse(redisToken);
  if (redisResponse.fingerprint === fingerprint) {
    const jwtToken = jwt.sign({ email: redisResponse.email }, 'sdf24sfdae1$%', { expiresIn: '40m' });

    reply.code(200);
    return { token: jwtToken };
  }

  redisClient.del(refreshToken);
  reply.setCookie('refresh_token', '', { maxAge: 0 });

  reply.code(401);
  return { error: { code: 3 } };
};

module.exports = {
  signin, signup, refresh,
};
