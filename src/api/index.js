/**
 * @flow
 * @format
 */

const Router = require('koa-router');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');

const imageMagick = require('imagemagick-native');

const fs = require('fs');
const stream = require('stream');

const config = require('../config');
const { sendMailTo } = require('../send-mail');

const generateJWT = payload =>
  new Promise((resolve, reject) => {
    jwt.sign(payload, config.jwtSecret, config.jwtConfig, (error, token) => {
      if (error) {
        return reject(error);
      }
      resolve(token);
    });
  });

const decodeJWT = token =>
  new Promise((resolve, reject) => {
    jwt.verify(token, config.jwtSecret, config.jwtConfig, (error, decoded) => {
      if (error) {
        return reject(error);
      }
      resolve(decoded);
    });
  });

const hashingConfig = { type: argon2.argon2id };
const hash = password => argon2.hash(password, hashingConfig);
const verify = (hash, password) => argon2.verify(hash, password, hashingConfig);

const streamToBuffer = readStream =>
  new Promise((resolve, reject) => {
    const parts = [];
    readStream.on('data', data => parts.push(data));
    readStream.on('end', () => resolve(Buffer.concat(parts)));
    readStream.once('error', reject);
  });

const convert = buffer =>
  new Promise(resolve => {
    imageMagick.convert(
      {
        srcData: buffer,
        width: 64,
        height: 64,
        resizeStyle: 'aspectfill',
        filter: 'Catrom',
        format: 'JPEG',
      },
      (err, converted) => resolve(converted),
    );
  });

const signUp = db => async (ctx, next) => {
  const { email, password } = ctx.request.body;
  const file = ctx.request.files.avatar;

  if (!email || !password || !file) {
    ctx.body = {
      error: 'You must provide email, password and avatar',
    };
    ctx.status = 400;
    return next();
  }

  const exists = await db.getUser(email);
  if (exists) {
    ctx.body = {
      error: 'You must provide unique email',
    };
    ctx.status = 400;
    return next();
  }

  const user = { email, avatarType: file.type };

  const readStream = fs.createReadStream(file.path);
  user.avatar = await streamToBuffer(readStream);
  user.thumbnail = await convert(user.avatar);
  user.password = await hash(password);
  await db.addUser(user);

  const token = await generateJWT({
    sub: user._id,
  });
  ctx.body = {
    token,
    avatar: `/avatars/${user._id}`,
  };
  return next();
};

const signIn = db => async (ctx, next) => {
  const { email, password } = ctx.request.body;

  if (!email || !password) {
    ctx.body = {
      error: 'You must provide email and password',
    };
    ctx.status = 400;
    return next();
  }

  const user = await db.getUser(email);
  const verified = await verify(user.password, password);

  if (!verified) {
    ctx.status = 401;
    return await next();
  }

  const token = await generateJWT({
    sub: user._id,
  });
  ctx.body = {
    token,
    email: user.email,
    thumbnail: `/thumbnails/${user._id}`,
    avatar: `/avatars/${user._id}`,
  };
  return await next();
};

const getAvatar = db => async (ctx, next) => {
  const id = ctx.params.id;
  console.log(id);

  if (!id) {
    ctx.status = 404;
    return next();
  }

  const { type, buf } = await db.getAvatar(id);
  ctx.type = type;
  ctx.body = buf;

  return next();
};

const getThumbnail = db => async (ctx, next) => {
  const id = ctx.params.id;

  if (!id) {
    ctx.status = 404;
    return next();
  }

  const buf = await db.getThumbnail(id);
  ctx.type = 'image/jpeg';
  ctx.body = buf;

  return next();
};

const sendEmail = db => async (ctx, next) => {
  const { message, usernames } = ctx.request.body;
  const users = usernames.split(',');
  await sendMailTo(message, users);
  ctx.body = '';
  return next();
};

const createRouter = db =>
  new Router()
    .post('/signUp', signUp(db))
    .post('/signIn', signIn(db))
    .get('/avatars/:id', getAvatar(db))
    .get('/thumbnails/:id', getThumbnail(db))
    .post('/sendEmail', sendEmail(db));

module.exports = createRouter;
