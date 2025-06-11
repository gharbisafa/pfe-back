const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
const roles = ["user", "admin"];
const userAccountSchema = mongoose.Schema(
  {
    email: {
      type: String,
      validate: {
        validator: (email) => /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email),
        message: "invalid_email",
      },
      index: {
        unique: true,
        partialFilterExpression: {
          $or: [
            { deleted: { $exists: false } },
            { deleted: { $exists: true, $eq: false } },
          ],
        },
      },
    },
    password: {
      type: String,
      required: true,
      validate: {
        validator: (password) =>
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\S]{8,}$/.test(password),
        message: "invalid_password",
      },
    },
    role: {
      required: true,
      type: String,
      enum: roles,
      default: "user",
    },
    userInfo: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
      refConditions: {
        $or: [
          { deleted: { $exists: false } },
          { deleted: { $exists: true, $eq: false } },
        ],
      },
    },
    deleted: { type: Boolean },
    // Add these fields to your existing userAccountSchema
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationCode: {
      type: String,
      default: null,
    },
    emailVerificationExpires: {
      type: Date,
      default: null,
    },
    passwordResetCode: {
      type: String,
      default: null,
    },
    passwordResetExpires: {
      type: Date,
      default: null,
    },
    oneSignalPlayerId: {
      type: String,
      default: null,
    },

  },
  {
    timestamps: { createdAt: true, updatedAt: true },
  }
);
userAccountSchema.plugin(uniqueValidator);

module.exports = mongoose.model("UserAccount", userAccountSchema);
