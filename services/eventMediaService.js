const EventMedia = require("../models/eventMedia");
const RecordNotFoundError = require("../errors/recordNotFoundError");
const notificationService = require("./notificationService");

// Fetch all media for a specific event
const getByEventId = async (eventId, userId, isAdmin) => {
  try {
    // Build filter conditions
    const filters = { event: eventId };

    if (isAdmin) {
      // Admin can see everything
      filters.deleted = { $ne: false }; // Include deleted if admin
    } else {
      // Non-admin users
      filters.deleted = false; // Exclude deleted
      filters.$or = [
        { archived: false }, // Include non-archived
        { archived: true, user: userId }, // Include archived by the same user
      ];
    }

    const media = await EventMedia.find(filters).lean();
    return media;
  } catch (error) {
    console.error("Error fetching media for event:", error);
    throw new Error("FETCH_FAILED");
  }
};

// Add new media entries
const add = async (data) => {
  try {
    const media = await EventMedia.insertMany(data); // Insert multiple media entries

    for (const entry of media) {
      const { event, user } = entry;

      // Fetch the event to get the creator
      const eventDetails = await Event.findById(event);
      if (!eventDetails) {
        console.error(`Event with ID ${event} not found.`);
        continue;
      }

      const eventCreator = eventDetails.createdBy;

      // Notify the event creator about the new media
      if (eventCreator.toString() !== user.toString()) {
        await notificationService.createNotification({
          user: eventCreator,
          type: "add_media",
          message: `New media has been added to your event "${eventDetails.title}".`,
          event,
        });
      }

      // Optional: Notify the uploader (if needed)
      await notificationService.createNotification({
        user, // Notify the uploader
        type: "add_media",
        message: `Your media has been successfully uploaded to the event "${eventDetails.title}".`,
        event,
      });
    }

    return media;
  } catch (error) {
    console.error("Error adding media:", error);
    throw new Error("MEDIA_CREATION_FAILED");
  }
};

// Soft delete media by ID
const deleteById = async (id, userId) => {
  try {
    const media = await EventMedia.findById(id);
    if (!media) throw new RecordNotFoundError(EventMedia, id);

    if (media.deleted) return false; // Already deleted

    // Check if the user has the right to delete (owner or admin)
    if (media.user.toString() !== userId.toString()) {
      throw new Error("UNAUTHORIZED: You are not allowed to delete this media");
    }

    media.deleted = true;
    await media.save();

    // Fetch the event to get the creator
    const eventDetails = await Event.findById(media.event);
    if (!eventDetails) {
      console.error(`Event with ID ${media.event} not found.`);
      return media;
    }

    const eventCreator = eventDetails.createdBy;

    // Notify the uploader about the deletion
    await notificationService.createNotification({
      user: media.user,
      type: "delete_event",
      message: `Your media in the event "${eventDetails.title}" has been deleted.`,
      event: media.event,
    });

    // Notify the event creator about the deletion
    if (eventCreator.toString() !== media.user.toString()) {
      await notificationService.createNotification({
        user: eventCreator,
        type: "delete_event",
        message: `Media in your event "${eventDetails.title}" has been deleted by the uploader.`,
        event: media.event,
      });
    }

    return media;
  } catch (error) {
    console.error("Error deleting media:", error);
    throw error;
  }
};

// Archive media by ID
const archiveById = async (id, userId) => {
  try {
    const media = await EventMedia.findById(id);
    if (!media) throw new RecordNotFoundError(EventMedia, id);

    // Check if the media is deleted
    if (media.deleted) {
      throw new Error("This media is deleted and cannot be archived.");
    }

    // Toggle the archived state
    if (media.archived) {
      media.archived = false; // Un-archive
    } else {
      // Ensure only the uploader or admin can archive
      if (media.user.toString() !== userId.toString()) {
        throw new Error("UNAUTHORIZED: You are not allowed to archive this media.");
      }
      media.archived = true; // Archive
    }

    await media.save();

    // Notify the uploader about the archived/unarchived state
    const action = media.archived ? "archived" : "unarchived";
    await notificationService.createNotification({
      user: media.user,
      type: "event_update",
      message: `Your media has been ${action}.`,
      event: media.event,
    });

    return media;
  } catch (error) {
    console.error("Error toggling archive state:", error);
    throw error;
  }
};

// Toggle likes for a media entry
const toggleLike = async (id, userId) => {
  try {
    const media = await EventMedia.findById(id);
    if (!media) throw new RecordNotFoundError(EventMedia, id);

    // Check if the media is archived or deleted
    if (media.deleted) {
      throw new Error("This media is deleted and cannot be liked.");
    }
    if (media.archived) {
      throw new Error("This media is archived and cannot be liked.");
    }

    // Toggle the like state
    const userIndex = media.likes.indexOf(userId);
    if (userIndex > -1) {
      // If user already liked, remove the like
      media.likes.splice(userIndex, 1);
    } else {
      // Otherwise, add the like
      media.likes.push(userId);

      // Notify the uploader about the like
      if (media.user.toString() !== userId.toString()) {
        await notificationService.createNotification({
          user: media.user,
          type: "media_like",
          message: "Someone liked your media.",
          event: media.event,
        });
      }
    }

    await media.save();
    return media;
  } catch (error) {
    console.error("Error toggling like:", error);
    throw error;
  }
};

module.exports = {
  getByEventId,
  add,
  deleteById,
  archiveById,
  toggleLike,
};
// const EventMedia = require("../models/eventMedia");
// const RecordNotFoundError = require("../errors/recordNotFoundError");
// const notificationService = require("./notificationService");


// // Fetch all media for a specific event
// const getByEventId = async (eventId, userId, isAdmin) => {
//   try {
//     // Build filter conditions
//     const filters = { event: eventId };

//     if (isAdmin) {
//       // Admin can see everything
//       filters.deleted = { $ne: false }; // Include deleted if admin
//     } else {
//       // Non-admin users
//       filters.deleted = false; // Exclude deleted
//       filters.$or = [
//         { archived: false }, // Include non-archived
//         { archived: true, user: userId }, // Include archived by the same user
//       ];
//     }

//     const media = await EventMedia.find(filters).lean();
//     return media;
//   } catch (error) {
//     console.error("Error fetching media for event:", error);
//     throw new Error("FETCH_FAILED");
//   }
// };

// // Add new media entries
// const add = async (data) => {
//   try {
//     const media = await EventMedia.insertMany(data); // Insert multiple media entries
    
//     // Notify the event creator or participants about new media
//     for (const entry of media) {
//       const { event, user } = entry;

//       // Notify other participants
//       await notificationService.createNotification({
//         user, // Notify the uploader
//         type: "add_media",
//         message: "New media has been added to the event.",
//         event,
//       });
//     }
//     return media;
//   } catch (error) {
//     console.error("Error adding media:", error);
//     throw new Error("MEDIA_CREATION_FAILED");
//   }
// };

// // Soft delete media by ID
// const deleteById = async (id, userId) => {
//   try {
//     const media = await EventMedia.findById(id);
//     if (!media) throw new RecordNotFoundError(EventMedia, id);

//     if (media.deleted) return false; // Already deleted

//     // Check if the user has the right to delete (owner or admin)
//     if (media.user.toString() !== userId.toString()) {
//       throw new Error("UNAUTHORIZED: You are not allowed to delete this media");
//     }

//     media.deleted = true;
//     await media.save();
//     return media;
//   } catch (error) {
//     console.error("Error deleting media:", error);
//     throw error;
//   }
// };

// // Archive media by ID
// const archiveById = async (id, userId) => {
//   try {
//     const media = await EventMedia.findById(id);
//     if (!media) throw new RecordNotFoundError(EventMedia, id);

//     // Check if the media is deleted
//     if (media.deleted) {
//       throw new Error("This media is deleted and cannot be archived.");
//     }

//     // Toggle the archived state
//     if (media.archived) {
//       media.archived = false; // Un-archive
//     } else {
//       // Ensure only the uploader or admin can archive
//       if (media.user.toString() !== userId.toString()) {
//         throw new Error("UNAUTHORIZED: You are not allowed to archive this media.");
//       }
//       media.archived = true; // Archive
//     }

//     await media.save();
//     return media;
//   } catch (error) {
//     console.error("Error toggling archive state:", error);
//     throw error;
//   }
// };

// // Toggle likes for a media entry
// const toggleLike = async (id, userId) => {
//   try {
//     const media = await EventMedia.findById(id);
//     if (!media) throw new RecordNotFoundError(EventMedia, id);

//     // Check if the media is archived or deleted
//     if (media.deleted) {
//       throw new Error("This media is deleted and cannot be liked.");
//     }
//     if (media.archived) {
//       throw new Error("This media is archived and cannot be liked.");
//     }

//     // Toggle the like state
//     const userIndex = media.likes.indexOf(userId);
//     if (userIndex > -1) {
//       // If user already liked, remove the like
//       media.likes.splice(userIndex, 1);
//     } else {
//       // Otherwise, add the like
//       media.likes.push(userId);
//     }

//     await media.save();
//     return media;
//   } catch (error) {
//     console.error("Error toggling like:", error);
//     throw error;
//   }
// };

// module.exports = {
//   getByEventId,
//   add,
//   deleteById,
//   archiveById,
//   toggleLike,
// };