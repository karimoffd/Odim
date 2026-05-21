const TelegramBot = require('node-telegram-bot-api');
const TELEGRAM_TOKEN = '8862096129:AAElvj7naYtnhehF66GgFBua_12tngCbd34';

console.log("Testing Telegram Bot Connection...");
const bot = new TelegramBot(TELEGRAM_TOKEN, {
  polling: false,
  request: { agentOptions: { family: 4 } }
});

bot.getMe().then(me => {
  console.log("Bot Details:", me);
  process.exit(0);
}).catch(err => {
  console.error("Error connecting to bot:", err);
  process.exit(1);
});
