const request = require('request');
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const App = require('actions-on-google').DialogflowApp;

const intents = require('./intents');

admin.initializeApp(functions.config().firebase);

process.env.DEBUG = 'actions-on-google:*';

/*
 * NOTE: Temporary
 * We'll do all the changes with a local state (no DB).
 * This is volatile memory if I understand how firebase functions work.
 * There's no garuantee that state is preserved when calling the function twice.
 *
 * Anyway, as soon as the Google Assistant workflow works _completely_ with the
 * current `hives` and `users` array, I'll be adding DB functionality ...
 * going to look into moving it to a relational database, since the data aligns
 * nicely with one, but will initially do it on Firebase's NoSQL DB.
 */
let hives = [];
let users = [];

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
    const userHiveNoun = app.getArgument('hive') || 'Hive';
    const toHiveName = app.getArgument('hive_category');

    if (!valid(group_noun, toHive)) return;

    const fromHive = app.data.currentHive;

    const toHive = hives.find(hive => hive.name === toHiveName);
    if (!toHive) return app.ask(`Could not find ${userHiveNoun} ${toHiveName}`);

    app.data.currentHive = toHive;
    app.ask(
      `Switched from ${userHiveNoun} ${fromHive.name} to ${userHiveNoun} ${
        toHive.name
      }`
    );

    function valid(group_noun, toHive) {
      if (!group_noun) {
        app.ask(Responses.UnknownGroup());
        return false;
      }
      if (!toHive) {
        app.ask(Responses.NoHiveCategory());
        return false;
      }
      return true;
    }
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
    console.log('welcome :)');
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
            location: location
          },
          user => {
            app.data.user = user;
            app.data.colony = {
              hive: user.hives
            };
          }
        );

        app.data.user = { name: display, location: location };
        app.data.colony = {
          hive: hives,
          currentHive: {
            bees: [{ name: 'hello', location: { lat: 10, long: 20 } }],
            queen: { name: 'queen', location: { lat: 10, long: 20 } }
          }
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

    // app.askForPermissions('To talk to your hive', [
    //   app.SupportedPermissions.NAME,
    //   app.SupportedPermissions.DEVICE_PRECISE_LOCATION,
    // ]);

    console.log('asked for permission');
  }
  function addContact(app) {
    console.log('ADD CONTACT ');
  }
  function listHives(app) {
    console.log('LIST HIVES');
  }
  function accessHive(app) {
    const toHive = app.getArgument('hive_category');
    const group_noun = app.getArgument('hive') || 'Hive';
    DB.getHive(toHive || 'friends', hive => {
      console.log('got hive', hive);
      app.data.currentHive = hive;
      app.ask(`We flew into ${group_noun} ${hive.name || 'friends'}`);
    });
  }
}
function createBee(req, res) {}
function listHives(req, res) {
  res.send({
    user: 'username',
    hives: hives
  });
}
class Responses {
  // TODO: rework to take in an arg
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
        updated: new Date()
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
      .once('name')
      .then(snapshot => {
        let found = 0;
        snapshot.forEach(hive => {
          console.log('hivesnap', hive);
          const h = hive.val();
          if (found === 0) {
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
      .push({ queenOf: [], memberOf: [], name, location })

      .then(snapshot => {
        callback(null, snapshot.data());
        return snapshot;
      })
      .catch(err => {
        callback(err, null);
        return console.log(err);
      });
  }
}
