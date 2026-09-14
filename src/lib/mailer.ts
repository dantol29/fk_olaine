import "server-only";
import nodemailer from "nodemailer";

/** Lazily built so a missing SMTP config doesn't crash anything at import
 *  time — only surfaces when an email is actually about to be sent. */
function getTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD) return null;

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
  });
}

/** Best-effort notification email — logs and returns false instead of
 *  throwing when SMTP isn't configured or the send fails, so a broken/unset
 *  mail setup never takes down whatever triggered the notification (e.g.
 *  the sync cron job). */
export async function sendNotificationEmail({
  to,
  subject,
  text,
}: {
  to: string;
  subject: string;
  text: string;
}): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn("sendNotificationEmail: SMTP is not configured, skipping send.", { subject });
    return false;
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject,
      text,
    });
    return true;
  } catch (error) {
    console.error("sendNotificationEmail: failed to send.", error);
    return false;
  }
}
