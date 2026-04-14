interface TelegramUser {
  id: number;
  first_name: string;
  username?: string;
}

interface TelegramChat {
  id: number;
  type: string;
}

interface TelegramMessage {
  message_id: number;
  text?: string;
  chat: TelegramChat;
  from?: TelegramUser;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

interface TelegramApiResponse<T> {
  ok: boolean;
  result: T;
  description?: string;
}

export class TelegramBotService {
  private readonly miniAppUrl: string;
  private readonly apiBaseUrl: string;
  private isRunning = false;
  private offset = 0;
  private readonly lastStartReplyByChat = new Map<number, number>();

  constructor(token: string, miniAppUrl: string) {
    this.miniAppUrl = miniAppUrl;
    this.apiBaseUrl = `https://api.telegram.org/bot${token}`;
  }

  private async apiRequest<T>(method: string, body?: Record<string, unknown>): Promise<T> {
    const response = await fetch(`${this.apiBaseUrl}/${method}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = (await response.json()) as TelegramApiResponse<T>;
    if (!response.ok || !data.ok) {
      throw new Error(data.description || `Telegram API error (${response.status})`);
    }

    return data.result;
  }

  private async sendStartMessage(chatId: number, user?: TelegramUser): Promise<void> {
    const displayName = user?.username
      ? `@${user.username}`
      : user?.first_name || 'there';

    const text = [
      `Hello ${displayName}, welcome to PlugStore.`,
      'PlugStore lets you browse digital products, place orders, and manage your wallet in one place.',
      'Tap Get Started below to open the app.',
    ].join('\n');

    const replyMarkup = this.buildReplyMarkup();

    if (!replyMarkup) {
      await this.apiRequest('sendMessage', {
        chat_id: chatId,
        text,
      });
      return;
    }

    try {
      await this.apiRequest('sendMessage', {
        chat_id: chatId,
        text,
        reply_markup: replyMarkup,
      });
    } catch (error) {
      // Fall back to plain text if Telegram rejects web_app/url markup.
      console.warn('⚠️ Telegram start button rejected, sending plain text fallback:', error);
      await this.apiRequest('sendMessage', {
        chat_id: chatId,
        text,
      });
    }
  }

  private async sendFallbackMessage(chatId: number): Promise<void> {
    await this.apiRequest('sendMessage', {
      chat_id: chatId,
      text: 'Send /start to open the dashboard.',
    });
  }

  private isValidHttpsUrl(urlValue: string): boolean {
    try {
      const parsed = new URL(urlValue);
      return parsed.protocol === 'https:';
    } catch (_error) {
      return false;
    }
  }

  private isTelegramDeepLink(urlValue: string): boolean {
    try {
      const parsed = new URL(urlValue);
      return parsed.hostname === 't.me' || parsed.hostname === 'telegram.me';
    } catch (_error) {
      return false;
    }
  }

  private buildReplyMarkup():
    | {
        inline_keyboard: Array<
          Array<
            | { text: string; web_app: { url: string } }
            | { text: string; url: string }
          >
        >;
      }
    | undefined {
    if (!this.miniAppUrl) {
      return undefined;
    }

    // Telegram `web_app` buttons require a valid HTTPS app URL.
    if (this.isValidHttpsUrl(this.miniAppUrl) && !this.isTelegramDeepLink(this.miniAppUrl)) {
      return {
        inline_keyboard: [
          [
            {
              text: 'Get Started',
              web_app: {
                url: this.miniAppUrl,
              },
            },
          ],
        ],
      };
    }

    // Fallback for links like `https://t.me/<bot>?startapp=...`.
    if (this.isValidHttpsUrl(this.miniAppUrl)) {
      return {
        inline_keyboard: [
          [
            {
              text: 'Get Started',
              url: this.miniAppUrl,
            },
          ],
        ],
      };
    }

    return undefined;
  }

  private async handleUpdate(update: TelegramUpdate): Promise<void> {
    const message = update.message;
    if (!message?.chat?.id) {
      return;
    }

    const text = (message.text || '').trim();
    const command = text.split(/\s+/)[0]?.toLowerCase();
    const isStartCommand = command === '/start' || command?.startsWith('/start@');

    if (isStartCommand) {
      const now = Date.now();
      const lastReplyAt = this.lastStartReplyByChat.get(message.chat.id) || 0;

      // Prevent burst duplicates when users tap /start repeatedly or old updates replay.
      if (now - lastReplyAt < 4000) {
        return;
      }

      await this.sendStartMessage(message.chat.id, message.from);
      this.lastStartReplyByChat.set(message.chat.id, now);
      return;
    }

    await this.sendFallbackMessage(message.chat.id);
  }

  private async pollLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        const updates = await this.apiRequest<TelegramUpdate[]>('getUpdates', {
          offset: this.offset,
          timeout: 30,
          allowed_updates: ['message'],
        });

        for (const update of updates) {
          try {
            await this.handleUpdate(update);
          } catch (updateError) {
            console.error('Telegram update handling error:', updateError);
          } finally {
            this.offset = update.update_id + 1;
          }
        }
      } catch (error) {
        console.error('Telegram bot polling error:', error);
        const message = error instanceof Error ? error.message : String(error);
        if (
          message.includes('can\'t use getUpdates method while webhook is active') ||
          message.includes('Conflict: terminated by other getUpdates request')
        ) {
          await this.ensurePollingMode();
        }
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  }

  private async ensurePollingMode(): Promise<void> {
    try {
      await this.apiRequest('deleteWebhook', {
        // Drop stale pending updates on restart to avoid delayed duplicate replies.
        drop_pending_updates: true,
      });
      console.log('ℹ️ Telegram webhook cleared; polling mode enabled');
    } catch (error) {
      console.error('Failed to ensure Telegram polling mode:', error);
    }
  }

  public start(): void {
    if (this.isRunning) {
      return;
    }
    this.isRunning = true;
    void (async () => {
      await this.ensurePollingMode();
      await this.pollLoop();
    })();
    console.log('🤖 Telegram bot polling started');
  }
}

export const startTelegramBotIfConfigured = (): void => {
  const token = process.env.TELEGRAM_BOT_TOKEN || '';
  const miniAppUrl = process.env.TELEGRAM_MINI_APP_URL || '';
  const rawBotEnabled = process.env.TELEGRAM_BOT_ENABLED?.toLowerCase();
  const botEnabled =
    rawBotEnabled !== undefined
      ? rawBotEnabled !== 'false'
      : (process.env.NODE_ENV === 'production');

  if (!botEnabled) {
    console.log('ℹ️ Telegram bot polling disabled (set TELEGRAM_BOT_ENABLED=true to force enable)');
    return;
  }

  if (!token) {
    console.log('ℹ️ Telegram bot not started (TELEGRAM_BOT_TOKEN is missing)');
    return;
  }

  if (!miniAppUrl) {
    console.log('ℹ️ Telegram bot started without mini app button (TELEGRAM_MINI_APP_URL is missing)');
  }

  const bot = new TelegramBotService(token, miniAppUrl);
  bot.start();
};
