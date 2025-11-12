import nodemailer from 'nodemailer';

// Initialize email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export async function sendLicenseEmail(to, licenseKey, plan, orderId) {
  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: `Your License Key - ${plan} Plan`,
    html: `
      <h2>✅ Payment Successful!</h2>
      <p>Thank you for your purchase.</p>
      
      <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <p><strong>License Key:</strong></p>
        <p style="font-family: monospace; font-size: 14px; word-break: break-all;">
          ${licenseKey}
        </p>
      </div>
      
      <p><strong>Order Details:</strong></p>
      <ul>
        <li>Plan: ${plan}</li>
        <li>Order ID: ${orderId}</li>
        <li>Date: ${new Date().toISOString()}</li>
      </ul>
      
      <p>Keep your license key safe. You'll need it for activation.</p>
      <p>If you have any questions, reply to this email.</p>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ License email sent to:', to);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email send failed:', error.message);
    return { success: false, error: error.message };
  }
}

export async function sendPaymentConfirmation(to, plan, amount, orderId) {
  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: 'Payment Confirmation',
    html: `
      <h2>Payment Confirmation</h2>
      <p>Thank you for your order.</p>
      
      <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Plan:</strong> ${plan}</p>
        <p><strong>Amount:</strong> $${Number(amount).toFixed(2)} AUD</p>
        <p><strong>Order ID:</strong> ${orderId}</p>
      </div>
      
      <p>Your license will be delivered shortly.</p>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Confirmation email sent to:', to);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email send failed:', error.message);
    return { success: false, error: error.message };
  }
}

export async function sendAdminNotification(plan, amount, email, orderId) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return { success: false, error: 'Admin email not configured' };

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: adminEmail,
    subject: `🎉 New Payment - ${plan} Plan`,
    html: `
      <h2>New Payment Received!</h2>
      
      <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Customer Email:</strong> ${email}</p>
        <p><strong>Plan:</strong> ${plan}</p>
        <p><strong>Amount:</strong> $${Number(amount).toFixed(2)} AUD</p>
        <p><strong>Order ID:</strong> ${orderId}</p>
        <p><strong>Date:</strong> ${new Date().toISOString()}</p>
      </div>
      
      <p><a href="${process.env.PAYLINK_SELF_URL || 'http://localhost:4000'}/server/admin?pass=${process.env.ADMIN_PASS}">View Admin Dashboard</a></p>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Admin notification sent');
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Admin email send failed:', error.message);
    return { success: false, error: error.message };
  }
}
