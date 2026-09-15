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

export type SendEmailResult = { sent: true } | { sent: false; error: string };

/** Best-effort notification email — never throws when SMTP isn't configured
 *  or the send fails, so a broken/unset mail setup never takes down
 *  whatever triggered the notification (e.g. the sync cron job). Still
 *  logs, but also returns the failure reason so the caller can persist it
 *  somewhere visible (e.g. cronJobStatuses.lastEmailError) instead of it
 *  only ever existing in server logs. */
export async function sendNotificationEmail({
  to,
  subject,
  text,
}: {
  to: string;
  subject: string;
  text: string;
}): Promise<SendEmailResult> {
  const transporter = getTransporter();
  if (!transporter) {
    const error = "SMTP nav konfigurēts (trūkst SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASSWORD).";
    console.warn("sendNotificationEmail: SMTP is not configured, skipping send.", { subject });
    return { sent: false, error };
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject,
      text,
    });
    return { sent: true };
  } catch (caught) {
    const error = caught instanceof Error ? caught.message : String(caught);
    console.error("sendNotificationEmail: failed to send.", caught);
    return { sent: false, error };
  }
}
