/**
 * @flow
 * @format
 */

'use strict';

const request = require('request-promise-native');
const countries = require('i18n-iso-countries');
const nodemailer = require('nodemailer');
const Email = require('email-templates');

const config = require('./config');

const OPEN_WEATHER_URL = 'http://api.openweathermap.org/data/2.5/weather';
const GITHUB_API = 'https://api.github.com';
const GITHUB_USERS_API = `${GITHUB_API}/users`;

const transporter = nodemailer.createTransport({
  service: config.mail.service,
  auth: {
    user: config.mail.user,
    pass: config.mail.pass,
  },
});

//
// Sends email to the specified users
//
// message: string - message to send to the users
// users: Array[string] - github usernames
//
function sendMailTo(message, users) {
  return Promise.all(
    users.map(async user => {
      try {
        const userData = await request({
          uri: GITHUB_USERS_API + `/${user}`,
          headers: {
            'User-Agent': config.userAgent,
            Authorization: `token ${config.githubOauthToken}`,
          },
          json: true,
        });
        if (!userData.email) throw new Error(`User ${user} has no email`);

        const location = resolveLocation(userData['location']);
        await sendWeatherMail(user, userData.email, message, location);
      } catch (e) {
        console.error('Failed to send email', e);
      }
    }),
  );
}

//
// Send mail to as user with email and message, adds location data if available
//
// user - string - username
// email - string - user email
// message - string - mesage to include
// location - { city: string, country: string} - location to fetch
//            weather data for
//
async function sendWeatherMail(user, email, message, location) {
  const { city, country } = location;
  let weatherData = null;
  if (city) {
    try {
      weatherData = await fetchWeather(city, country);
    } catch (e) {
      console.error('Failed to fetch weather', e);
    }
  }
  new Email({
    message: {
      from: config.mail.from,
    },
    // uncomment below to send emails in development/test env:
    // send: true
    transport: transporter,
  }).send({
    template: 'message-weather',
    message: {
      to: email,
    },
    locals: {
      name: user,
      message,
      date: new Date().toLocaleString(),
      weatherMain: weatherData ? weatherData.weather[0].main : '',
      weatherTemp: weatherData ? weatherData.main.temp : '',
    },
  });
}

//
// Tries to separate city/country if applicable
//
// returns {country: string(iso3166), city: string} or null
function resolveLocation(githubLocation) {
  if (!githubLocation) return {};
  const [loc1, loc2] = githubLocation.split(/[\s,]+/);
  if (!loc1 && !loc2) return null;
  const loc = {
    city: '',
    country:
      countries.getAlpha2Code(loc1, 'en') ||
      countries.getAlpha2Code(loc2, 'en'),
  };
  loc.city = loc1 === loc.country ? loc2 : loc1;
  return loc;
}

//
// Fetch weather from openweathermap
//
// returns Promise with parsed openweather response
function fetchWeather(city, country) {
  if (!city) return Promise.reject(new Error('City is not defined'));
  return request({
    uri: OPEN_WEATHER_URL,
    qs: {
      q: `${city}${country ? ',' + country : ''}`,
      appid: config.openWeatherApiKey,
      units: 'metric',
    },
    json: true,
  });
}

module.exports = {
  sendMailTo,
};
