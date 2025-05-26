const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
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
        "add_media",
        "add_event",
        "delete_event",
        "new_rsvp",
        "reply",
        "like_feedback",
        "like_comment",
      ],
      required: true,
    },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "UserAccount", default: null }, // Who sent the notification
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event" }, // Optional: Related event
    media: { type: mongoose.Schema.Types.ObjectId, ref: "EventMedia" }, // Optional: Related media
    message: { type: String, required: true },
    shared: { type: Boolean, default: false }, // Flag for shared notifications
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "UserAccount" }], // List of users who have marked this notification as read
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);