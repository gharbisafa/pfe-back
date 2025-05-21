const feedbacksService = require("../services/feedbacks");

// Add feedback for an event
const addFeedback = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { rating, message } = req.body;
    const userId = req.user._id; // UserAccount ID from authentication

    const feedback = await feedbacksService.addFeedback(eventId, userId, rating, message);
    res.status(201).json(feedback);
  } catch (error) {
    console.error("Error adding feedback:", error);
    res.status(500).json({ error: "FEEDBACK_CREATION_FAILED" });
  }
};

// Get all feedback for an event
const getFeedbackByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const feedbacks = await feedbacksService.getFeedbackByEvent(eventId);
    res.status(200).json(feedbacks);
  } catch (error) {
    console.error("Error fetching feedback:", error);
    res.status(500).json({ error: "FETCH_FAILED" });
  }
};

// Update feedback
const updateFeedback = async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const { rating, message } = req.body;
    const userId = req.user._id; // UserAccount ID from authentication

    const updatedFeedback = await feedbacksService.updateFeedback(feedbackId, userId, rating, message);
    res.status(200).json(updatedFeedback);
  } catch (error) {
    console.error("Error updating feedback:", error);
    res.status(500).json({ error: "UPDATE_FAILED" });
  }
};

// Delete feedback
const deleteFeedback = async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const userId = req.user._id; // UserAccount ID from authentication

    await feedbacksService.deleteFeedback(feedbackId, userId);
    res.status(200).json({ message: "Feedback deleted successfully." });
  } catch (error) {
    console.error("Error deleting feedback:", error);
    res.status(500).json({ error: "DELETE_FAILED" });
  }
};

// Toggle like on feedback
const toggleFeedbackLike = async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const userId = req.user._id; // UserAccount ID from authentication

    const updatedFeedback = await feedbacksService.toggleFeedbackLike(feedbackId, userId);
    res.status(200).json(updatedFeedback);
  } catch (error) {
    console.error("Error toggling like:", error);
    res.status(500).json({ error: "TOGGLE_LIKE_FAILED" });
  }
};

module.exports = {
  addFeedback,
  getFeedbackByEvent,
  updateFeedback,
  deleteFeedback,
  toggleFeedbackLike,
};