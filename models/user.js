const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      validate: {
        validator: (name) => /^[\p{L}-]+(?:\s+[\p{L}-]+)*$/u.test(name),
        message: "invalid_name",  
      },
    },
    phone: {
      type: String,
      required: true,
      validate: {
        validator: (phone) =>
          /^(((\\+[1-9]{1,4}[ \\-]*)|(\\([0-9]{2,3}\\)[ \\-]*)|([0-9]{2,4})[ \\-]*)*?[0-9]{3,4}?[ \\-]*[0-9]{3,4}?)?$/.test(
           phone
          ),
        message: "invalid_phone_number",
      },
    },
    profileImage: {
      type: String, // Path or full URL to the image
      default: "",  // Optional default or null if none uploaded yet
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
  }
);
userSchema.plugin(uniqueValidator);

module.exports = mongoose.model("User", userSchema);
