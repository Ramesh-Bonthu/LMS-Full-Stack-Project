const { User } = require("../models");

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId, {
      attributes: { exclude: ["password", "verificationOtp"] }
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching profile", error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, bio, profilePicture, skills, socialLinks } = req.body;
    const user = await User.findByPk(req.user.userId);
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
