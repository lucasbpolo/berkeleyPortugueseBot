const TelegramBot = require('node-telegram-bot-api');
const validateUserIds = require('./utils/validateUserIds');

const init = ({ db, telegramToken, env }) => {
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

  bot.onText(/\/territorio/, (msg) => {
    validateUserIds(db)(msg, () => {
      const userId = msg.from.id;
      const url =
        'https://www.mcmxiv.com/alba/print-mk?territory=4096,596510,rp3by9,63dd3cb7&&address_only=0&m=1&o=1&l=1&d=1&c_n=1&c_t=1&c_l=1&c_nt=1&g=0&cl=1&clm=20&clss=1&st=1,2,3'; // Replace this with your URL generation logic

      bot.sendMessage(msg.chat.id, `O Link do seu Território é:\n\n${url}`);
    }).catch((err) => {
      bot.sendMessage(msg.chat.id, err.message);
    });
  });

  bot.onText(/\/devolver/, (msg) => {
    validateUserIds(db)(msg, () => {
      const userId = msg.from.id;
      // deleteUrl(userId); // Replace this with your URL removal logic

      bot.sendMessage(msg.chat.id, 'Seu território foi devolvido!');
    }).catch((err) => {
      bot.sendMessage(msg.chat.id, err.message);
    });
  });

  const chatStates = {};

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
    }
  });

  return bot;
};

module.exports = init;
