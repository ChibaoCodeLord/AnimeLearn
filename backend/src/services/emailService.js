import nodemailer from 'nodemailer';

function hasSmtpConfig() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function createTransporter() {
  if (!hasSmtpConfig()) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: String(process.env.SMTP_SECURE || 'false') === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendVideoRejectedEmail({ to, fullName, title, reason, videoId }) {
  if (!to) {
    return { skipped: true, reason: 'missing-recipient' };
  }

  const transporter = createTransporter();
  if (!transporter) {
    console.warn('[Email] SMTP config is missing, skip sending rejection email');
    return { skipped: true, reason: 'smtp-not-configured' };
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const subject = `Video của bạn đã bị từ chối: ${title}`;
  const safeReason = reason?.trim() || 'Video chưa đáp ứng tiêu chí duyệt.';

  await transporter.sendMail({
    from,
    to,
    subject,
    text: [
      `Xin chào ${fullName || 'bạn'},`,
      '',
      `Video "${title}" của bạn đã bị từ chối.`,
      `Lý do: ${safeReason}`,
      videoId ? `Mã video: ${videoId}` : '',
      '',
      'Bạn có thể chỉnh sửa và gửi duyệt lại khi đã sẵn sàng.',
    ].filter(Boolean).join('\n'),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
        <h2 style="margin: 0 0 12px;">Video của bạn đã bị từ chối</h2>
        <p>Xin chào <strong>${fullName || 'bạn'}</strong>,</p>
        <p>Video <strong>${title}</strong> của bạn đã bị từ chối.</p>
        <p><strong>Lý do:</strong> ${safeReason}</p>
        ${videoId ? `<p><strong>Mã video:</strong> ${videoId}</p>` : ''}
        <p>Bạn có thể chỉnh sửa và gửi duyệt lại khi đã sẵn sàng.</p>
      </div>
    `,
  });

  return { skipped: false };
}