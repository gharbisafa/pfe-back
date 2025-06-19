const UserAccount = require("../models/userAccount");

const isAdmin = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await UserAccount.findById(userId).populate("userInfo");
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    next();
  } catch (err) {
    console.error("isAdmin middleware error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = isAdmin;
