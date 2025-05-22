const mongoose = require('mongoose');

const rsvpSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'UserAccount', required: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  status: { type: String, enum: ['going', 'interested', 'notgoing'], required: true },
}, { timestamps: true });

module.exports = mongoose.model('RSVP', rsvpSchema);