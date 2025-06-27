const mongoose = require('mongoose');
const auditLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  userId: String,
  action: String,
  resource: String,
  metadata: Object,
});
module.exports = mongoose.model('AuditLog', auditLogSchema);