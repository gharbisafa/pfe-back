const mongoose = require("mongoose");
const FollowSchema = new mongoose.Schema({
    follower: { type: mongoose.Schema.Types.ObjectId, ref: "UserAccount", required: true },
    followee: { type: mongoose.Schema.Types.ObjectId, ref: "UserAccount", required: true },
    createdAt: { type: Date, default: Date.now },
});
module.exports = mongoose.model("Follow", FollowSchema);
