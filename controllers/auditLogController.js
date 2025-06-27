const AuditLog = require('../models/AuditLog');

exports.createLog = async (req, res) => {
  const { userId, action, resource, metadata } = req.body;
  const logEntry = new AuditLog({ userId, action, resource, metadata });
  await logEntry.save();
  res.status(201).json(logEntry);
};

exports.getLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 });
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching audit logs' });
  }
};