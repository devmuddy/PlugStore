import { env } from '../../config/env';

const MiniAppRequired = () => {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-6">
      <div className="w-full max-w-lg bg-white shadow-lg border border-slate-200 p-8">
        <h1 className="text-2xl font-semibold text-slate-900">Telegram Mini App Required</h1>
        <p className="mt-3 text-slate-600">
          User dashboard access is now available only inside Telegram Mini App.
        </p>
        {env.telegramBotUrl ? (
          <a
            href={env.telegramBotUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex mt-6 px-5 py-3 bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors"
          >
            Open In Telegram
          </a>
        ) : (
          <p className="mt-6 text-sm text-slate-500">
            Configure <code>VITE_TELEGRAM_BOT_URL</code> to show a direct launch button.
          </p>
        )}
      </div>
    </div>
  );
};

export default MiniAppRequired;
