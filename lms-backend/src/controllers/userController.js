const { User } = require("../models");
const bcrypt = require("bcryptjs");
const { sendPasswordChangedNoticeEmail } = require("../utils/mailer");

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check if user is using default password
    const isDefault = user.isDefaultPassword !== false || (await bcrypt.compare("password123", user.password));

    const userPlain = user.toJSON();
    delete userPlain.password;
    delete userPlain.verificationOtp;
    userPlain.isDefaultPassword = isDefault;

    return res.json(userPlain);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching profile", error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, bio, profilePicture, skills, socialLinks } = req.body;
    const userId = req.user?.userId || req.user?.id;
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    await user.update({
      name: name || user.name,
      bio: bio !== undefined ? bio : user.bio,
      profilePicture: profilePicture !== undefined ? profilePicture : user.profilePicture,
      skills: skills !== undefined ? skills : user.skills,
      socialLinks: socialLinks !== undefined ? socialLinks : user.socialLinks,
    });

    return res.json({ message: "Profile updated successfully", user });
  } catch (error) {
    return res.status(500).json({ message: "Error updating profile", error: error.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user?.userId || req.user?.id;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, error: "Both current password and new password are required." });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!passwordRegex.test(newPassword.trim())) {
      return res.status(400).json({
        success: false,
        error: "New password must be at least 8 characters long and include at least one lowercase letter, one uppercase letter, one number, and one special character."
      });
    }

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ success: false, error: "User account not found." });

    // Verify current old password
    const isOldMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isOldMatch) {
      return res.status(400).json({ success: false, error: "Current password is incorrect. Please try again." });
    }

    // Hash new password and update user
    const hashedNewPassword = await bcrypt.hash(newPassword.trim(), 10);
    await user.update({
      password: hashedNewPassword,
      isDefaultPassword: false,
    });

    // Send security notification email with updated details
    await sendPasswordChangedNoticeEmail({
      email: user.email,
      name: user.name,
      role: user.role,
      branch: user.branch,
      newPassword: newPassword.trim(),
    });

    return res.json({
      success: true,
      message: "Your password has been changed successfully! A confirmation email has been sent to your inbox.",
    });
  } catch (error) {
    console.error("Error changing password:", error);
    return res.status(500).json({ success: false, error: error.message || "Failed to update password." });
  }
};

