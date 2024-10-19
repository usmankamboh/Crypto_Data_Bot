const TelegramBot = require('node-telegram-bot-api');
const { fetchCryptoData } = require('./services/cryptoData');
const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('./config/db');
const User = require('./models/user');
const Alert = require('./models/alert');

connectDB();
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

// Command: /start
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "Welcome! Use /register to start.");
});

// Command: /register
bot.onText(/\/register/, async (msg) => {
  const telegramId = msg.chat.id;
  const user = await User.findOne({ telegramId });
  if (!user) {
    const newUser = new User({ telegramId, registered: true });
    await newUser.save();
    bot.sendMessage(telegramId, "You are now registered!");
  } else {
    bot.sendMessage(telegramId, "You are already registered.");
  }
});

// Command: /get_token <token_symbol>
bot.onText(/\/get_token (.+)/, async (msg, match) => {
  const tokenSymbol = match[1].toLowerCase();
  try {
    const data = await fetchCryptoData(tokenSymbol);
    const price = data[tokenSymbol].usd;
    const mcap = data[tokenSymbol].usd_market_cap;
    const volume = data[tokenSymbol].usd_24h_vol;
    const change = data[tokenSymbol].usd_24h_change;
    const message = `Token: ${tokenSymbol.toUpperCase()}\nPrice: $${price}\nMarket Cap: $${mcap}\n24h Volume: $${volume}\n24h Change: ${change}%`;
    bot.sendMessage(msg.chat.id, message);
  } catch (error) {
    bot.sendMessage(msg.chat.id, "Error fetching data. Please try again.");
  }
});

// Command: /set_alert <token_symbol> <price_threshold>
bot.onText(/\/set_alert (.+) (.+)/, async (msg, match) => {
  const tokenSymbol = match[1].toLowerCase();
  const priceThreshold = parseFloat(match[2]);
  const user = await User.findOne({ telegramId: msg.chat.id });
  const newAlert = new Alert({ userId: user._id, tokenSymbol, priceThreshold });
  await newAlert.save();
  bot.sendMessage(msg.chat.id, `Alert set for ${tokenSymbol} at $${priceThreshold}`);
});

// Command: /list_alerts
bot.onText(/\/list_alerts/, async (msg) => {
  const user = await User.findOne({ telegramId: msg.chat.id });
  const alerts = await Alert.find({ userId: user._id });
  if (alerts.length > 0) {
    let message = "Your Alerts:\n";
    alerts.forEach((alert, index) => {
      message += `${index + 1}. Token: ${alert.tokenSymbol.toUpperCase()}, Threshold: $${alert.priceThreshold}\n`;
    });
    bot.sendMessage(msg.chat.id, message);
  } else {
    bot.sendMessage(msg.chat.id, "No active alerts.");
  }
});

// Command: /remove_alert <alert_id>
bot.onText(/\/remove_alert (.+)/, async (msg, match) => {
  const alertId = match[1];
  await Alert.findByIdAndDelete(alertId);
  bot.sendMessage(msg.chat.id, "Alert removed.");
});

setInterval(async () => {
  const alerts = await Alert.find().populate('userId');
  
  for (const alert of alerts) {
    const data = await fetchCryptoData(alert.tokenSymbol);
    const currentPrice = data[alert.tokenSymbol].usd;

    if (currentPrice >= alert.priceThreshold) {
      bot.sendMessage(alert.userId.telegramId, `Price alert triggered for ${alert.tokenSymbol.toUpperCase()}! Current price: $${currentPrice}`);
      await Alert.findByIdAndDelete(alert._id);
    }
  }
}, 60000); // 1 mint
