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

export async function sendUserBannedEmail({ to, fullName, banReason, bannedAt, unbannedAt }) {
  if (!to) {
    return { skipped: true, reason: 'missing-recipient' };
  }

  const transporter = createTransporter();
  if (!transporter) {
    console.warn('[Email] SMTP config is missing, skip sending ban notification email');
    return { skipped: true, reason: 'smtp-not-configured' };
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const subject = 'Thông báo tài khoản của bạn đã bị khóa';
  const safeBanReason = banReason?.trim() || 'Vi phạm điều khoản dịch vụ.';
  const supportEmail = process.env.SMTP_USER || 'support@animelearn.com';
  
  // Định dạng thời gian ban
  const bannedDate = bannedAt ? new Date(bannedAt).toLocaleString('vi-VN') : 'N/A';
  
  // Kiểm tra ban tạm thời hay vĩnh viễn
  let banTypeText = 'vĩnh viễn';
  let unbannedDateText = '';
  
  if (unbannedAt) {
    const unbannedDate = new Date(unbannedAt);
    const now = new Date();
    
    if (unbannedDate > now) {
      banTypeText = 'tạm thời';
      unbannedDateText = unbannedDate.toLocaleString('vi-VN');
    }
  }

  const emailText = [
    `Xin chào ${fullName || 'bạn'},`,
    '',
    `Tài khoản của bạn đã bị khóa ${banTypeText}.`,
    `Thời gian khóa: ${bannedDate}`,
    unbannedDateText ? `Thời gian mở khóa: ${unbannedDateText}` : 'Tài khoản sẽ bị khóa vĩnh viễn.',
    '',
    `Lý do khóa: ${safeBanReason}`,
    '',
    'Nếu bạn cho rằng đây là lỗi, vui lòng liên hệ với đội hỗ trợ của chúng tôi.',
  ].filter(Boolean).join('\n');

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
      <h2 style="margin: 0 0 12px; color: #dc2626;">Thông báo tài khoản đã bị khóa</h2>
      <p>Xin chào <strong>${fullName || 'bạn'}</strong>,</p>
      <p>Tài khoản của bạn đã bị khóa <strong>${banTypeText}</strong>.</p>
      <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 12px; margin: 16px 0; border-radius: 4px;">
        <p style="margin: 8px 0;"><strong>Thời gian khóa:</strong> ${bannedDate}</p>
        ${unbannedDateText ? `<p style="margin: 8px 0;"><strong>Thời gian mở khóa:</strong> ${unbannedDateText}</p>` : `<p style="margin: 8px 0; color: #991b1b;"><strong>Loại khóa:</strong> Vĩnh viễn</p>`}
        <p style="margin: 8px 0;"><strong>Lý do:</strong> ${safeBanReason}</p>
      </div>
      <p>Nếu bạn cho rằng đây là lỗi, vui lòng <a href="mailto:${supportEmail}" style="color: #2563eb;">liên hệ với đội hỗ trợ của chúng tôi</a>.</p>
    </div>
  `;

  await transporter.sendMail({
    from,
    to,
    subject,
    text: emailText,
    html: emailHtml,
  });

  return { skipped: false };
}