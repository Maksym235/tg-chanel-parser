require("dotenv").config();
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const input = require("input");

const apiId = parseInt(process.env.API_ID);
const apiHash = process.env.API_HASH;
const stringSession = new StringSession(""); // Порожня строка

(async () => {
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.start({
    phoneNumber: async () => await input.text("📱 Введи номер телефону: "),
    password: async () => await input.text("🔐 2FA пароль (якщо є): "),
    phoneCode: async () => await input.text("📩 Код з Telegram: "),
    onError: (err) => console.log(err),
  });

  console.log("✅ Авторизовано!");
  console.log("🔑 STRING_SESSION:", client.session.save());
})();
