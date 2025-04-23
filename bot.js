require("dotenv").config();
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { NewMessage } = require('telegram/events');
const input = require("input");
const fs = require("fs-extra");
const path = require("path");
const winston = require("winston");

// === 🔧 Змінні з .env ===
const apiId = parseInt(process.env.API_ID);
const apiHash = process.env.API_HASH;
const sourceChannel = process.env.SOURCE_CHANNEL;
const targetChat = process.env.TARGET_CHAT;

const sessionPath = path.join(__dirname, "session.txt");
const logsDir = path.join(__dirname, "logs");
fs.ensureDirSync(logsDir);

// === 📄 Логер ===
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(
      ({ timestamp, level, message }) => `[${timestamp}] ${level.toUpperCase()}: ${message}`
    )
  ),
  transports: [
    new winston.transports.File({ filename: path.join(logsDir, "bot.log") }),
    new winston.transports.Console(),
  ],
});

// === 📦 Сесія ===
let stringSession;
if (fs.existsSync(sessionPath)) {
  const saved = fs.readFileSync(sessionPath, "utf8");
  stringSession = new StringSession(saved);
  logger.info("✅ Використовую збережену сесію.");
} else {
  stringSession = new StringSession("");
  logger.info("🆕 Нова сесія.");
}

// === 🤖 Основна логіка ===
(async () => {
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.start({
    phoneNumber: async () => await input.text("📱 Введи номер телефону: "),
    password: async () => await input.text("🔐 Введи пароль (2FA, якщо є): "),
    phoneCode: async () => await input.text("📩 Введи код з Telegram: "),
    onError: (err) => logger.error("❌ Помилка авторизації: " + err),
  });

  // Збереження сесії
  const sessionStr = client.session.save();
  fs.writeFileSync(sessionPath, sessionStr);
  logger.info("💾 Сесію збережено в session.txt");

  logger.info("🚀 Бот запущений.");
  const channels = sourceChannel.split(",").map(c => c.trim());
  client.addEventHandler(
    async (update) => {
      try {
        const message = update.message;
        if (!message || !message.message) return;
        const text = message.message
        // if (text.toLowerCase().includes("вілсет" | "26" | "колеса" | "переднє колесо" | "заднє колесо" | "колеса вілсет")) {
        if (text.toLowerCase().includes("26" | "колеса")) {
          const chat = await message.getChat();
          const channelTitle = chat?.title || "Невідомий канал";
    
          const formattedMessage = `📣 *${channelTitle}*\n\n${text}`;
          
          await client.sendMessage(targetChat, {
            message: formattedMessage,
          });
    
          logger.info("➡️ Переслано:", formattedMessage);
        }
      } catch (err) {
        logger.error("❌ Помилка обробки повідомлення: " + err.message);
      }
    },
   
   new NewMessage({chats: channels})
  );
})();
