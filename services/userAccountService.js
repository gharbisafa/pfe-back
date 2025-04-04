const UserAccount = require("../models/userAccount");
const userService = require("./userService");
const { getDB } = require("../config/db");
const mongoose = require("mongoose");
const DataValidationError = require("../errors/dataValidationError");
const RecordNotFoundError = require("../errors/recordNotFoundError");
const { castData } = require("../utils/general");

const getById = async (_id) => {
  let userAccount = await UserAccount.findById(_id)
    .populate(["userInfo"])
    .lean({ virtuals: true })
    .exec();
  if (!userAccount) {
    return false;
  }
  return userAccount;
};

const get = async (filter = {}, projection = {}) => {
  let userAccounts = await UserAccount.find(
    {
      $or: [
        { deleted: { $exists: false } },
        { deleted: { $exists: true, $eq: false } },
      ],
      ...filter,
    },
    projection
  )
    .populate([
      {
        path: "userInfo",
      },
    ])
    .lean()
    .exec();
  return userAccounts;
};

const getByEmail = async (email) => {
  let userAccount = await UserAccount.findOne({ email })
    .populate(["userInfo"])
    .lean()
    .exec();
  if (!userAccount) {
    return false;
  }
  return userAccount;
};

const getDeleted = async (filter = {}, projection = {}) => {
  let userAccounts = await UserAccount.find(
    { ...filter, deleted: true },
    projection
  )
    .populate(["userInfo"])
    .lean()
    .exec();
  return userAccounts;
};

const add = async (data) => {
  let db = getDB();
  const session = await db.startSession();
  try {
    session.startTransaction();
    let user = await userService.add(data, session);
    if (!user) {
      throw new Error();
    }
    data = castData(data, ["email", "password", "role"]);
    if (!data) {
      return false;
    }
    try {
      const userAccount = new UserAccount({
        ...data,
        userInfo: user._id,
      });
      await userAccount.save({ session });
      await session.commitTransaction();
      return userAccount;
    } catch (error) {
      if (error instanceof mongoose.Error.ValidationError) {
        throw new DataValidationError(UserAccount, error.errors);
      } else {
        throw error;
      }
    }
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const updateById = async (_id, data) => {
  let newData = castData(data, ["email", "password", "role", "balance"]);
  if (!newData) {
    return false;
  }
  let db = getDB();
  const session = await db.startSession();
  try {
    session.startTransaction();
    let userAccount = await UserAccount.findOneAndUpdate({ _id }, newData, {
      new: true,
      runValidators: true,
    }).populate(["userInfo"]);
    if (!userAccount || userAccount.deleted) {
      throw new RecordNotFoundError(Category, _id);
    }
    await userService.updateById(userAccount.userInfo._id, data, session);
    await session.commitTransaction();
    return userAccount;
  } catch (error) {
    await session.abortTransaction();
    if (error instanceof mongoose.Error.ValidationError) {
      throw new DataValidationError(UserAccount, error.errors);
    } else {
      throw error;
    }
  } finally {
    session.endSession();
  }
};

const deleteById = async (_id) => {
  let userAccount = await UserAccount.findById(_id).exec();
  if (!userAccount) {
    throw new RecordNotFoundError(UserAccount, _id);
  }
  if (userAccount.deleted) {
    return false;
  }
  userAccount = await UserAccount.findOneAndUpdate(
    { _id },
    { deleted: true },
    {
      new: true,
    }
  );
  return userAccount;
};

module.exports = {
  getById,
  get,
  getByEmail,
  getDeleted,
  add,
  updateById,
  deleteById,
};
