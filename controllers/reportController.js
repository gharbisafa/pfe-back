// controllers/reportController.js
const Report = require("../models/report");
const Event = require("../models/event");
const Comment = require("../models/comment");

// POST /api/report
const create = async (req, res) => {
  try {
    const { type, targetId, reason, extra} = req.body;
    console.log("📣 req.user is:", req.user);

    // use the Mongoose virtual .id (string) for ease
    const reporter = req.user._id;

    console.log("📣 Creating report, reporter is:", reporter);

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

// GET /api/report
// returns Report[] with reporter populated to include only userInfo.name
const getAll = async (req, res) => {
  try {
    const reports = await Report.find()
      .sort({ reportedAt: -1 })
      .populate({
        path: "reporter",            // 1st level: reporter → UserAccount
        select: "userInfo",          // only grab the userInfo ObjectId
        populate: {
          path: "userInfo",          // 2nd level: userInfo → User
          model: "User",             // matches mongoose.model("User", …)
          select: "name",            // only grab the name
        },
      })
      .lean();                       // convert to plain JS objects

    console.log("📣 GET /api/report →", reports);
    return res.json(reports);
  } catch (err) {
    console.error("Error fetching reports:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
const getById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate({
        path: "reporter",
        select: "email userInfo",
        populate: {
          path: "userInfo",
          model: "User",
          select: "name",
        },
      })
      .lean();
    if (!report) return res.status(404).json({ message: "Report not found" });

    if (report.type === "event") {
      report.event = await Event.findById(report.targetId)
        .select("title startDate endDate location description")
        .lean();
    } else {
      // ◀️ HERE: fetch the actual comment body
      report.comment = await Comment.findById(report.targetId)
        .select("message createdAt author")
        .populate({
          path: "author",
          select: "userInfo",
          populate: {
            path: "userInfo",
            model: "User",
            select: "name",
          },
        })
        .lean();
    }

    return res.json(report);
  } catch (err) {
    console.error("Error fetching single report:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { create, getAll, getById };
