const { promisify } = require('util');
const OAuth = require('oauth');
var oauth = new OAuth.OAuth(
  'https://api.twitter.com/oauth/request_token',
  'https://api.twitter.com/oauth/access_token',
  '6MOgb0rIlVPMiyGXEkAZFyIAL',
  'CWPmV2xYFCDgX16jehZ5QrBuW0dwJiXUW03XEWOvcAw2oGvjSu',
  '1.0A',
  null,
  'HMAC-SHA1'
);

const userToken = '2912014127-tkV6n402Tm6wzEE5k0j8llsrnAVl2s1JSQ0q96K'; //test user token
const userSecret = 'A5Lxi1lZwe1HETS9SRKDBuFJI7EoDtI0ONTbx9qIxiwQK'; //test user secret

function getPlace({ lat, long }, callback) {
  oauth.get(
    `https://api.twitter.com/1.1/geo/search.json?lat=${lat}&long=${long}`,
    userToken,
    userSecret,
    (e, data, res) => {
      data = JSON.parse(data);
      if (e) {
        console.log(e);
        callback({
          place: -1,
        });
      } else {
        callback({ id: data.result.places[0].id });
      }
    }
  );
}
function getNews(place, callback) {
  console.log('place', place);
  oauth.get(
    `https://api.twitter.com/1.1/geo/id/${place.id}`,
    userToken,
    userSecret,
    (e, data, res) => callback(e, data, res)
  );
}

/**
 *
 * @param {string} lat The latitude
 * @param {string} long The longitude
 * @returns {any}
 */
module.exports = (lat, long, context, callback) => {
  getPlace({ lat, long }, place => {
    getNews(place, (e, data, res) => {
      if (e) console.log(e);
      callback(null, data);
    });
  });
};
