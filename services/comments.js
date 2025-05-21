const Comment = require("../models/comment");
const Event = require("../models/event");
const mongoose = require("mongoose");


const addComment = async (eventId, userId, message) => {
  // Ensure the event exists
  const event = await Event.findById(eventId);
  if (!event) {
    throw new Error("Event not found");
  }

  // Create and save the comment
  const comment = await Comment.create({
    event: eventId,
    author: userId,
    message,
  });

  return comment;
};


// Update a comment
const updateComment = async (commentId, userId, message) => {
  if (!message || typeof message !== "string") {
    throw new Error("Message is required and must be a string.");
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new Error("Comment not found.");
  }

  if (comment.author.toString() !== userId.toString()) {
    throw new Error("You are not authorized to update this comment.");
  }

  comment.message = message;
  await comment.save();

  return comment;
};
// const getCommentsByEvent = async (eventId) => {
//   return await Comment.find({ event: eventId, deleted: false, replyTo: null }) // Only fetch top-level comments
//     .populate("author", "name email")
//     .populate({
//       path: "replyTo",
//       select: "author message", // Populate parent comment if this is a reply
//     })
//     .populate({
//       path: "replies",
//       match: { deleted: false }, // Fetch replies for each comment
//       populate: { path: "author", select: "name email" }, // Populate reply author
//     });
// };
// Get all comments for an event
const getCommentsByEvent = async (eventId) => {
  const comments = await Comment.find({ event: eventId, deleted: false })
    .populate({
      path: "author",
      populate: {
        path: "userInfo", // Populate userInfo from UserAccount
        select: "name profileImage", // Select relevant User fields
      },
      select: "email role", // Select relevant UserAccount fields
    });
  return comments;
};

const deleteComment = async (commentId, userId, isAdmin) => {
  // Fetch the comment with its associated event
  const comment = await Comment.findById(commentId).populate("event", "createdBy");

  if (!comment) {
    throw new Error("Comment not found.");
  }

  // Check if the user is authorized to delete the comment
  const isAuthorized =
    comment.author.toString() === userId.toString() || // Author of the comment
    comment.event.createdBy.toString() === userId.toString() || // Event creator
    isAdmin; // Admin user

  if (!isAuthorized) {
    throw new Error("You are not authorized to delete this comment.");
  }

  // Perform a soft delete (mark as deleted)
  comment.deleted = true;
  await comment.save();

  return comment;
};

const toggleCommentLike = async (commentId, userId) => {
  // Find the comment
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new Error("Comment not found");
  }

  // Toggle like
  const userIndex = comment.likes.indexOf(userId);
  if (userIndex === -1) {
    comment.likes.push(userId);
  } else {
    comment.likes.splice(userIndex, 1);
  }

  await comment.save();
  return comment;
};
// const replyToComment = async (parentCommentId, userId, message, eventId) => {
//   if (!message || typeof message !== "string") {
//     throw new Error("Message is required and must be a string.");
//   }

//   // Ensure the parent comment exists
//   const parentComment = await Comment.findById(parentCommentId);
//   if (!parentComment) {
//     throw new Error("Parent comment not found.");
//   }

//   // Create the reply
//   const reply = new Comment({
//     event: eventId,
//     author: userId,
//     message,
//     replyTo: parentCommentId,
//   });
//   await reply.save();
//   return reply;
// };
const replyToComment = async (parentCommentId, userId, message) => {
  if (!message || typeof message !== "string") {
    throw new Error("Message is required and must be a string.");
  }

  // Find the parent comment to retrieve the eventId
  const parentComment = await Comment.findById(parentCommentId);
  if (!parentComment) {
    throw new Error("Parent comment not found.");
  }

  // Use the eventId from the parent comment
  const eventId = parentComment.event;

  // Create the reply
  const reply = new Comment({
    event: eventId, // Use eventId from the parent comment
    author: userId,
    message,
    replyTo: parentCommentId, // Link to the parent comment
  });

  await reply.save();

  return reply;
};
module.exports = {
  addComment,
  getCommentsByEvent,
  updateComment,
  deleteComment,
  toggleCommentLike,
  replyToComment,
};