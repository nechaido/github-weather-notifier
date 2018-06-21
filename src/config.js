/**
 * @flow
 * @format
 */

module.exports = {
  jwtSecret: 'Very_Secret_Secret',
  jwtConfig: { expiresIn: '1d' },
  // TODO: replace with proper key (this is lundibundi's free key)
  openWeatherApiKey: 'bad3b69f5a4da2862c0e8edadb28526f',
  // TODO: replace with proper github token
  githubOauthToken: 'a8f1560a604af6276d96709d05aac5a2de4b9ec8',
  mail: {
    from: 'youremail@gmail.com',
    service: 'gmail',
    user: 'youremail@gmail.com',
    pass: 'yourpassword',
  },
  userAgent: 'request weather-notifier',
};
