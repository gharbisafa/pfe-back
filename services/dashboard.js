const Event = require("../models/event");
const EventMedia = require("../models/eventMedia");

const getUserActivity = async (userId) => {
  try {
    // Fetch count of events created by the user
    const createdEventsCount = await Event.countDocuments({ createdBy: userId, deleted: false });

    // Fetch count of events the user is interested in
    const interestedCount = await Event.countDocuments({ interested: userId, deleted: false });

    // Fetch count of events the user is attending
    const goingCount = await Event.countDocuments({ going: userId, deleted: false });

    // Fetch total likes on events created by the user
    const likesCount = await Event.aggregate([
      { $match: { createdBy: userId, deleted: false } },
      { $project: { likeCount: { $size: "$likes" } } },
      { $group: { _id: null, totalLikes: { $sum: "$likeCount" } } },
    ]);

    // Fetch count of media uploaded by the user
    const mediaUploadedCount = await EventMedia.countDocuments({ user: userId, deleted: false });

    // Fetch upcoming events the user is involved in
    const upcomingEvents = await Event.find({
      $or: [{ interested: userId }, { going: userId }, { createdBy: userId }],
      startDate: { $gte: new Date() },
      deleted: false,
    }).select("title startDate location");

    return {
      createdEventsCount,
      interestedCount,
      goingCount,
      totalLikes: likesCount?.[0]?.totalLikes || 0,
      mediaUploadedCount,
      upcomingEvents,
    };
  } catch (error) {
    console.error("Error fetching user activity:", error);
    throw new Error("SERVICE_DASHBOARD_ERROR");
  }
};

module.exports = {
  getUserActivity,
};