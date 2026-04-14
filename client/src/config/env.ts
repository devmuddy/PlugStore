// Environment configuration
export const env = {
  apiUrl: import.meta.env.VITE_API_URL || '',
  socketUrl: import.meta.env.VITE_SOCKET_URL || '',
  nodeEnv: import.meta.env.MODE || 'development',
  appName: import.meta.env.VITE_APP_NAME || 'PlugStore',
  jivoWidgetId: import.meta.env.VITE_JIVO_WIDGET_ID || 'Q0NJtB8FbA',
  telegramBotUrl: import.meta.env.VITE_TELEGRAM_BOT_URL || '',
} as const;

export default env;
