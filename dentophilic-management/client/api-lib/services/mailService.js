const nodemailer = require('nodemailer');

const DOCTOR_EMAIL = process.env.DOCTOR_EMAIL || 'drarthidentophilic@gmail.com';
const CLINIC_NAME = "Dr. Arthi's Dentophilic Centre";

function createTransporter() {
  const user = process.env.SMTP_USER || process.env.GMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;

  if (user && pass) {
    return nodemailer.createTransport({
      service: process.env.SMTP_SERVICE || 'gmail',
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user, pass }
    });
  }

  return null;
}

async function sendPasswordResetOtpEmail({ username, targetName, role, otpCode, ipAddress }) {
  const isAttender = role === 'ATTENDER';
  const roleTitle = isAttender ? 'Attender / Reception Staff' : 'Chief Doctor / Administrator';
  const accountDescription = isAttender
    ? `Attender Staff account (${targetName} - @${username})`
    : `Doctor account (${targetName} - @${username})`;

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); color: #1e293b;">
      <div style="background: linear-gradient(135deg, #7e22ce, #6b21a8); padding: 28px 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 20px; font-weight: 700;">${CLINIC_NAME}</h1>
        <p style="margin: 6px 0 0; font-size: 12px; opacity: 0.9;">Clinic Management Portal • Security Verification</p>
      </div>
      <div style="padding: 32px 24px;">
        <div style="font-size: 15px; font-weight: 600; margin-bottom: 12px;">Dear Dr. Arthi,</div>
        <div style="font-size: 13px; color: #475569; line-height: 1.6; margin-bottom: 24px;">
          A password reset was requested on the Clinic Management Portal for:
          <br><strong>${accountDescription}</strong>.
          <br><br>
          Please provide this One-Time Password (OTP) only to authorized clinic staff to approve the password change.
        </div>

        <div style="background: #faf5ff; border: 2px dashed #c084fc; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700; color: #7e22ce; margin-bottom: 8px;">6-Digit OTP Code</div>
          <div style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #581c87; margin: 0;">${otpCode}</div>
          <div style="font-size: 11px; color: #9333ea; margin-top: 8px; font-weight: 600;">Valid for 10 minutes only</div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 20px; background: #f8fafc; border-radius: 8px;">
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: 500; width: 35%;">Target Account:</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #0f172a;">@${username} (${targetName})</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: 500;">Account Role:</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #0f172a;">${roleTitle}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: 500;">Request Time:</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #0f172a;">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; color: #64748b; font-weight: 500;">Request IP:</td>
            <td style="padding: 8px 12px; font-weight: 600; color: #0f172a;">${ipAddress || '127.0.0.1'}</td>
          </tr>
        </table>

        <div style="font-size: 11px; color: #dc2626; margin-top: 20px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; line-height: 1.5;">
          <strong>Security Notice:</strong> If this password reset was not requested by you or authorized clinic staff, please disregard this email.
        </div>
      </div>
      <div style="padding: 18px 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; background: #fafafa;">
        &copy; ${new Date().getFullYear()} ${CLINIC_NAME} • Hosur, Tamil Nadu • Confidential Medical Management Alert
      </div>
    </div>
  `;

  const transporter = createTransporter();

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: `"${CLINIC_NAME} Security" <${process.env.SMTP_USER || DOCTOR_EMAIL}>`,
        to: DOCTOR_EMAIL,
        subject: `[Dentophilic Security] Password Reset OTP for @${username} (${targetName})`,
        html: htmlContent,
        text: `${CLINIC_NAME} - Password Reset OTP\n\nTarget Account: @${username} (${targetName})\nRole: ${roleTitle}\nOTP Code: ${otpCode}\nValid for 10 minutes.\n\nDispatched to Dr. Arthi's official email.`
      });
      console.log(`[MailService] Real email dispatched to ${DOCTOR_EMAIL} (ID: ${info.messageId})`);
      return { sent: true, mode: 'SMTP', to: DOCTOR_EMAIL, messageId: info.messageId };
    } catch (err) {
      console.error('[MailService] SMTP dispatch failed, fallback to logger:', err.message);
    }
  }

  // Fallback: development simulation with terminal highlight
  console.log('========================================================================');
  console.log(`📧 [PASSWORD RESET OTP DISPATCHED TO DOCTOR: ${DOCTOR_EMAIL}]`);
  console.log(`   Account: @${username} (${targetName}) - ${roleTitle}`);
  console.log(`   🔑 6-DIGIT OTP CODE: [ ${otpCode} ] (Valid for 10 minutes)`);
  console.log('========================================================================');

  return { sent: true, mode: 'CONSOLE_SIMULATION', to: DOCTOR_EMAIL };
}

module.exports = {
  sendPasswordResetOtpEmail,
  DOCTOR_EMAIL
};
