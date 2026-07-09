import nodemailer from "nodemailer";
import { env, isSmtpConfigured } from "../config/env";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!isSmtpConfigured()) {
    throw new Error("SMTP is not configured");
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST!,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: {
        user: env.SMTP_USER!,
        pass: env.SMTP_PASS!,
      },
    });
  }

  return transporter;
}

function buildPasswordResetHtml(resetUrl: string): string {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #18181b;">
      <h2 style="margin: 0 0 12px;">Reset your ShopAI password</h2>
      <p>We received a request to reset your password. Click the button below to choose a new one.</p>
      <p style="margin: 24px 0;">
        <a
          href="${resetUrl}"
          style="display: inline-block; background: #18181b; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 600;"
        >
          Reset password
        </a>
      </p>
      <p>This link expires in 1 hour. If you did not request a password reset, you can ignore this email.</p>
      <p style="font-size: 12px; color: #71717a; word-break: break-all;">
        If the button does not work, copy and paste this URL into your browser:<br />
        ${resetUrl}
      </p>
    </div>
  `.trim();
}

export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string,
): Promise<void> {
  if (!isSmtpConfigured()) {
    if (env.NODE_ENV === "development") {
      console.info(
        `[password-reset] SMTP not configured. Reset link for ${email}:\n${resetUrl}`,
      );
      return;
    }

    throw new Error(
      "SMTP is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS, and SMTP_FROM.",
    );
  }

  const mailer = getTransporter();

  await mailer.sendMail({
    from: env.SMTP_FROM!,
    to: email,
    subject: "Reset your ShopAI password",
    text: [
      "Reset your ShopAI password",
      "",
      "We received a request to reset your password.",
      `Open this link to choose a new password (expires in 1 hour):`,
      resetUrl,
      "",
      "If you did not request this, you can ignore this email.",
    ].join("\n"),
    html: buildPasswordResetHtml(resetUrl),
  });

  console.info(`[password-reset] Reset email sent to ${email}`);
}

export { isSmtpConfigured };
