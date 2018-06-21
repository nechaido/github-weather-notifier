/**
 * @flow
 * @format
 */

'use strict';

const Koa = require('koa');
const koaJWT = require('koa-jwt');
const logger = require('koa-logger');
const bodyParser = require('koa-bodyparser');
const initDB = require('./db');
const createRouter = require('./api');
const config = require('./config');

const app = new Koa();

initDB()
  .then(db => {
    const api = createRouter(db);

    app.use(logger());
    app.use(
      koaJWT({ secret: config.jwtSecret }).unless({ path: [/^\/public/] }),
    );
    app.use(api.routes());
    app.use(api.allowedMethods());

    app.listen(3000);
  })
  .catch(error => {
    console.log(error);
  });
