/**
 * @flow
 * @format
 */

const init = async () => {
  const client = await MongoClient.connect(url);
  const db = client.db('github-weather-notifier');

  return {};
};

export default init;
