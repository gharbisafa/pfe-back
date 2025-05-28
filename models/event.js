// models/event.js

const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const rsvpEnum = ["yes", "no", "maybe"];

const eventSchema = new mongoose.Schema(
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

    // ─── New geocoded coordinates ───────────────────────────────
    latitude: {
      type: Number,
      required: false,
    },
    longitude: {
      type: Number,
      required: false,
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
      ref: "UserAccount",
      required: true,
    },

    price: {
      type: Number,
      min: 0,
      default: 0,
    },

    bookingLink: {
      type: String,
      default: null,
      validate: {
        validator: function (value) {
          if (!value) return true;
          return /^https?:\/\/.+$/.test(value);
        },
        message: "Invalid booking link URL",
      },
    },

    guests: {
      type: [
        {
          user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "UserAccount",
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
        ref: "UserAccount",
      },
    ],

    photos: {
      type: [String],
      validate: [
        (arr) => arr.length <= 3,
        "Maximum 3 photos allowed when creating the event.",
      ],
    },

    deleted: {
      type: Boolean,
      default: false,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    banned: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
  }
);

eventSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Event", eventSchema);
