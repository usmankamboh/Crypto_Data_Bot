const axios = require('axios');

const fetchCryptoData = async (tokenSymbol) => {
  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${tokenSymbol}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    throw new Error('Error fetching crypto data');
  }
};

module.exports = { fetchCryptoData };
