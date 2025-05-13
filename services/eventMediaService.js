const EventMedia = require("../models/eventMedia");
const RecordNotFoundError = require("../errors/recordNotFoundError");

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