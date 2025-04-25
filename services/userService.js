const User = require("../models/user");
const mongoose = require("mongoose");
const DataValidationError = require("../errors/dataValidationError");
const RecordNotFoundError = require("../errors/recordNotFoundError");
const { castData } = require("../utils/general");

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

module.exports = { getById, get, add, updateById };
