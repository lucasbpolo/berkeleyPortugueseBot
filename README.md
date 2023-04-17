# Chat Bot using node-telegram-bot-api

## Repository URL

https://github.com/lucasbpolo/berkeleyPortugueseBot

## Getting Started

### Prerequisites

- Git
- Node.js and npm
- Firebase CLI

#### Installing Git

You can download and install Git from the official website: https://git-scm.com/downloads.

#### Installing Node.js and npm

You can download and install Node.js (which includes npm) from the official website: https://nodejs.org/en/download/.

## Installing and Initializing Firebase CLI

To use the `firebase deploy --only functions` command, you'll need to install the Firebase CLI and initialize it in your project.

1. To install the Firebase CLI, open a terminal or command prompt and run the following command: `npm install -g firebase-tools`. This will install the Firebase CLI globally on your system.

2. Once the installation is complete, you can log in to your Firebase account by running the `firebase login` command. Follow the prompts to log in to your account.

3. Now you should be able to use the `firebase deploy --only functions` command to deploy your Cloud Functions.

### Installation

Make sure to grab the bot token and Firebase service account from Dropbox (ask Lucas for access).

1. Clone the repository and navigate to the root folder.
2. Run `npm install` in the root folder.
3. Navigate to the `functions` folder and run `npm install` again.
4. all the credentials from the dropbox to the `functions` folder.
5. To run the code locally, run `nodemon ./functions/dev.js`.
6. You can find the local bot at this URL: https://t.me/LucasBotLocalTestsBot.

### Deployment

1. Run `firebase deploy --only functions` to deploy the bot.
2. After deployment, you can find the production bot at this URL: https://t.me/BerkeleyPortugueseBot.

## Code Structure

The code that runs locally uses the `node-telegram-bot-api` library in polling mode, while the code that runs in the Firebase function uses the webhook functionality of the library. The main purpose of having a local version is to expedite development.

The initialization of the local code is in `./functions/dev.js`, while the initialization of the code that runs in the Firebase function is in `./functions/index.js`. Both of these files reuse code for the bot that is located in `./functions/bot.js`.

## Bot code

This code initializes a Telegram bot using the node-telegram-bot-api library. It imports several utility functions for validating user IDs, parsing HTML from the Alba website, and requesting territories from Alba.

The init function takes an object with several properties as its argument: db, telegramToken, albaCookie, and env. These properties represent the Firebase database instance, the Telegram bot token, the Alba cookie for authentication, and the current environment (development or production), respectively.

The isDevEnv variable is set to true if the current environment is development (env === 'DEV'). This variable is used to determine whether or not to use polling mode when initializing the bot.

The bot variable is an instance of the TelegramBot class, initialized with the provided Telegram bot token and an options object. The options object sets the polling property to true if the current environment is development (as determined by the value of isDevEnv).

The commands object defines several commands that the bot can respond to. Each command has a corresponding description.

The bot listens for messages that match the /start command using the onText method. When a message matching this command is received, the bot sends a welcome message to the user that includes a list of available commands.

The bot also listens for messages that match the /cadastro command. When a message matching this command is received, the bot retrieves the current value of the authorizedUserIds node from the Firebase database and checks if the user’s ID is already in the array. If it is not, the user’s ID is added to the array and the value of the authorizedUserIds node is updated in the database. The user’s information is also saved to a new node in the database.

The bot also listens for three other commands: /territorio, /devolver, and /experiencia.

When the bot receives the /territorio command, it makes a request to the requestAlbaTerritories function with an albaCookie parameter. It then validates the user IDs using the validateUserIds function and the db parameter. If the user IDs are validated, the bot parses the HTML returned from the requestAlbaTerritories function using the parseAlbaHTML function. It then selects a random territory from the parsed data and sends a message to the user with information about the selected territory.

When the bot receives the /devolver command, it validates the user IDs using the validateUserIds function and the db parameter. If the user IDs are validated, it sends a message to the user indicating that their territory has been returned.

When the bot receives the /experiencia command, it validates the user IDs using the validateUserIds function and the db parameter. If the user IDs are validated, it sends a message to the user asking them to write their experience and sets their chat state to 'awaitingExperience'.
