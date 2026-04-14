import crypto from 'crypto';

export interface TelegramMiniAppUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  allows_write_to_pm?: boolean;
  photo_url?: string;
}

export interface TelegramAuthVerificationResult {
  authDate: number;
  queryId?: string;
  user: TelegramMiniAppUser;
}

const buildDataCheckString = (initData: string): { dataCheckString: string; hash: string } => {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');

  if (!hash) {
    throw new Error('Missing hash in Telegram initData');
  }

  const pairs: string[] = [];
  params.forEach((value, key) => {
    if (key !== 'hash') {
      pairs.push(`${key}=${value}`);
    }
  });

  pairs.sort();

  return {
    dataCheckString: pairs.join('\n'),
    hash,
  };
};

export const verifyTelegramInitData = (
  initData: string,
  botToken: string,
  maxAgeSeconds: number = 24 * 60 * 60
): TelegramAuthVerificationResult => {
  if (!initData || typeof initData !== 'string') {
    throw new Error('Telegram initData is required');
  }

  if (!botToken) {
    throw new Error('Telegram bot token is required');
  }

  const { dataCheckString, hash } = buildDataCheckString(initData);
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  const hashBuffer = Buffer.from(hash, 'hex');
  const calculatedHashBuffer = Buffer.from(calculatedHash, 'hex');
  const isHashValid =
    hashBuffer.length === calculatedHashBuffer.length &&
    crypto.timingSafeEqual(hashBuffer, calculatedHashBuffer);

  if (!isHashValid) {
    throw new Error('Invalid Telegram initData signature');
  }

  const params = new URLSearchParams(initData);
  const authDate = Number(params.get('auth_date') || 0);
  const nowInSeconds = Math.floor(Date.now() / 1000);

  if (!authDate || Number.isNaN(authDate)) {
    throw new Error('Invalid auth_date in Telegram initData');
  }

  if (nowInSeconds - authDate > maxAgeSeconds) {
    throw new Error('Telegram initData has expired');
  }

  const userRaw = params.get('user');
  if (!userRaw) {
    throw new Error('Missing Telegram user in initData');
  }

  let user: TelegramMiniAppUser;
  try {
    user = JSON.parse(userRaw) as TelegramMiniAppUser;
  } catch (_error) {
    throw new Error('Invalid Telegram user payload');
  }

  if (!user.id) {
    throw new Error('Telegram user id is missing');
  }

  return {
    authDate,
    queryId: params.get('query_id') || undefined,
    user,
  };
};
