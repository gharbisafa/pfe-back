const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserAccount", // Reference UserAccount to align with your structure
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment", // Reference the parent comment
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserAccount", // Reference UserAccount for likes
      },
    ],
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Comment", commentSchema);