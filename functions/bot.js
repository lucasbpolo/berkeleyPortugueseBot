const TelegramBot = require('node-telegram-bot-api');
const validateUserIds = require('./utils/validateUserIds');
const parseAlbaHTML = require('./utils/parseAlbaHTML');
const requestAlbaTerritories = require('./utils/requestAlbaTerritories');

const init = ({ db, telegramToken, albaCookie, env }) => {
  const chatStates = {};
  const territoryState = {
    type: '1', // 1 - valid | 2 - search
    region: '2', // 1 - Marin | 2 - kindgom hall | 3 - wallnut creek
  };

  const isDevEnv = env === 'DEV';

  const bot = new TelegramBot(telegramToken, {
    polling: isDevEnv ? true : false,
  });

  const commands = {
    cadastro: 'cadastre-se para obter/devolver territórios',
    territorio: 'pedir um território',
    devolver: 'devolver território',
    experiencia: 'relatar experiência durante a campanha',
  };

  bot.onText(/\/start/, (msg) => {
    let helpMessage = 'Olá!\n\n';
    helpMessage +=
      'Eu sou o Bot que controla a distribuição de territórios para a campanha de pregação.\n\n';
    helpMessage += 'Estes são os comandos que eu conheço:\n\n';

    for (const command in commands) {
      helpMessage += `/${command}: ${commands[command]}\n\n`;
    }

    bot.sendMessage(msg.chat.id, helpMessage);
  });

  bot.onText(/\/cadastro/, async (msg) => {
    const userId = msg.from.id;
    const userInfo = msg.from;

    // Retrieve the current value of the authorizedUserIds node
    const snapshot = await db.ref('authorizedUserIds').once('value');
    const authorizedUserIds = snapshot.val();

    // Add the new user ID to the array
    if (
      authorizedUserIds.includes(userId) ||
      authorizedUserIds.includes(Number(userId + '999'))
    ) {
      bot.sendMessage(
        msg.chat.id,
        `Já recebemos o seu pedido, em breve você terá acesso as outras funcionalidades.`
      );
    } else {
      authorizedUserIds.push(Number(userId + '999'));

      // Update the value of the authorizedUserIds node
      await db.ref('authorizedUserIds').set(authorizedUserIds);

      // Save the user info to a new node in the database
      await db.ref('userInfo').child(userId).set(userInfo);

      bot.sendMessage(
        msg.chat.id,
        `As informações da sua conta no Telegram foram salvas:\n\n"${JSON.stringify(
          msg.from
        )}"\n\nUm administrador irá te dar acesso as outras funcionalidades em breve.\n\nVolte em algumas horas para verificar se o acesso já foi aprovado!`
      );
    }
  });

  bot.onText(/\/territorio/, async (msg) => {
    validateUserIds(db)(msg, async () => {
      const userId = msg.from.id;

      const snapshot = await db
        .ref('userInfo')
        .child(userId)
        .child('territory')
        .once('value');

      if (snapshot.exists()) {
        const territory = snapshot.val();
        const territoryURL = territory[0].details[2].url;
        // Check if the value you're looking for is present in the territoryData array
        bot.sendMessage(
          msg.chat.id,
          `Você já possui um território:\n\nURL:\n${territoryURL}\n\nSe você já finalizou esse território e precisa de um novo, primeiro clique para /devolver seu território.`
        );
      } else {
        // The territory key does not exist
        bot.sendMessage(
          msg.chat.id,
          'Você gostaria de um territorio em qual região?\n\nDigite:\n\n1 - para a região de Marin\n2 - para a região do salão do Reino\n3 - para a região de Wallnut Creek'
        );

        chatStates[msg.chat.id] = 'awaitingRegion';
      }
    }).catch((err) => {
      bot.sendMessage(msg.chat.id, err.message);
    });
  });

  bot.onText(/\/devolver/, async (msg) => {
    validateUserIds(db)(msg, async () => {
      const userId = msg.from.id;

      await db.ref('userInfo').child(userId).update({ territory: null });

      bot.sendMessage(msg.chat.id, 'Seu território foi devolvido!');
    }).catch((err) => {
      bot.sendMessage(msg.chat.id, err.message);
    });
  });

  bot.onText(/\/experiencia/, (msg) => {
    validateUserIds(db)(msg, () => {
      bot.sendMessage(msg.chat.id, 'Escreva sua experiência:');
      chatStates[msg.chat.id] = 'awaitingExperience';
    }).catch((err) => {
      bot.sendMessage(msg.chat.id, err.message);
    });
  });

  bot.on('message', async (msg) => {
    if (chatStates[msg.chat.id] === 'awaitingExperience' && msg.text) {
      const userInput = msg.text;

      // Save the user's experience to the database
      await db.ref('experiences').push({
        ...msg.from,
        message: userInput,
      });

      bot.sendMessage(
        msg.chat.id,
        `Obrigado por relatar sua experiência.\n\nEla foi salva e será enviada a betel!\n\nEXPERIENCIA:\n\n ${userInput}`
      );

      chatStates[msg.chat.id] = null;

      return;
    }

    if (chatStates[msg.chat.id] === 'awaitingRegion' && msg.text) {
      if (msg.text === '1' || msg.text === '2' || msg.text === '3') {
        territoryState.region = msg.text;

        bot.sendMessage(
          msg.chat.id,
          'Você gostaria de um territorio com endereços:\n\n1 - para endereços validos\n2 - endereços para fazer search'
        );

        chatStates[msg.chat.id] = 'awaitingTypeOfAddress';
      } else {
        bot.sendMessage(
          msg.chat.id,
          `Por favor, digite apenas uma das opções validas`
        );
      }

      return;
    }

    if (chatStates[msg.chat.id] === 'awaitingTypeOfAddress' && msg.text) {
      if (msg.text === '1' || msg.text === '2') {
        territoryState.type = msg.text;

        try {
          console.log('[territorio]');
          const albaHTML = await requestAlbaTerritories(albaCookie);

          console.log('[territorio] [albaHTML]');

          const territoriesJSON = parseAlbaHTML(albaHTML);

          console.log('[territorio] territoriesJSON parsed');

          // TO-DO: update to retrive territory based on the region and type: territoryState.
          const randomIndex = Math.floor(
            Math.random() * territoriesJSON.length
          );
          const territory = territoriesJSON[randomIndex];

          const territoryURL = territory.details[2].url;
          const territoryId = territory.id;
          const territoryName = territory.territory;
          const territoryCity = territory.city;

          const userId = msg.from.id;

          // Save the user info to a new node in the database
          await db
            .ref('userInfo')
            .child(userId)
            .update({ territory: [territory] });

          console.log(
            '[territorio] return message about to be sent, territoryID = '
          );
          bot.sendMessage(
            msg.chat.id,
            `Obrigado por fornecer as seguintes informações:\n\nTipo de território: ${territoryState.type}\nRegião do território: ${territoryState.region}\n\nVocê foi designado para trabalhar no território: \n${territoryName}\n\nNa cidade(s) de:\n${territoryCity}.\n\nAqui está o link para o seu território:\n${territoryURL}`
          );

          console.log('[territorio] return message sent');
          // });
        } catch (err) {
          console.log('[territorio] error message ### ', err);
          bot.sendMessage(msg.chat.id, err.message);
        }

        chatStates[msg.chat.id] = null;
      } else {
        bot.sendMessage(
          msg.chat.id,
          `Por favor, digite apenas uma das opções validas`
        );
      }

      return;
    }
  });

  return bot;
};

module.exports = init;
