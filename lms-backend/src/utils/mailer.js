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

exports.sendAdminUserOtpEmail = async (email, otp, roleName = "HOD") => {
  const mailOptions = {
    from: `"ANITS LMS Administration" <${process.env.EMAIL_USER || "noreply@anits.edu.in"}>`,
    to: email,
    subject: `Verify Email for ANITS LMS ${roleName} Account 🔐`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 25px;">
          <h2 style="color: #1e293b; margin: 0; font-size: 24px; font-weight: 800;">ANITS LMS Verification</h2>
          <p style="color: #64748b; font-size: 14px; margin-top: 5px;">Department ${roleName} Account Creation</p>
        </div>
        
        <p style="color: #334155; font-size: 15px; line-height: 1.6;">
          You are receiving this email because an administrator is creating a <strong>${roleName}</strong> account for you on the ANITS Learning Management System.
        </p>

        <p style="color: #334155; font-size: 15px; line-height: 1.6;">
          Please provide the following 6-digit Verification Code to complete the account verification process:
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #2563eb; background: #eff6ff; padding: 14px 28px; border-radius: 12px; border: 1px dashed #bfdbfe; display: inline-block;">
            ${otp}
          </span>
        </div>

        <p style="color: #64748b; font-size: 13px;">
          ⏱️ This verification code is valid for <strong>10 minutes</strong>. If you did not expect this request, please inform your institution administrator.
        </p>
        
        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 25px 0;">
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">
          © ${new Date().getFullYear()} ANITS Autonomous Institute of Technology & Sciences. All rights reserved.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[MAILER] Admin OTP email sent to ${email}`);
  } catch (error) {
    console.error(`[MAILER] Error sending admin OTP email to ${email}:`, error.message);
    console.log(`[MAILER] Fallback OTP for ${email}: ${otp}`);
  }
};

exports.sendWelcomeCredentialsEmail = async ({ email, password, name, role, branch }) => {
  const isHod = (role || "").toUpperCase() === "ADMIN";
  const roleTitle = isHod ? "Department HOD" : "Faculty Member";

  const mailOptions = {
    from: `"ANITS LMS Portal" <${process.env.EMAIL_USER || "noreply@anits.edu.in"}>`,
    to: email,
    subject: `🎉 Your ANITS LMS Account Credentials - ${roleTitle}`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 620px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 24px; border-radius: 12px; color: #ffffff; text-align: center; margin-bottom: 25px;">
          <h1 style="margin: 0; font-size: 22px; font-weight: 800;">Welcome to ANITS LMS!</h1>
          <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9;">Account Verified & Successfully Created</p>
        </div>

        <p style="color: #1e293b; font-size: 16px; font-weight: 600;">Dear ${name || "User"},</p>
        <p style="color: #334155; font-size: 14px; line-height: 1.6;">
          Your <strong>${roleTitle}</strong> account for the <strong>${branch || "CSE"} Department</strong> has been successfully verified and activated.
        </p>

        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 20px; margin: 25px 0;">
          <h3 style="margin-top: 0; color: #0f172a; font-size: 15px; border-b: 1px solid #e2e8f0; padding-bottom: 8px;">🔑 Your Login Credentials</h3>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600; width: 130px;">Login Email:</td>
              <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${email}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Default Password:</td>
              <td style="padding: 6px 0; color: #2563eb; font-weight: 700; font-family: monospace; font-size: 16px;">${password}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Assigned Role:</td>
              <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${roleTitle} (${branch})</td>
            </tr>
          </table>
        </div>

        <p style="color: #475569; font-size: 13px; line-height: 1.5;">
          💡 Please keep this email for your reference. You can log in using these credentials at any time and change your password in your Profile Settings.
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="http://localhost:8080/auth" style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px; display: inline-block;">
            Access ANITS LMS Portal →
          </a>
        </div>

        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 25px 0;">
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">
          © ${new Date().getFullYear()} ANITS Autonomous Institute of Technology & Sciences.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[MAILER] Welcome credentials email sent to ${email}`);
  } catch (error) {
    console.error(`[MAILER] Error sending welcome credentials email to ${email}:`, error.message);
  }
};

exports.sendPasswordChangedNoticeEmail = async ({ email, name, role, branch, newPassword }) => {
  const mailOptions = {
    from: `"ANITS LMS Portal" <${process.env.EMAIL_USER || "noreply@anits.edu.in"}>`,
    to: email,
    subject: `🔐 Security Notice: Your ANITS LMS Password Has Been Updated`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; border: 1px solid #cbd5e1; border-radius: 16px; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 20px; border-radius: 12px; color: #ffffff; text-align: center; margin-bottom: 25px;">
          <h2 style="margin: 0; font-size: 20px; font-weight: 800;">Password Updated Successfully 🔐</h2>
          <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">ANITS LMS Security Notification</p>
        </div>

        <p style="color: #1e293b; font-size: 15px; font-weight: 600;">Dear ${name || "User"},</p>
        <p style="color: #334155; font-size: 14px; line-height: 1.6;">
          This email confirms that the password for your ANITS LMS account (<strong>${email}</strong>) was successfully changed on <strong>${new Date().toLocaleString()}</strong>.
        </p>

        <div style="background-color: #f8fafc; border: 1px dashed #94a3b8; border-radius: 12px; padding: 18px; margin: 22px 0;">
          <h4 style="margin-top: 0; color: #0f172a; font-size: 14px;">Updated Account Summary</h4>
          <p style="margin: 4px 0; font-size: 13px; color: #475569;"><strong>Email:</strong> ${email}</p>
          <p style="margin: 4px 0; font-size: 13px; color: #475569;"><strong>Updated Password:</strong> <span style="font-family: monospace; font-weight: bold; color: #2563eb;">${newPassword}</span></p>
          <p style="margin: 4px 0; font-size: 13px; color: #475569;"><strong>Role:</strong> ${role || "Member"}</p>
        </div>

        <p style="color: #64748b; font-size: 13px; line-height: 1.5;">
          ⚠️ If you initiated this password change, no further action is required. If you did NOT change your password, please contact your ANITS LMS administrator immediately.
        </p>

        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 25px 0;">
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">
          © ${new Date().getFullYear()} ANITS Autonomous Institute of Technology & Sciences.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[MAILER] Password updated notice email sent to ${email}`);
  } catch (error) {
    console.error(`[MAILER] Error sending password update notice email to ${email}:`, error.message);
  }
};


