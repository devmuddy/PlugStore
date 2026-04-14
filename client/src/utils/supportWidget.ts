import { env } from '../config/env';

type JivoApi = {
  showWidget?: () => void;
  hideWidget?: () => void;
  open?: () => void;
  close?: () => void;
};

const SCRIPT_ID = 'jivochat-loader-script';
const WIDGET_SELECTOR = 'iframe[src*="jivosite.com"], iframe[id*="jivo"], div[id*="jivo"], jdiv';

const getJivoApi = (): JivoApi | null => {
  return ((window as any).jivo_api as JivoApi) || null;
};

const setWidgetVisibility = (visible: boolean): void => {
  const nodes = document.querySelectorAll<HTMLElement>(WIDGET_SELECTOR);
  nodes.forEach((node) => {
    node.style.display = visible ? '' : 'none';
  });
};

export const hideSupportWidget = (): void => {
  try {
    const jivoApi = getJivoApi();
    jivoApi?.hideWidget?.();
    jivoApi?.close?.();
  } catch (_error) {
    // Ignore widget hide errors.
  }

  setWidgetVisibility(false);
};

export const showSupportWidget = (): void => {
  try {
    const jivoApi = getJivoApi();
    jivoApi?.showWidget?.();
  } catch (_error) {
    // Ignore widget show errors.
  }

  setWidgetVisibility(true);
};

export const initSupportWidget = (): void => {
  if (!env.jivoWidgetId) return;

  try {
    if (!document.getElementById(SCRIPT_ID)) {
      const script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.type = 'text/javascript';
      script.charset = 'utf-8';
      script.async = true;
      script.src = `https://code.jivosite.com/widget/${env.jivoWidgetId}`;
      document.head.appendChild(script);
    }
  } catch (_error) {
    // Ignore widget initialization errors.
  }
};
