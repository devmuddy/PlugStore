/**
 * Telegram notification utility.
 * Sends messages to a configured admin chat via the bot token.
 * Set ADMIN_TELEGRAM_CHAT_ID in .env to the admin's Telegram user ID or group chat ID.
 */

const sendTelegramMessage = async (chatId: string, text: string): Promise<void> => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || !chatId) return;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    });
    if (!res.ok) {
      const data = await res.json() as { description?: string };
      console.error('Telegram notify error:', data.description);
    }
  } catch (err) {
    console.error('Telegram notify failed:', err);
  }
};

// Send a notification to the admin chat
export const notifyAdmin = (text: string): void => {
  const chatId = process.env.ADMIN_TELEGRAM_CHAT_ID;
  if (!chatId) return;
  void sendTelegramMessage(chatId, text);
};

// Send a notification to a specific Telegram user (by their telegramId)
export const notifyUser = (telegramId: string, text: string): void => {
  if (!telegramId) return;
  void sendTelegramMessage(telegramId, text);
};
