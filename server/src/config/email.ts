import nodemailer from 'nodemailer';
import { Resend } from 'resend';

// Resend HTTP API sender
let resendClient: Resend | null = null;

const getResendClient = (): Resend | null => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
};

// Create nodemailer SMTP transporter
const createTransporter = () => {
  const emailHost = process.env.EMAIL_HOST;
  const emailPort = process.env.EMAIL_PORT;
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailHost || !emailPort || !emailUser || !emailPass) {
    return null;
  }

  const port = parseInt(emailPort, 10);
  const secure =
    typeof process.env.EMAIL_SECURE === 'string'
      ? process.env.EMAIL_SECURE === 'true'
      : port === 465;
  const requireTLS =
    typeof process.env.EMAIL_REQUIRE_TLS === 'string'
      ? process.env.EMAIL_REQUIRE_TLS === 'true'
      : port === 587;
  const rejectUnauthorized =
    typeof process.env.EMAIL_TLS_REJECT_UNAUTHORIZED === 'string'
      ? process.env.EMAIL_TLS_REJECT_UNAUTHORIZED !== 'false'
      : true;

  return nodemailer.createTransport({
    host: emailHost,
    port,
    secure,
    requireTLS,
    auth: {
      user: emailUser,
      pass: emailPass,
    },
    tls: {
      servername: emailHost,
      rejectUnauthorized,
    },
  });
};

// Verify email connection
export const verifyEmailConnection = async (): Promise<boolean> => {
  // Resend takes priority
  const resend = getResendClient();
  if (resend) {
    console.log('✅ Email: Resend API configured');
    console.log(`   From: ${process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply'}`);
    return true;
  }

  // Fall back to SMTP
  try {
    const emailHost = process.env.EMAIL_HOST;
    const emailPort = process.env.EMAIL_PORT;
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailHost || !emailPort || !emailUser || !emailPass) {
      console.log('⚠️  Email: Not configured (missing environment variables)');
      console.log('   Configure RESEND_API_KEY or EMAIL_HOST/PORT/USER/PASS in .env');
      return false;
    }

    const transporter = createTransporter();
    if (!transporter) {
      console.log('⚠️  Email: Failed to create transporter');
      return false;
    }

    await transporter.verify();
    console.log('✅ Email: SMTP connected successfully');
    console.log(`   Host: ${emailHost}:${emailPort}`);
    console.log(`   User: ${emailUser}`);
    return true;
  } catch (error: any) {
    console.log('❌ Email: Connection failed');
    if (error.code === 'EAUTH') {
      console.log(`   Error: Authentication failed - Check your email and password`);
    } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      console.log(`   Error: Could not connect to ${process.env.EMAIL_HOST}`);
      console.log(`   Check your EMAIL_HOST and EMAIL_PORT settings`);
    } else {
      console.log(`   Error: ${error.message || 'Unknown error'}`);
    }
    return false;
  }
};

// Unified send mail — uses Resend if configured, otherwise SMTP
export const sendMail = async (options: {
  to: string | string[];
  subject: string;
  html: string;
}): Promise<void> => {
  const from = (() => {
    const emailFrom = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@example.com';
    const emailFromName = process.env.EMAIL_FROM_NAME || process.env.APP_NAME || 'Dark Net';
    return `${emailFromName} <${emailFrom}>`;
  })();

  const resend = getResendClient();
  if (resend) {
    const toArray = Array.isArray(options.to) ? options.to : [options.to];
    const { error } = await resend.emails.send({
      from,
      to: toArray,
      subject: options.subject,
      html: options.html,
    });
    if (error) {
      throw new Error(`Resend error: ${error.message}`);
    }
    return;
  }

  const transporter = createTransporter();
  if (!transporter) {
    console.warn('Email transporter not configured. Skipping email send.');
    return;
  }
  await transporter.sendMail({ from, to: options.to, subject: options.subject, html: options.html });
};

// Get email transporter (SMTP only — use sendMail for Resend-compatible sending)
export const getEmailTransporter = () => {
  return createTransporter();
};

export default {
  verifyEmailConnection,
  getEmailTransporter,
  sendMail,
};
