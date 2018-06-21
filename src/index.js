/**
 * @flow
 * @format
 */

'use strict';

const Koa = require('koa');
const koaJWT = require('koa-jwt');
const koaLogger = require('koa-logger');
const koaBody = require('koa-body');

const initDB = require('./db');
const createRouter = require('./api');
const config = require('./config');

const app = new Koa();

const start = async () => {
  const db = await initDB();
  const api = createRouter(db);

  app.use(koaLogger());
  app.use(
    koaJWT({ secret: config.jwtSecret }).unless({
      path: [/^\/(?:signIn|signUp)$/],
    }),
  );
  app.use(koaBody({ multipart: true }));

  app.use(api.routes());
  app.use(api.allowedMethods());

  app.listen(3000);
};

start();
