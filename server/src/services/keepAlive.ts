const ENABLED_VALUES = new Set(['1', 'true', 'yes', 'on']);
const DEFAULT_INTERVAL_MS = 12 * 60 * 1000; // 12 minutes
const DEFAULT_TIMEOUT_MS = 15 * 1000;

const toPositiveInt = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const isKeepAliveEnabled = (): boolean => {
  const raw = process.env.KEEP_ALIVE_ENABLED?.trim().toLowerCase();
  if (!raw) return process.env.NODE_ENV === 'production';
  return ENABLED_VALUES.has(raw);
};

const resolveKeepAliveTarget = (): string | null => {
  const baseUrl = process.env.KEEP_ALIVE_URL?.trim() || process.env.RENDER_EXTERNAL_URL?.trim();
  if (!baseUrl) return null;

  const path = (process.env.KEEP_ALIVE_PATH || '/health').trim();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  try {
    return new URL(normalizedPath, baseUrl).toString();
  } catch {
    return null;
  }
};

export const startKeepAlivePinger = (): void => {
  if (!isKeepAliveEnabled()) {
    return;
  }

  const targetUrl = resolveKeepAliveTarget();
  if (!targetUrl) {
    console.warn('⚠️ Keepalive skipped: set KEEP_ALIVE_URL or RENDER_EXTERNAL_URL.');
    return;
  }

  const intervalMs = Math.max(60 * 1000, toPositiveInt(process.env.KEEP_ALIVE_INTERVAL_MS, DEFAULT_INTERVAL_MS));
  const timeoutMs = toPositiveInt(process.env.KEEP_ALIVE_TIMEOUT_MS, DEFAULT_TIMEOUT_MS);
  let pingInFlight = false;

  const pingServer = async () => {
    if (pingInFlight) return;
    pingInFlight = true;

    const timeoutController = new AbortController();
    const timeoutHandle = setTimeout(() => timeoutController.abort(), timeoutMs);

    try {
      const response = await fetch(targetUrl, {
        method: 'GET',
        signal: timeoutController.signal,
        headers: {
          'User-Agent': 'logszone-render-keepalive',
        },
      });

      if (!response.ok) {
        console.warn(`⚠️ Keepalive ping failed with status ${response.status}: ${targetUrl}`);
      } else {
        console.log(`💓 Keepalive ping ok: ${targetUrl}`);
      }
    } catch (error) {
      console.warn(`⚠️ Keepalive ping error: ${targetUrl}`, error);
    } finally {
      clearTimeout(timeoutHandle);
      pingInFlight = false;
    }
  };

  const timer = setInterval(() => {
    void pingServer();
  }, intervalMs);

  if (typeof timer.unref === 'function') {
    timer.unref();
  }

  console.log(`🕒 Keepalive enabled: pinging ${targetUrl} every ${Math.round(intervalMs / 1000)}s`);
  void pingServer();
};
