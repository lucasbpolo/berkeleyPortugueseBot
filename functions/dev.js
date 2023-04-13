// ENV
const env = 'DEV';

// DATA BASE
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: require('./databaseUrls.json').dev,
});

const db = admin.database();

// TELEGRAM TOKEN
const telegramToken = require('./telegramTokens.json').dev;

// ALBA
albaCookie = require('./albaCredentials.json').cookie;

// INIT BOT
const init = require('./bot');

const bot = init({ db, telegramToken, albaCookie, env });
