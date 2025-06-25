// controllers/feedbacks.js
const feedbacksService = require("../services/feedbacks");

const addFeedback = async (req, res) => {
  const { eventId } = req.params;
  const { rating, message } = req.body;
  const userId = req.user._id;

  try {
    const feedback = await feedbacksService.addFeedback(eventId, userId, rating, message);
    return res.status(201).json(feedback);
  } catch (err) {
    console.error("Error adding feedback:", err);
    if (err.message === "Event not found") {
      return res.status(404).json({ error: err.message });
    }
    if (err.message.includes("already submitted")) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: "FEEDBACK_CREATION_FAILED" });
  }
};

const getFeedbackByEvent = async (req, res) => {
  const { eventId } = req.params;
  try {
    const feedbacks = await feedbacksService.getFeedbackByEvent(eventId);
    return res.status(200).json(feedbacks);
  } catch (err) {
    console.error("Error fetching feedback:", err);
    return res.status(500).json({ error: "FETCH_FAILED" });
  }
};

// New: fetch just the aggregates
const getEventRating = async (req, res) => {
  const { eventId } = req.params;
  try {
    const { averageRating, feedbackCount } = await feedbacksService.getEventRating(eventId);
    return res.status(200).json({ averageRating, feedbackCount });
  } catch (err) {
    console.error("Error fetching rating:", err);
    if (err.message === "Event not found") {
      return res.status(404).json({ error: err.message });
    }
    return res.status(500).json({ error: "RATING_FETCH_FAILED" });
  }
};

const updateFeedback = async (req, res) => {
  const { feedbackId } = req.params;
  const { rating, message } = req.body;
  const userId = req.user._id;

  try {
    const updated = await feedbacksService.updateFeedback(feedbackId, userId, rating, message);
    return res.status(200).json(updated);
  } catch (err) {
    console.error("Error updating feedback:", err);
    if (err.message.includes("not found")) {
      return res.status(404).json({ error: err.message });
    }
    if (err.message.includes("unauthorized")) {
      return res.status(403).json({ error: err.message });
    }
    return res.status(500).json({ error: "UPDATE_FAILED" });
  }
};

const deleteFeedback = async (req, res) => {
  const { feedbackId } = req.params;
  const userId = req.user._1d;

  try {
    await feedbacksService.deleteFeedback(feedbackId, userId);
    return res.status(200).json({ message: "Feedback deleted successfully." });
  } catch (err) {
    console.error("Error deleting feedback:", err);
    if (err.message.includes("not found")) {
      return res.status(404).json({ error: err.message });
    }
    if (err.message.includes("unauthorized")) {
      return res.status(403).json({ error: err.message });
    }
    return res.status(500).json({ error: "DELETE_FAILED" });
  }
};

const toggleFeedbackLike = async (req, res) => {
  const { feedbackId } = req.params;
  const userId = req.user._id;

  try {
    const updated = await feedbacksService.toggleFeedbackLike(feedbackId, userId);
    return res.status(200).json(updated);
  } catch (err) {
    console.error("Error toggling like:", err);
    if (err.message === "Feedback not found") {
      return res.status(404).json({ error: err.message });
    }
    return res.status(500).json({ error: "TOGGLE_LIKE_FAILED" });
  }
};

module.exports = {
  addFeedback,
  getFeedbackByEvent,
  getEventRating,     // <— new
  updateFeedback,
  deleteFeedback,
  toggleFeedbackLike,
};
