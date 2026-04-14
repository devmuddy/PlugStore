export interface TelegramMiniAppUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe?: {
    user?: TelegramMiniAppUser;
  };
  ready?: () => void;
  expand?: () => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

export const getTelegramWebApp = (): TelegramWebApp | null => {
  return window.Telegram?.WebApp || null;
};

export const isTelegramMiniApp = (): boolean => {
  const webApp = getTelegramWebApp();
  return Boolean(webApp?.initData && webApp?.initDataUnsafe?.user?.id);
};

export const getTelegramInitData = (): string => {
  return getTelegramWebApp()?.initData || '';
};

export const expandTelegramWebApp = (): void => {
  const webApp = getTelegramWebApp();
  if (!webApp) {
    return;
  }

  try {
    webApp.ready?.();
    webApp.expand?.();
  } catch (_error) {
    // Ignore Mini App API errors to avoid blocking app startup.
  }
};
