const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: [
        "reservation_request",
        "reservation_update",
        "reservation_cancellation",
        "reservation_response",
        "like",
        "comment",
        "feedback",
        "event_update",
        "reminder",
        "media_like",
        "guest_invitation",
        "guest_response",
      ],
      required: true,
    },
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event" }, // Optional: Related event
    media: { type: mongoose.Schema.Types.ObjectId, ref: "EventMedia" }, // Optional: Related media
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);