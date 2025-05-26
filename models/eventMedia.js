const mongoose = require( "mongoose");

const eventMediaSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: ["photo", "video"],
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserAccount",
      },
    ],
    archived: {
      type: Boolean,
      default: false,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const EventMedia = mongoose.model("EventMedia", eventMediaSchema);
module.exports = EventMedia;