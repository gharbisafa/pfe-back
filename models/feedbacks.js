const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserAccount",
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    message: {
      type: String,
      default: "",
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserAccount",
      },
    ],
  },
  { timestamps: true }
);

// Ensure a user can only provide one feedback per event
feedbackSchema.index({ event: 1, user: 1 }, { unique: true });

module.exports = mongoose.model("Feedback", feedbackSchema);