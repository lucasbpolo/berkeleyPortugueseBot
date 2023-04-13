// ENV
const env = 'PRD';

// CLOUD FUNCTION
const functions = require('firebase-functions');

// DATA BASE
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: require('./databaseUrls.json').prd,
});

const db = admin.database();

// TELEGRAM TOKEN
const telegramToken = require('./telegramTokens.json').prd;

// ALBA
albaCookie = require('./albaCredentials.json').cookie;

// INIT BOT
const init = require('./bot');

const bot = init({ db, telegramToken, albaCookie, env });

//CREATING CLOUD FUNCTION
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

exports.bot = functions.https.onRequest(async (req, res) => {
  bot.processUpdate(req.body);
  await delay(10000); // Wait for 10 seconds
  res.sendStatus(200);
});
