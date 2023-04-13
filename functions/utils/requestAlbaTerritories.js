const axios = require('axios');
const albaTerritoriesEndPoint =
  require('../albaCredentials.json').territoriesEndPoint;

const requestAlbaTerritories = async (cookie) => {
  console.log('[requestAlbaTerritories] inside promisse');
  const options = {
    url: albaTerritoriesEndPoint,
    headers: {
      Cookie: cookie,
    },
  };

  try {
    const response = await axios(options);
    console.log('[requestAlbaTerritories] has response');
    const territories = response.data.data.html.territories;
    console.log('[requestAlbaTerritories] resolve about to be fired');
    return territories;
  } catch (error) {
    console.log('[requestAlbaTerritories] error', error);
    throw error || new Error('Failed to authenticate');
  }
};

module.exports = requestAlbaTerritories;
