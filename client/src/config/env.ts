// Environment configuration
export const env = {
  apiUrl: import.meta.env.VITE_API_URL || '',
  socketUrl: import.meta.env.VITE_SOCKET_URL || '',
  nodeEnv: import.meta.env.MODE || 'development',
  appName: import.meta.env.VITE_APP_NAME || 'Dark Net',
  smartsupKey: import.meta.env.VITE_SMARTSUP_KEY || 'bb9710163cb1c5fd24a45b7698c2e606694c767a',
  telegramBotUrl: import.meta.env.VITE_TELEGRAM_BOT_URL || '',
} as const;

export default env;
