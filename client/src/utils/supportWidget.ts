import { env } from '../config/env';

const SCRIPT_ID = 'smartsupp-loader-script';

const callSmartsupp = (method: string, ...args: unknown[]): void => {
  try {
    const s = (window as any).smartsupp;
    if (typeof s === 'function') {
      s(method, ...args);
    }
  } catch {
    // Ignore.
  }
};

export const hideSupportWidget = (): void => {
  callSmartsupp('chat:hide');
  callSmartsupp('chat:close');
};

export const showSupportWidget = (): void => {
  callSmartsupp('chat:show');
};

export const initSupportWidget = (): void => {
  if (!env.smartsupKey) return;

  try {
    if (!document.getElementById(SCRIPT_ID)) {
      // Set up the global smartsupp function queue before the script loads.
      (window as any).smartsupp = (window as any).smartsupp || function (...args: unknown[]) {
        (window as any).smartsupp._.push(args);
      };
      (window as any).smartsupp._ = (window as any).smartsupp._ || [];

      const script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.type = 'text/javascript';
      script.charset = 'utf-8';
      script.async = true;
      script.defer = true;
      script.src = `https://www.smartsuppchat.com/loader.js?key=${env.smartsupKey}`;
      document.head.appendChild(script);
    }
  } catch (_error) {
    // Ignore widget initialization errors.
  }
};
