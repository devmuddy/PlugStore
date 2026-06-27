const SCRIPT_ID = 'jivo-widget-script';
const JIVO_SRC = '//code.jivosite.com/widget/UD3NjRvSV7';

const callJivo = (method: 'open' | 'close' | 'show' | 'hide'): void => {
  try {
    const jivo = (window as any).jivo_api;
    if (typeof jivo === 'object' && typeof jivo[method] === 'function') {
      jivo[method]();
    }
  } catch {
    // Ignore.
  }
};

export const hideSupportWidget = (): void => {
  callJivo('close');
  callJivo('hide');
};

export const showSupportWidget = (): void => {
  callJivo('show');
  callJivo('open');
};

export const initSupportWidget = (): void => {
  try {
    if (!document.getElementById(SCRIPT_ID)) {
      const script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.async = true;
      script.src = JIVO_SRC;
      document.head.appendChild(script);
    }
  } catch (_error) {
    // Ignore widget initialization errors.
  }
};
