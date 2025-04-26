const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const rsvpEnum = ["yes", "no", "maybe"];

const eventSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      validate: {
        validator: (title) => /^[\p{L}0-9\s\-!?:,.()']+$/u.test(title),
        message: "invalid_event_title",
      },
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "invalid_start_time"],
    },
    endTime: {
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "invalid_end_time"],
    },
    location: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    type: {
      type: String,
      enum: [
        "clubbing",
        "rave",
        "birthday",
        "wedding",
        "food",
        "sport",
        "meeting",
        "conference",
        "other",
      ],
      default: "other",
      required: true,
    },
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "private",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    price: {
      type: Number,
      min: 0,
      default: 0,
    },
    bookingLink: {
      type: String,
      validate: {
        validator: function (value) {
          if (!value) return true;
          return /^https?:\/\/.+$/.test(value);
        },
        message: "Invalid booking link URL",
      },
    },
    deleted: { type: Boolean, default: false },
    guests: {
      type: [
        {
          user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
          },
          rsvp: {
            type: String,
            enum: rsvpEnum,
            default: "maybe",
          },
        },
      ],
      validate: {
        validator: function (guests) {
          const userIds = guests.map((g) => g.user.toString());
          return userIds.length === new Set(userIds).size;
        },
        message: "Duplicate users in guests list are not allowed.",
      },
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    interested: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    going: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    comments: [
      {
        author: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        message: {
          type: String,
          required: true,
        },
        replyTo: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    feedbacks: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        rating: {
          type: Number,
          min: 1,
          max: 5,
        },
        message: {
          type: String,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    photos: {
      type: [String],
      validate: [
        (arr) => arr.length <= 3,
        "Maximum 3 photos allowed when creating the event.",
      ],
    },
    gallery: [
      {
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        mediaUrl: {
          type: String,
          required: true,
        },
        mediaType: {
          type: String,
          enum: ["photo", "video"],
          required: true,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
  }
);

eventSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Event", eventSchema);
