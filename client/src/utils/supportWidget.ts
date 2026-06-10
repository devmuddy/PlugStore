const SCRIPT_ID = 'chatra-loader-script';
const CHATRA_ID = '4KmBbTS45wjzju2iA';
const CHATRA_SRC = 'https://call.chatra.io/chatra.js';

const callChatra = (method: 'hide' | 'show' | 'closeChat'): void => {
  try {
    const chatra = (window as any).Chatra;
    if (typeof chatra === 'function') chatra(method);
  } catch {
    // Ignore.
  }
};

export const hideSupportWidget = (): void => {
  callChatra('closeChat');
  callChatra('hide');
};

export const showSupportWidget = (): void => {
  callChatra('show');
};

export const initSupportWidget = (): void => {
  try {
    if (!document.getElementById(SCRIPT_ID)) {
      (window as any).ChatraID = CHATRA_ID;
      (window as any).Chatra =
        (window as any).Chatra ||
        function (...args: unknown[]) {
          ((window as any).Chatra.q = (window as any).Chatra.q || []).push(args);
        };

      const script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.async = true;
      script.src = CHATRA_SRC;
      document.head.appendChild(script);
    }
  } catch (_error) {
    // Ignore widget initialization errors.
  }
};
