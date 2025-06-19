const Report = require("../models/report");

const create = async (req, res) => {
  try {
    const { type, targetId, reason, extra } = req.body;
    const reporter = req.user.id;

    const report = await Report.create({
      type,
      targetId,
      reason,
      extra,
      reporter,
      reportedAt: new Date(),
    });

    res.status(201).json({ success: true, report });
  } catch (error) {
    console.error("Error creating report:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
const getAll = async (req, res) => {
  const reports = await Report.find().populate("reporter", "userInfo.name").sort({ reportedAt: -1 });
  res.json(reports);
};

module.exports = { create, getAll };
