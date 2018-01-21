const request = require('request');
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const App = require('actions-on-google').DialogflowApp;

admin.initializeApp(functions.config().firebase);

process.env.DEBUG = 'actions-on-google:*';
const hives = ['hive1', 'hive2', 'hive3', 'hive4'];

const intents = {
  PERMISSION: 'request_permissions',
  ZERO: 'before_welcome',
  WELCOME: 'input.welcome',
  CLOSE: 'say_bye',
  UNKNOWN: 'input.unknown',
  USER: {
    INIT: 'init_user',
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
    CURRENT: 'current_hive',
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
  map.set(intents.HIVE.CURRENT, currentHive);
  map.set(intents.HIVE.SWITCH, switchHive);
  map.set(intents.HIVE.ACCESS, accessHive);

  hive.handleRequest(map);

  function switchHive(app) {
    const group_noun = app.getArgument('hive') || 'Hive';
    const toHive = app.getArgument('hive_category');
    if (!group_noun) {
      app.ask(Responses.UnknownGroup());
      return;
    }
    if (!toHive) {
      app.ask(Responses.NoHiveCategory());
      return;
    }
    console.log(`toHive: ${toHive}`);
    console.log('preparing to read from database');
    const fromHive = app.data.currentHive;
    console.log('fromHive is', fromHive);
    DB.getHive(toHive || 'friends', hive => {
      console.log('got hive', hive);
      app.data.currentHive = hive;
      if (fromHive) {
        app.ask(
          `Switched from ${group_noun} ${fromHive.name} to ${group_noun} ${
            toHive.name
          }`
        );
      } else {
        app.ask(`We flew into ${group_noun} ${toHive.name}`);
      }
    });
  }
  function currentHive(app) {
    if (app.data.hive && app.data.currentHive && app.data.currentHive.name) {
      app.ask(
        `The currently in the ${
          app.data.hive.currentHive.name
        } hive. Buzz Buzz!`
      );
    } else {
      app.ask(`You are not currently in a hive. Please select a hive.`);
    }
  }
  function createHive(app) {
    console.log(app.data);
    const group_noun = app.getArgument('hive');
    if (!group_noun) {
      app.ask(`Sorry! We didn't catch that. Try again?`);
      return;
    }
    const hive_name = app.getArgument('hive_category');
    if (!hive_name) {
      app.ask(Responses.NoHiveCategory());
    }
    const queenBee = app.data.user;
    if (!queenBee) {
      app.ask(`Sorry, we couldn't find your info. Try logging in again`);
      return;
    }
    DB.addHive(hive_name, queenBee, (err, snapshot) => {
      if (err) {
        app.ask(
          `Sorry, we couldn't create the hive. The name has already been taken`
        );
        return;
      }
      app.data.hive.currentHive = snapshot;
      app.ask(
        `Created the ${app.getArgument('hive')} ${app.getArgument(
          'hive_category'
        )}. Add members from your contacts`
      );
    });
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

        DB.addUser(
          {
            name: display,
            location: location,
          },
          user => {
            app.data.user = user;
            app.data.colony = {
              hive: user.hives,
            };
          }
        );

        app.data.user = { name: display, location: location };
        app.data.colony = {
          hive: hives,
          currentHive: {
            bees: [{ name: 'hello', location: { lat: 10, long: 20 } }],
            queen: { name: 'queen', location: { lat: 10, long: 20 } },
          },
        };
      } catch (e) {
        console.log(e);
      }
      app.ask(
        'Thanks! Setting you up with Hive! Try "Go to my Colony" to get started.'
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
    console.log(
      'access hive - hive_category:',
      app.getArgument('hive_category')
    );
    console.log('ACCESS HIVE');
    app.tell('You Did It');
  }
}
function createBee(req, res) {}
function listHives(req, res) {
  res.send({
    user: 'username',
    hives: hives,
  });
}
class Responses {
  static NoGroupName() {
    return `Sorry! We didn't catch that. Try again?`;
  }
  static NoHiveCategory() {
    return `Sorry! We couldn't figure out the hive name`;
  }
}
class DB {
  static addHive(name, queen, callback) {
    // TODO: add only if not exists
    admin
      .database()
      .ref('/hives')
      .push({
        name: name,
        queen: queen,
        bees: [],
        created: new Date(),
        updated: new Date(),
      })
      .then(snapshot => {
        console.log(snapshot);
        callback(null, snapshot);
        return snapshot.key;
      })
      .catch(err => {
        console.log(err);
        callback(err, null);
        return console.log(err);
      });
  }
  static getHive(name, callback) {
    const ref = admin.database().ref('/hives');
    ref
      .once('value')
      .then(snapshot => {
        let found = 0;
        snapshot.forEach(hive => {
          console.log('hivesnap', hive);
          const h = hive.val();
          console.log('hivedata', h);
          if (h.name === name && found === 0) {
            found = 1;
            console.log('hive found with name', name);
            return callback(null, h);
          }
          return h;
        });
        return;
      })
      .catch(e => console.log(e));
  }
  static addUser({ name, location }, callback) {
    // TODO: add only if not exists
    admin
      .database()
      .ref('/bees')
      .push({
        name,
        location,
        queenOf: [],
        memberOf: [],
      })
      .then(snapshot => {
        callback(null, snapshot.data());
        return snapshot;
      })
      .catch(err => {
        callback(err, null);
        return console.log(err);
      });
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
// var hivesRef = firebase.database().ref('/hives');
//  var newHive = hivesRef.push();
//  newMessageRef.set({
//    name: name,
//    queen: queen,
//    bees: [],
//    created: new Date(),
//    updated: new Date(),
//  });
  //  Checking how those important to you are doing in $hive_category
*/
