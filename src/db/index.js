/**
 * @flow
 * @format
 */

const mongo = require('mongodb');
const ObjectId = mongo.ObjectId;

const url = 'mongodb://localhost:27017';

const init = async () => {
  const client = await mongo.connect(url);
  const db = client.db('github-weather-notifier');

  db.createIndex('user', { email: 1 }, { unique: true });

  const addUser = async user => await db.collection('user').insertOne(user);

  const getUser = async email => await db.collection('user').findOne({ email });

  const getAvatar = async id => {
    const user = await db.collection('user').findOne({ _id: new ObjectId(id) });
    return {
      type: user.avatarType,
      buf: user.avatar.buffer,
    };
  };

  const getThumbnail = async id => {
    const user = await db.collection('user').findOne({ _id: new ObjectId(id) });
    return user.thumbnail.buffer;
  };

  return {
    addUser,
    getUser,
    getAvatar,
    getThumbnail,
  };
};

module.exports = init;
