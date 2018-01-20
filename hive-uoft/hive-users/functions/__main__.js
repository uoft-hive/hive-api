const { dev } = require('../env.json');
const { MongoClient } = require('mongodb');
const uri =
  `mongodb://hiveuoft:hiveuoft@hive-shard-00-00-cxtoz.mongodb.net:27017,` +
  `hive-shard-00-01-cxtoz.mongodb.net:27017,` +
  `hive-shard-00-02-cxtoz.mongodb.net:27017/admin?replicaSet=hive-shard-0&ssl=true`;

/**
 * Get all the users
 * @param {string} name Who you're saying hello to
 * @returns {array}
 */
module.exports = async (name = 'world', context) => {
  const db = await MongoClient.connect(uri);
  const userTable = db.db('hive').collection('users');
  const users = await userTable.find();
  let u = users.toArray();
  return u;
  // MongoClient.connect(uri, function(err, db) {
  //   const collection = db.db('hive').collection('users');
  //   collection.find((_, users) => console.log(users));
  // });

  //  callback(null, `hello ${name}`);
};
