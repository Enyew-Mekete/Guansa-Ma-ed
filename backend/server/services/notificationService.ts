
import nodemailer, { type Transporter } from "nodemailer";

export interface DispatchOptions {
  phone: string;
  email: string;
  name: string;
  code: string;
}

export interface DispatchResult {
  emailSent: boolean;
  smsSent: boolean;
  emailProvider: string;
  smsProvider: string;
  etherealPreviewUrl?: string;
  emailError?: string;
  error?: string;
}

interface EmailTransportConfig {
  transporter: Transporter;
  fromEmail: string;
  provider: string;
}

interface SmsResult {
  sent: boolean;
  provider: string;
  error?: string;
}

type MailRecipient = string | { address: string };

function getMailRecipientAddress(recipient: MailRecipient): string {
  return (typeof recipient === "string" ? recipient : recipient.address)
    .toLowerCase();
}

function normalizeEthiopianPhone(phone: string): string {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, "");

  if (digits.startsWith("251")) {
    return `+${digits}`;
  }

  if (digits.startsWith("0") && digits.length === 10) {
    return `+251${digits.slice(1)}`;
  }

  if (digits.length === 9) {
    return `+251${digits}`;
  }

  return trimmed.startsWith("+") ? `+${digits}` : trimmed;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });
}

/**
 * Creates a real SMTP transporter.
 * Ethereal is intentionally not used as a fallback.
 */
function createEmailTransporter(): EmailTransportConfig {
  const smtpUser =
    process.env.SMTP_USER || process.env.GMAIL_USER;

  const smtpPass =
    process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;

  const smtpHost =
    process.env.SMTP_HOST ||
    (smtpUser?.toLowerCase().endsWith("@gmail.com")
      ? "smtp.gmail.com"
      : undefined);

  const smtpPort = Number(process.env.SMTP_PORT || 465);
  const gmailAppPassword = smtpPass?.replace(/\s/g, "");

  if (!smtpUser || !smtpPass) {
    throw new Error(
      "Gmail OTP is not configured. Create a .env file in the project root, set SMTP_USER to your Gmail address and SMTP_PASS to a Google App Password, then restart the server."
    );
  }

  if (/YOUR_|APP_PASSWORD|CHANGEME/i.test(smtpPass)) {
    throw new Error(
      "SMTP_PASS is still a placeholder. Replace it in .env with a Google App Password, then restart the server."
    );
  }

  if (
    smtpHost?.toLowerCase().includes("gmail") &&
    (!gmailAppPassword || !/^[a-z0-9]{16}$/i.test(gmailAppPassword))
  ) {
    throw new Error(
      "Gmail SMTP_PASS must be a 16-character Google App Password. Remove spaces if present, then restart the server."
    );
  }

  if (!smtpHost) {
    throw new Error("SMTP_HOST is not configured.");
  }

  if (
    !Number.isInteger(smtpPort) ||
    smtpPort < 1 ||
    smtpPort > 65535
  ) {
    throw new Error("SMTP_PORT must be a valid port number.");
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpHost.toLowerCase().includes("gmail")
        ? gmailAppPassword
        : smtpPass,
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  });

  return {
    transporter,
    fromEmail: process.env.SMTP_FROM || smtpUser,
    provider: smtpHost.toLowerCase().includes("gmail")
      ? "Gmail SMTP"
      : "Custom SMTP Server",
  };
}

/**
 * Sends an OTP using Twilio, Africa's Talking, or Telegram.
 *
 * Telegram is a messaging notification, not SMS delivery.
 * The final simulated fallback is never reported as sent.
 */
async function dispatchSms(
  phone: string,
  code: string,
  name: string
): Promise<SmsResult> {
  const formattedPhone = normalizeEthiopianPhone(phone);

  const smsMessage =
    `[Guansa Ma'ed] Hello ${name}, your verification code is ` +
    `${code}. It expires in 5 minutes. Do not share it.`;

  const errors: string[] = [];

  // 1. Twilio
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

  if (accountSid && authToken && twilioNumber) {
    try {
      const url =
        `https://api.twilio.com/2010-04-01/Accounts/` +
        `${accountSid}/Messages.json`;

      const body = new URLSearchParams({
        To: formattedPhone,
        From: twilioNumber,
        Body: smsMessage,
      });

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization:
            "Basic " +
            Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
        },
        body: body.toString(),
      });

      if (response.ok) {
        // Twilio has accepted the message request; delivery may be pending.
        console.info("[Twilio] SMS request accepted.");
        return { sent: true, provider: "Twilio SMS" };
      }

      console.warn(`[Twilio] Request failed with HTTP ${response.status}.`);
      errors.push(`Twilio returned HTTP ${response.status}.`);
    } catch {
      console.warn("[Twilio] SMS request failed.");
      errors.push("Twilio request failed.");
    }
  }

  // 2. Africa's Talking
  const atApiKey = process.env.AFRICASTALKING_API_KEY;
  const atUsername = process.env.AFRICASTALKING_USERNAME;

  if (atApiKey && atUsername) {
    try {
      const body = new URLSearchParams({
        username: atUsername,
        to: formattedPhone,
        message: smsMessage,
      });

      const response = await fetch(
        "https://api.africastalking.com/version1/messaging",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            apiKey: atApiKey,
            Accept: "application/json",
          },
          body: body.toString(),
        }
      );

      if (response.ok) {
        const result = await response.json();

        const recipients =
          result?.SMSMessageData?.Recipients;

        const accepted = Array.isArray(recipients) &&
          recipients.some(
            (recipient: { statusCode?: number }) =>
              recipient.statusCode === 101 ||
              recipient.statusCode === 100
          );

        if (accepted) {
          console.info("[Africa's Talking] SMS request accepted.");
          return {
            sent: true,
            provider: "Africa's Talking SMS",
          };
        }

        console.warn(
          "[Africa's Talking] Response did not confirm acceptance."
        );
        errors.push("Africa's Talking did not confirm SMS acceptance.");
      } else {
        console.warn(
          `[Africa's Talking] Request failed with HTTP ${response.status}.`
        );
        errors.push(
          `Africa's Talking returned HTTP ${response.status}.`
        );
      }
    } catch {
      console.warn("[Africa's Talking] SMS request failed.");
      errors.push("Africa's Talking request failed.");
    }
  }

  // 3. Telegram notification (not an SMS)
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramChatId = process.env.TELEGRAM_CHAT_ID;

  if (telegramToken && telegramChatId) {
    try {
      const url =
        `https://api.telegram.org/bot${telegramToken}/sendMessage`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text:
            `Guansa Ma'ed Admin verification\n\n` +
            `Passcode: ${code}\n` +
            `Expires in 5 minutes.`,
        }),
      });

      const result = await response.json();

      if (response.ok && result?.ok === true) {
        console.info("[Telegram] Notification accepted.");
        return {
          sent: true,
          provider: "Telegram Notification (not SMS)",
        };
      }

      errors.push("Telegram did not confirm message acceptance.");
    } catch {
      console.warn("[Telegram] Notification request failed.");
      errors.push("Telegram request failed.");
    }
  }

  // No real provider accepted the request.
  // Do not print phone numbers, OTPs, or credentials.
  console.warn(
    "[SMS Gateway] No configured provider accepted the notification."
  );

  return {
    sent: false,
    provider: "Unavailable (no confirmed provider)",
    error: errors.length
      ? errors.join(" ")
      : "Configure Twilio or Africa's Talking for real SMS delivery.",
  };
}

/**
 * Main dispatcher: sends OTP email and SMS/notification.
 *
 * IMPORTANT:
 * - Run this module only on the server.
 * - Generate and verify OTPs on the server.
 * - emailSent means SMTP accepted the message, not guaranteed inbox delivery.
 */
export async function dispatchOtpNotifications({
  phone,
  email,
  name,
  code,
}: DispatchOptions): Promise<DispatchResult> {
  let emailSent = false;
  let emailProvider = "Unavailable";
  let emailError: string | undefined;

  if (!/^\d{6}$/.test(code)) {
    return {
      emailSent: false,
      smsSent: false,
      emailProvider: "Not attempted",
      smsProvider: "Not attempted",
      error: "The OTP must contain exactly six digits.",
    };
  }

  const safeName = escapeHtml(name);
  const safePhone = escapeHtml(phone);
  const safeEmail = escapeHtml(email);

  // 1. REAL EMAIL DELIVERY
  try {
    const emailConfig = createEmailTransporter();

    emailProvider = emailConfig.provider;

    const htmlBody = `
      <div style="
        font-family:Arial,sans-serif;
        max-width:600px;
        margin:0 auto;
        background:#ffffff;
        border:2px solid #344BC2;
        border-radius:16px;
        overflow:hidden;
      ">
        <div style="
          background:#344BC2;
          padding:24px;
          text-align:center;
          color:#ffffff;
        ">
          <h1 style="margin:0;font-size:24px;">
            Guansa Ma'ed ጓንሳ ማዕድ
          </h1>
          <p style="margin:6px 0 0;color:#f59e0b;">
            Ethiopian Restaurant Admin Security
          </p>
        </div>

        <div style="padding:32px 24px;color:#344BC2;">
          <p style="font-size:16px;font-weight:bold;">
            Hello ${safeName},
          </p>

          <p style="font-size:14px;line-height:1.6;color:#333333;">
            A request was made to sign in to the Guansa Ma'ed Admin Portal.
          </p>

          <div style="margin:28px 0;text-align:center;">
            <span style="
              display:inline-block;
              font-family:monospace;
              font-size:32px;
              font-weight:800;
              letter-spacing:8px;
              color:#344BC2;
              background:#f1f5f9;
              padding:16px 28px;
              border-radius:12px;
              border:2px dashed #344BC2;
            ">${code}</span>
          </div>

          <p style="font-size:13px;color:#64748b;">
            This one-time code expires in
            <strong>5 minutes</strong>. Never share it with anyone.
          </p>

          <div style="
            border-top:1px solid #e2e8f0;
            padding-top:16px;
            font-size:12px;
            color:#64748b;
          ">
            <p>Registered phone: ${safePhone}</p>
            <p>Registered email: ${safeEmail}</p>
            <p>Guansa Ma'ed Restaurant · Addis Ababa, Ethiopia</p>
          </div>
        </div>
      </div>
    `;

    const info = await emailConfig.transporter.sendMail({
      from: emailConfig.fromEmail,
      to: email,
      subject: "Guansa Ma'ed Admin Portal - Verification Code",
      text:
        `Hello ${name},\n\n` +
        `Your Guansa Ma'ed Admin Portal verification code is ${code}.\n` +
        `It expires in 5 minutes. Do not share this code.`,
      html: htmlBody,
    });

    // Nodemailer may report rejected recipients even when sendMail resolves.
    const acceptedRecipients = Array.isArray(info.accepted)
      ? info.accepted
      : [];

    const rejectedRecipients = Array.isArray(info.rejected)
      ? info.rejected
      : [];

    const recipientAccepted = acceptedRecipients.some(
      (recipient: MailRecipient) =>
        getMailRecipientAddress(recipient) === email.toLowerCase()
    );

    const recipientRejected = rejectedRecipients.some(
      (recipient: MailRecipient) =>
        getMailRecipientAddress(recipient) === email.toLowerCase()
    );

    if (!recipientAccepted || recipientRejected) {
      throw new Error("The SMTP server did not accept the recipient.");
    }

    emailSent = true;

    // Never log OTPs or SMTP credentials.
    console.info(
      `[Email Gateway] Message accepted by ${emailProvider}.`,
      { messageId: info.messageId }
    );
  } catch (error) {
    emailProvider = "Failed";

    emailError =
      error instanceof Error
        ? error.message
        : "Unknown email delivery error.";

    console.error("[Email Gateway Error]", emailError);
  }

  // 2. SMS / NOTIFICATION DELIVERY
  const smsResult = await dispatchSms(phone, code, name);

  const errors = [emailError, smsResult.error].filter(
    (value): value is string => Boolean(value)
  );

  return {
    emailSent,
    smsSent: smsResult.sent,
    emailProvider,
    smsProvider: smsResult.provider,
    emailError,
    error: errors.length ? errors.join(" ") : undefined,
  };
}
