/**
 * @flow
 * @format
 */

'use strict';

import Koa from 'koa';
import koaJWT from 'koa-jwt';
import logger from 'koa-logger';
import bodyParser from 'koa-bodyparser';

import initDB from './db';
import createRouter from './api';
import config from './config';

const app = new Koa();

initDB()
  .then(db => {
    const api = createRouter(db);

    app.use(logger());
    app.use(bodyParser());
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
