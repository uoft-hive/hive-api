const auth = require('google-auth-library').OAuth2Client;

const { MongoClient } = require('mongodb');

const uri =
  `mongodb://hiveuoft:hiveuoft@hive-shard-00-00-cxtoz.mongodb.net:27017,` +
  `hive-shard-00-01-cxtoz.mongodb.net:27017,` +
  `hive-shard-00-02-cxtoz.mongodb.net:27017/admin?replicaSet=hive-shard-0&ssl=true`;

const auth = new GoogleAuth();

/**
 * @returns {any}
 */
module.exports = async (client_id, hive, context) => {
  const client = new auth.OAuth2(CLIENT_ID, '', '');
  const payload = await client.verifyIdToken(
    token,
    CLIENT_ID,
    // Or, if multiple clients access the backend:
    //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3],
    // function(e, login) {
    //   const payload = login.getPayload();
    //   const userid = payload['sub'];
    //   // If request specified a G Suite domain:
    //   //const domain = payload['hd'];
    // }
  );
  try {
    const oAuth2Client = await getAuthenticatedClient();
    // Make a simple request to the Google Plus API using our pre-authenticated client. The `request()` method
    // takes an AxiosRequestConfig object.  Visit https://github.com/axios/axios#request-config.
    const url = 'https://www.googleapis.com/plus/v1/people?query=pizza';
    const res = await oAuth2Client.request({url})
    console.log(res.data);
  } catch (e) {
    console.error(e);
  }
  const db = await MongoClient.connect(uri);
  const userTable = db.db('hive').collection('users');

};
