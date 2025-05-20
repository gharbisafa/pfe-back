const commentsService = require("../services/comments");

// Add a comment to an event
const addComment = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { message } = req.body;
    const userId = req.user._id;

    const comment = await commentsService.addComment(eventId, userId, message);
    res.status(201).json(comment);
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ error: "COMMENT_CREATION_FAILED" });
  }
};

// Get all comments for an event
const getCommentsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const comments = await commentsService.getCommentsByEvent(eventId);
    res.status(200).json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ error: "FETCH_FAILED" });
  }
};
const updateComment = async (req, res) => {
  const { commentId } = req.params;
  const { message } = req.body;
  const userId = req.user._id;

  try {
    const updatedComment = await commentsService.updateComment(commentId, userId, message);
    res.status(200).json(updatedComment);
  } catch (error) {
    console.error("Error updating comment:", error);
    res.status(400).json({ error: error.message });
  }
};

// Delete a comment
const deleteComment = async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user._id;
  const isAdmin = req.user.role === "admin"; // Check if the user is an admin

  try {
    const deletedComment = await commentsService.deleteComment(commentId, userId, isAdmin);
    res.status(200).json(deletedComment);
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(400).json({ error: error.message });
  }
};

// Toggle like on a comment
const toggleCommentLike = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user._id;

    const updatedComment = await commentsService.toggleCommentLike(commentId, userId);
    res.status(200).json(updatedComment);
  } catch (error) {
    console.error("Error toggling like:", error);
    res.status(500).json({ error: "TOGGLE_LIKE_FAILED" });
  }
};

const replyToComment = async (req, res) => {
  const { commentId } = req.params; // Parent comment ID
  const { message } = req.body;
  const userId = req.user._id;

  try {
    // Call the service without needing the eventId
    const reply = await commentsService.replyToComment(commentId, userId, message);
    res.status(201).json(reply);
  } catch (error) {
    console.error("Error replying to comment:", error);
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  addComment,
  getCommentsByEvent,
  updateComment,
  deleteComment,
  toggleCommentLike,
  replyToComment,
};