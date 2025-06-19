const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  type: { type: String, enum: ['event', 'comment'], required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  reason: { type: String, required: true },
  extra: { type: String },
  reportedAt: { type: Date, default: Date.now },
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'UserAccount' },
});

module.exports = mongoose.model('Report', reportSchema);
