const axios = require('axios');

async function fetchPrice(symbol = 'BTCUSDT') {
  const res = await axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
  return parseFloat(res.data.price);
}

module.exports = { fetchPrice };
