// models/report.js
const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["event", "comment"],
    required: true,
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
  extra: String,
  reportedAt: {
    type: Date,
    default: Date.now,
  },
  // here we reference the UserAccount model by its ObjectId
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserAccount",
    required: true,
  },
});

module.exports = mongoose.model("Report", reportSchema);
