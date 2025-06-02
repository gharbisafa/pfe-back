const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema(
  {
    event: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Event", 
      required: true 
    },
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "UserAccount", 
      required: true 
    },
    numberOfPeople: { 
      type: Number, 
      required: true 
    },
    status: { 
      type: String, 
      enum: ["pending", "confirmed", "rejected","canceled"], 
      default: "pending" 
    },
    createdAt: { 
      type: Date, 
      default: Date.now 
    },
    updatedAt: { 
      type: Date, 
      default: Date.now 
    },
  },
  { timestamps: true }
);

// Ensure a user can only make one reservation per event
reservationSchema.index({ event: 1, user: 1 }, { unique: true });

module.exports = mongoose.model("Reservation", reservationSchema);