const dashboardService = require("../services/dashboard");

const getUserDashboard = async (req, res) => {
  try {
    const userId = req.user._id; // Extract authenticated user's ID from the JWT payload

    // Fetch user activity data from the service layer
    const result = await dashboardService.getUserActivity(userId);

    // Send the result as a response
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching user dashboard:", error);
    res.status(500).json({ error: "FETCH_DASHBOARD_FAILED" });
  }
};

module.exports = {
  getUserDashboard,
};