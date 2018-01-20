const OAuth = require('oauth');
const { inspect } = require('util');

const oauth = new OAuth.OAuth(
  'https://api.twitter.com/oauth/request_token',
  'https://api.twitter.com/oauth/access_token',
  '6MOgb0rIlVPMiyGXEkAZFyIAL',
  'CWPmV2xYFCDgX16jehZ5QrBuW0dwJiXUW03XEWOvcAw2oGvjSu',
  '1.0A',
  null,
  'HMAC-SHA1'
);

/**
 *
 * @param {string} lat The latitude
 * @param {string} long The longitude
 * @returns {any}
 */
module.exports = (lat, long, context, callback) => {
  // make sure lat and long are ints using `+lat`, `+long`
  getNews({ lat, long }, (e, data, res) => {
    data = JSON.parse(data);
    callback(
      null,
      data.statuses.map(tweet => ({
        location: {
          lat, long
        },
        id: tweet.id,
        link: `https://twitter.com/statuses/${tweet.id}`,
        text: tweet.text,
      }))
    );
  });
};

async function getNews({ lat, long }, callback) {
  const userToken = '2912014127-tkV6n402Tm6wzEE5k0j8llsrnAVl2s1JSQ0q96K'; //test user token
  const userSecret = 'A5Lxi1lZwe1HETS9SRKDBuFJI7EoDtI0ONTbx9qIxiwQK'; //test user secret
  const data = oauth.get(
    `https://api.twitter.com/1.1/search/tweets.json?geocode=${lat},${long},1mi`,
    userToken,
    userSecret,
    callback
  );
}
