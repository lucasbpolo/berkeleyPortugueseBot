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

// INIT BOT
const init = require('./bot');

const bot = init({ db, telegramToken, env });

//CREATING CLOUD FUNCTION
exports.bot = functions.https.onRequest((req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});
