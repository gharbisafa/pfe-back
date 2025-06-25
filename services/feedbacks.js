// services/feedbacks.js
const mongoose = require("mongoose");
const Feedback = require("../models/feedbacks");
const Event = require("../models/event");

/** Recalculate and persist avg & count */
async function _recalcStats(eventId) {
  const stats = await Feedback.aggregate([
    // need 'new' here to construct an ObjectId instance
    { $match: { event: new mongoose.Types.ObjectId(eventId) } },
    { $group: { _id: null, avg: { $avg: "$rating" }, cnt: { $sum: 1 } } }
  ]);
  const { avg = 0, cnt = 0 } = stats[0] || {};
  await Event.findByIdAndUpdate(eventId, {
    averageRating: avg,
    feedbackCount: cnt
  });
}

async function addFeedback(eventId, userId, rating, message) {
  // ensure event exists
  const event = await Event.findById(eventId);
  if (!event) throw new Error("Event not found");

  // one‐per‐user
  if (await Feedback.exists({ event: eventId, user: userId })) {
    throw new Error("You have already submitted feedback for this event.");
  }

  const feedback = await Feedback.create({ event: eventId, user: userId, rating, message });
  await _recalcStats(eventId);
  return feedback;
}

async function getFeedbackByEvent(eventId) {
  return Feedback.find({ event: eventId })
    .populate("user", "email profileImage") // pull in user info
    .sort({ createdAt: -1 });
}

async function updateFeedback(feedbackId, userId, rating, message) {
  const feedback = await Feedback.findOneAndUpdate(
    { _id: feedbackId, user: userId },
    { rating, message },
    { new: true }
  );
  if (!feedback) throw new Error("Feedback not found or unauthorized");

  await _recalcStats(feedback.event);
  return feedback;
}

async function deleteFeedback(feedbackId, userId) {
  const feedback = await Feedback.findOneAndDelete({ _id: feedbackId, user: userId });
  if (!feedback) throw new Error("Feedback not found or unauthorized");

  await _recalcStats(feedback.event);
}

async function toggleFeedbackLike(feedbackId, userId) {
  const feedback = await Feedback.findById(feedbackId);
  if (!feedback) throw new Error("Feedback not found");

  const idx = feedback.likes.indexOf(userId);
  if (idx === -1) feedback.likes.push(userId);
  else feedback.likes.splice(idx, 1);

  await feedback.save();
  return feedback;
}

module.exports = {
  addFeedback,
  getFeedbackByEvent,
  updateFeedback,
  deleteFeedback,
  toggleFeedbackLike,
};
