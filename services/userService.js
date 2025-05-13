const User = require("../models/user");
const mongoose = require("mongoose");
const DataValidationError = require("../errors/dataValidationError");
const RecordNotFoundError = require("../errors/recordNotFoundError");
const { castData } = require("../utils/general");

const toggleFollow = async (currentUserId, targetUserId) => {
  const currentUser = await User.findById(currentUserId);
  const targetUser = await User.findById(targetUserId);

  if (!currentUser || !targetUser || currentUser.deleted || targetUser.deleted) {
    throw new RecordNotFoundError(User, targetUserId);
  }

  const isFollowing = currentUser.following.includes(targetUserId);

  if (isFollowing) {
    // Unfollow
    currentUser.following.pull(targetUserId);
    targetUser.followers.pull(currentUserId);
    await currentUser.save();
    await targetUser.save();
    return { message: "UNFOLLOWED" };
  } else {
    // Follow
    currentUser.following.push(targetUserId);
    targetUser.followers.push(currentUserId);
    await currentUser.save();
    await targetUser.save();
    return { message: "FOLLOWED" };
  }
};


const getById = async (_id) => {
  let user = await User.findById(_id).lean().exec();
  if (!user) {
    return false;
  }
  return user;
};

const get = async (filter = {}, projection = {}) => {
  let users = await User.find(filter, projection).lean().exec();
  return users;
};

const add = async (data, session) => {
  data = castData(data, ["name", "phone"]);
  if (!data) {
    return false;
  }
  try {
    let user = new User(data);
    await user.save({ session });
    return user;
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      throw new DataValidationError(User, error.errors);
    } else {
      throw error;
    }
  }
};

const updateById = async (_id, data, session) => {
  data = castData(data, ["name", "phone"]);
  if (!data) {
    return false;
  }
  try {
    let user = await User.findOneAndUpdate({ _id }, data, {
      new: true,
      runValidators: true,
      session,
    });
    if (!user) {
      throw new RecordNotFoundError(User, _id);
    }
    return user;
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      throw new DataValidationError(User, error.errors);
    } else {
      throw error;
    }
  }
};
const updateProfileImage = async (userId, imagePath) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new RecordNotFoundError(User, userId);
  }

  user.profileImage = imagePath;
  
  console.log("Updated User:", user);

  return await user.save();
};

module.exports = { toggleFollow, updateProfileImage, getById, get, add, updateById };
