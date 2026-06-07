import crypto from 'crypto';
import { sendMail } from '../config/email';

export const generateToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const getAppName = (): string => {
  return process.env.APP_NAME || process.env.SITE_NAME || process.env.EMAIL_FROM_NAME || 'Dark Net';
};

export const getEmailFrom = (): string => {
  const emailFrom = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@darknet.com';
  const emailFromName = getAppName();
  return `${emailFromName} <${emailFrom}>`;
};

const renderEmail = (
  appName: string,
  heading: string,
  intro: string,
  detailsHtml: string,
  footerLines: string[]
): string => {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 40px 24px; color: #111827;">
      <p style="font-size: 14px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; margin: 0 0 20px 0; color: #374151;">${appName}</p>
      <h1 style="font-size: 22px; font-weight: 700; margin: 0 0 14px 0; color: #111827;">${heading}</h1>
      <p style="font-size: 14px; line-height: 22px; margin: 0 0 20px 0; color: #374151;">${intro}</p>
      <div style="font-size: 14px; line-height: 22px; color: #111827; margin: 0 0 20px 0;">${detailsHtml}</div>
      <div style="font-size: 12px; line-height: 18px; color: #6b7280; margin-top: 20px;">
        ${footerLines.map((line) => `<p style=\"margin: 0 0 6px 0;\">${line}</p>`).join('')}
      </div>
    </div>
  `;
};

const row = (label: string, value: string): string => {
  return `<p style="margin: 0 0 8px 0;"><strong style="color:#111827;">${label}:</strong> <span style="color:#374151;">${value}</span></p>`;
};

const money = (amount: number): string => amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const sendPasswordResetEmail = async (email: string, token: string): Promise<void> => {
  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
  const appName = getAppName();

  await sendMail({
    to: email,
    subject: `Reset Your Password - ${appName}`,
    html: renderEmail(
      appName,
      'Reset your password',
      'We received a request to reset your password. Use the link below to set a new password.',
      `${row('Reset link', `<a href="${resetUrl}" style="color:#111827; text-decoration: underline;">${resetUrl}</a>`)}`,
      ['This reset link expires in 1 hour.', 'If you did not request this, you can ignore this email.']
    ),
  });
};

export const sendBalanceUpdateEmail = async (
  email: string,
  username: string | undefined,
  action: 'credit' | 'debit',
  amount: number,
  previousBalance: number,
  newBalance: number
): Promise<void> => {
  const actionText = action === 'credit' ? 'credited' : 'debited';
  const appName = getAppName();

  try {
    await sendMail({
      to: email,
      subject: `Account Balance ${action === 'credit' ? 'Credited' : 'Debited'} - ${appName}`,
      html: renderEmail(
        appName,
        'Balance update',
        `Hello ${username || 'User'}, your account has been ${actionText}.`,
        [
          row('Amount', `${action === 'credit' ? '+' : '-'}$${money(amount)}`),
          row('Previous balance', `$${money(previousBalance)}`),
          row('New balance', `$${money(newBalance)}`),
        ].join(''),
        ['If you have questions about this transaction, contact support.', 'This is an automated notification.']
      ),
    });
    console.log(`Balance update email sent to ${email}`);
  } catch (error) {
    console.error('Failed to send balance update email:', error);
  }
};

export const sendOrderConfirmationEmail = async (
  email: string,
  username: string | undefined,
  orderNumber: string,
  productName: string,
  amount: number,
  _orderId: string
): Promise<void> => {
  const appName = getAppName();

  try {
    await sendMail({
      to: email,
      subject: `Order Confirmation - ${orderNumber} - ${appName}`,
      html: renderEmail(
        appName,
        'Order confirmed',
        `Hello ${username || 'User'}, your order has been confirmed.`,
        [
          row('Order number', orderNumber),
          row('Product', productName),
          row('Total', `$${money(amount)}`),
        ].join(''),
        ['Your product details will arrive in a follow-up email shortly.', 'If you have questions, contact support.']
      ),
    });
    console.log(`Order confirmation email sent to ${email} for order ${orderNumber}`);
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
  }
};

export const sendDepositSubmissionEmail = async (
  email: string,
  username: string | undefined,
  amount: number,
  currency: string,
  transactionHash: string,
  depositId: string
): Promise<void> => {
  const appName = getAppName();

  try {
    await sendMail({
      to: email,
      subject: `Deposit Submitted - ${currency} ${money(amount)} - ${appName}`,
      html: renderEmail(
        appName,
        'Deposit submitted',
        `Hello ${username || 'User'}, your deposit has been submitted successfully and is pending review.`,
        [
          row('Amount', `${currency} ${money(amount)}`),
          row('Status', 'Pending review'),
          row('Transaction hash', transactionHash),
          row('Deposit ID', depositId),
        ].join(''),
        ['You will receive a Telegram notification once your deposit has been reviewed.', 'If you have questions, contact support.']
      ),
    });
    console.log(`Deposit submission email sent to ${email} for deposit ${depositId}`);
  } catch (error) {
    console.error('Failed to send deposit submission email:', error);
  }
};

export const sendDepositApprovedEmail = async (
  email: string,
  username: string | undefined,
  amount: number,
  currency: string,
  newBalance: number
): Promise<void> => {
  const appName = getAppName();

  try {
    await sendMail({
      to: email,
      subject: `Deposit Approved - ${currency} ${money(amount)} - ${appName}`,
      html: renderEmail(
        appName,
        'Deposit approved',
        `Hello ${username || 'User'}, your deposit has been approved and your wallet has been credited.`,
        [
          row('Amount', `${currency} ${money(amount)}`),
          row('Status', 'Approved'),
          row('New balance', `$${money(newBalance)}`),
        ].join(''),
        ['If you have questions, contact support.', 'This is an automated notification.']
      ),
    });
    console.log(`Deposit approved email sent to ${email}`);
  } catch (error) {
    console.error('Failed to send deposit approved email:', error);
  }
};

export const sendDepositRejectedEmail = async (
  email: string,
  username: string | undefined,
  amount: number,
  currency: string
): Promise<void> => {
  const appName = getAppName();

  try {
    await sendMail({
      to: email,
      subject: `Deposit Rejected - ${currency} ${money(amount)} - ${appName}`,
      html: renderEmail(
        appName,
        'Deposit rejected',
        `Hello ${username || 'User'}, your deposit has been rejected.`,
        [
          row('Amount', `${currency} ${money(amount)}`),
          row('Status', 'Rejected'),
        ].join(''),
        ['If you have questions, please contact support.', 'This is an automated notification.']
      ),
    });
    console.log(`Deposit rejected email sent to ${email}`);
  } catch (error) {
    console.error('Failed to send deposit rejected email:', error);
  }
};
