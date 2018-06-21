/**
 * @flow
 * @format
 */

const MongoClient = require('mongodb');

const url = 'mongodb://localhost:27017';

const init = async () => {
  const client = await MongoClient.connect(url);
  const db = client.db('github-weather-notifier');

  return {};
};

module.exports = init;
