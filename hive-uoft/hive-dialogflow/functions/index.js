const request = require('request');
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const App = require('actions-on-google').DialogflowApp;

admin.initializeApp(functions.config().firebase);

process.env.DEBUG = 'actions-on-google:*';
const hives = ['hive1', 'hive2', 'hive3', 'hive4'];

const intents = {
  PERMISSION: 'request_permissions', // 0
  ZERO: 'before_welcome',
  WELCOME: 'input.welcome', // 2
  CLOSE: 'say_bye',
  UNKNOWN: 'input.unknown',
  USER: {
    INIT: 'init_user', // 1
    NEWS: 'get_news',
    TIMEZONE: 'get_timezone',
    WEATHER: 'get_weather',
  },
  HIVE: {
    LIST: 'list_hive',
    ACCESS: 'access_hive',
    CREATE: 'create_hive',
    LOCATION: 'get_location',
    SWITCH: 'switch_hive',
  },
  CONTACT: {
    CALL: 'call_contact',
    ADD: 'add_contact',
    DELETE: 'delete_contact',
  },
};

exports.listHives = functions.https.onRequest(listHives);
exports.Hive = functions.https.onRequest(Hive);
// exports.addUser = functions.https.onRequest(addUser);

function Hive(request, response) {
  const hive = new App({ request, response });

  const map = new Map();
  map.set(intents.PERMISSION, askForPermissions);
  map.set(intents.USER.INIT, initUser);
  map.set(intents.WELCOME, welcome);
  map.set(intents.HIVE.CREATE, createHive);

  hive.handleRequest(map);

  function createHive(app) {
    console.log('create hive');
  }
  function getTimeZone(app) {
    // name
    // city
    if (app.getArgument('location')) {
      return;
    }

    const name = app.getArgument('name');
    if (!name) {
      app.ask('There was no name or location give. What would you like to do?');
      return;
    }

    const bee = app.data.hive.currentHive.bees.find(bee => bee.name === name);
    if (!bee) {
      app.ask(
        `We couldn't find the name ${name} in the hive ${
          app.data.hive.name
        }. What would you like to do?`
      );
      return;
    }

    request.get(
      `https://hive-uoft.lib.id/hive-time@dev/?lat=37.4219806&long=-122.0841979`,
      (err, res, body) => {
        if (err) {
          app.tell(
            `We couldnt find the time at that location. Perhaps they have location services turned off?`
          );
          console.log(err);
          return;
        }
        console.log('getTimeZone', response.body);
      }
    );
  }
  function welcome(app) {
    // maybe get user info, prompt for hive
    console.log('welcome 😀 ');
  }
  function initUser(app) {
    console.log('ADDING USER');
    if (app.isPermissionGranted()) {
      try {
        const display = app.getUserName().displayName;
        const location = app.getDeviceLocation().coordinates;

        DB.addUser({
          name: display,
          location: location,
        });

        app.data.user = { name: display, location: location };

        app.data.colony = {
          hive: hives,
          currentHive: {
            bees: [{ name: 'hello', location: { lat: 10, long: 20 } }],
            queen: { name: 'queen', location: { lat: 10, long: 20 } },
          },
        };
        app.setArgument('username', display);
      } catch (e) {
        console.log(e);
      }
      app.ask(
        'Thanks! Setting you up with Hive! Say "Go to my Colony" to get started.'
      );
    } else {
      app.tell('Bye');
    }
  }
  function askForPermissions(app) {
    console.log('asking for permission :)');

    app.askForPermissions('To talk to your hive', [
      app.SupportedPermissions.NAME,
      app.SupportedPermissions.DEVICE_PRECISE_LOCATION,
    ]);

    console.log('asked for permission');
  }
  function addContact(app) {
    console.log('ADD CONTACT ');
  }
  function listHives(app) {
    console.log('LIST HIVES');
  }
  function accessHive(app) {
    console.log('ACCESS HIVE');
  }
}
function createBee(req, res) {}
function listHives(req, res) {
  res.send({
    user: 'username',
    hives: hives,
  });
}
class DB {
  static addUser({ name, location }) {
    // TODO: add if not exists
    admin
      .database()
      .ref('/bees')
      .push({
        name,
        location,
      })
      .then(snapshot => {
        console.log('ADDED USER ????');
        return snapshot;
      })
      .catch(err => console.log(err));
  }
} /*
// function addUser(req, res) {
//   console.log(req);
//   const name = req.query.name;
//   const location = req.query.location;
//   admin
//     .database()
//     .ref('/bees')
//     .push({
//       name: 'isthisnagee@gmail.com',
//       location: {
//         lat: 43.6532,
//         long: -79.383,
//       },
//     })
//     .then(snapshot => {
//       // Redirect with 303 SEE OTHER to the URL of the pushed object in the Firebase console.
//       res.redirect(303, snapshot.ref);
//       return snapshot;
//     })
//     .catch(err => console.log(err));
// }
*/
