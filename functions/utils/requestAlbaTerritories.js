const request = require('request');
const retry = require('retry');
const albaTerritoriesEndPoint =
  require('../albaCredentials.json').territoriesEndPoint;

const requestAlbaTerritories = (cookie) => {
  return new Promise((resolve, reject) => {
    const operation = retry.operation({
      retries: 3,
      factor: 1,
      minTimeout: 1000,
      maxTimeout: 5000,
      randomize: true,
    });

    operation.attempt((currentAttempt) => {
      const options = {
        url: albaTerritoriesEndPoint,
        headers: {
          Cookie: cookie,
        },
      };

      request(options, (error, response, body) => {
        if (error) {
          reject(error);
          return;
        }

        // Check if cookie is still valid
        if (response.statusCode === 401) {
          if (operation.retry(error)) {
            return;
          }
        }

        const parsedJSON = JSON.parse(body);

        const territories = parsedJSON.data.html.territories;
        resolve(territories);
      });
    });
  });
};

module.exports = requestAlbaTerritories;
