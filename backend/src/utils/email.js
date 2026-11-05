const nodemailer = require("nodemailer");

let transporter;

function smtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransport() {
  if (!smtpConfigured()) return null;
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT) || 587;
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      disableFileAccess: true,
      disableUrlAccess: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function sendPasswordResetEmail({ to, name, resetUrl, expiresMinutes }) {
  const transport = getTransport();
  if (!transport) throw new Error("Email service is not configured");

  const safeName = escapeHtml(name || "there");
  const safeUrl = escapeHtml(resetUrl);

  await transport.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject: "Reset your Growth password",
    text: `Hi ${name || "there"},\n\nReset your password using this link (valid for ${expiresMinutes} minutes):\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px;color:#0f172a">
        <h2 style="margin:0 0 12px">Reset your password</h2>
        <p>Hi ${safeName},</p>
        <p>We received a request to reset your Growth account password.</p>
        <p style="margin:24px 0">
          <a href="${safeUrl}" style="display:inline-block;background:#0284c7;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600">Reset password</a>
        </p>
        <p style="font-size:13px;color:#64748b">This link is valid for ${expiresMinutes} minutes. If you did not request this, you can safely ignore this email.</p>
        <p style="font-size:13px;color:#64748b">If the button does not work, paste this URL into your browser:<br/>${safeUrl}</p>
      </div>
    `,
  });
}

module.exports = { sendPasswordResetEmail, smtpConfigured };
