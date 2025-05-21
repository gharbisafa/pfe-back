const Feedback = require("../models/feedbacks");
const Event = require("../models/event");

const addFeedback = async (eventId, userId, rating, message) => {
  // Ensure the event exists
  const event = await Event.findById(eventId);
  if (!event) {
    throw new Error("Event not found");
  }

  // Check if the user already left feedback
  const existingFeedback = await Feedback.findOne({ event: eventId, user: userId });
  if (existingFeedback) {
    throw new Error("You have already submitted feedback for this event.");
  }

  // Create and save the feedback
  const feedback = await Feedback.create({
    event: eventId,
    user: userId, // Reference to UserAccount
    rating,
    message,
  });

  return feedback;
};

const getFeedbackByEvent = async (eventId) => {
  // Fetch feedbacks and populate the user field from UserAccount
  const feedbacks = await Feedback.find({ event: eventId }).populate("user", "email role");
  return feedbacks;
};

const updateFeedback = async (feedbackId, userId, rating, message) => {
  const feedback = await Feedback.findOneAndUpdate(
    { _id: feedbackId, user: userId },
    { rating, message },
    { new: true } // Return the updated document
  );

  if (!feedback) {
    throw new Error("Feedback not found or unauthorized");
  }

  return feedback;
};

const deleteFeedback = async (feedbackId, userId) => {
  const feedback = await Feedback.findOneAndDelete({ _id: feedbackId, user: userId });

  if (!feedback) {
    throw new Error("Feedback not found or unauthorized");
  }
};

const toggleFeedbackLike = async (feedbackId, userId) => {
  const feedback = await Feedback.findById(feedbackId);
  if (!feedback) {
    throw new Error("Feedback not found");
  }

  // Toggle like
  const userIndex = feedback.likes.indexOf(userId);
  if (userIndex === -1) {
    feedback.likes.push(userId); // Add the user to likes
  } else {
    feedback.likes.splice(userIndex, 1); // Remove the user from likes
  }

  await feedback.save();
  return feedback;
};

module.exports = {
  addFeedback,
  getFeedbackByEvent,
  updateFeedback,
  deleteFeedback,
  toggleFeedbackLike,
};