const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendOtpEmail = async (email, otp) => {
  const mailOptions = {
    from: `"Lumen LMS Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify your Lumen LMS Account 🔐",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
        <h2 style="color: #333; text-align: center;">Welcome to Lumen LMS</h2>
        <p>Thank you for joining our community. To complete your registration, please use the verification code below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4F46E5; background: #f3f4f6; padding: 10px 20px; border-radius: 8px;">
            ${otp}
          </span>
        </div>
        <p>This code will expire in 10 minutes. If you didn't request this, please ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #e1e1e1; margin: 20px 0;">
        <p style="font-size: 12px; color: #666; text-align: center;">
          © ${new Date().getFullYear()} Lumen LMS. All rights reserved.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[MAILER] OTP email sent to ${email}`);
  } catch (error) {
    console.error(`[MAILER] Error sending email to ${email}:`, error.message);
    // In development, we still log the OTP so the user can continue even if email fails
    console.log(`[MAILER] Fallback OTP for ${email}: ${otp}`);
  }
};
