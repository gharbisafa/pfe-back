const userAccountService = require("../services/userAccountService");
const DataValidationError = require("../errors/dataValidationError");
const RecordNotFoundError = require("../errors/recordNotFoundError");


const get = async (req, res) => {
  try {
    let result = await userAccountService.get({}, { password: 0, deleted: 0 });
    res.status(200).json(result);
  } catch (error) {
    res.sendStatus(500);
  }
};

const getDeleted = async (req, res) => {
  try {
    let result = await userAccountService.getDeleted(
      {},
      { password: 0, deleted: 0 }
    );
    res.status(200).json(result);
  } catch (error) {
    res.sendStatus(500);
  }
};

const getById = async (req, res) => {
  try {
    let result = await userAccountService.getById(req.params._id);
    if (!result || result.deleted) {
      res.sendStatus(404);
      return;
    }
    res.status(200).json(result);
  } catch (error) {
    res.sendStatus(500);
  }
};

const post = async (req, res) => {
  try {
    let result = await userAccountService.add(req.data);
    if (!result) {
      res.status(400).json({
        error: "DATA_MISSING",
      });
      return;
    }
    res.status(201).json(result);
    return;
  } catch (error) {
    console.error(error);
    if (error instanceof DataValidationError) {
      res.status(400).json({
        error: "DATA_VALIDATION",
        model: error.model.modelName,
        fields: error.issues.map((issue) => ({
          kind: issue.kind,
          path: issue.path,
          value: issue.value,
          message: issue.message,
        })),
      });
    } else {
      res.sendStatus(500);
    }
  }
};

const putSelf = async (req, res) => {
  try {
    let result = await userAccountService.updateById(req.user._id, req.data);
    if (!result) {
      res.status(400).json({
        error: "DATA_MISSING",
      });
    } else {
      res.status(200).json(result);
    }
  } catch (error) {
    if (error instanceof RecordNotFoundError) {
      res.sendStatus(404);
    } else if (error instanceof DataValidationError) {
      console.error(error);
      res.status(400).json({
        error: "DATA_VALIDATION",
        model: error.model.modelName,
        fields: error.issues.map((issue) => ({
          kind: issue.kind,
          path: issue.path,
          value: issue.value,
          message: issue.message,
        })),
      });
    } else {
      console.error(error);
      res.sendStatus(500);
    }
  }
};

const deleteSelf = async (req, res) => {
  try {
    let result = await userAccountService.deleteById(req.user._id);
    if (!result) {
      res.status(400).json({
        error: "ALREADY_DELETED",
      });
      return;
    }
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof RecordNotFoundError) {
      res.sendStatus(404);
    } else {
      console.error(error);
      res.sendStatus(500);
    }
  }
};

const uploadProfileImage = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "NO_IMAGE_PROVIDED" });
    }
    const updatedUser = await userAccountService.updateProfileImage(
      req.user._id,
      file.path
    );
    const normalizedPath = updatedUser.profileImage.replace(/\\/g, "/");
    res.status(200).json({
      message: "PROFILE_IMAGE_UPDATED",
      profileImage: `${req.protocol}://${req.get("host")}/${normalizedPath}`,
    });
  } catch (error) {
    console.error(error);
    if (error instanceof RecordNotFoundError) {
      return res.status(404).json({ error: "USER_NOT_FOUND" });
    }
    res.sendStatus(500);
  }
};
const toggleFollow = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id.toString();

    if (targetUserId === currentUserId) {
      return res.status(400).json({ error: "CANNOT_FOLLOW_SELF" });
    }

    const result = await userAccountService.toggleFollow(currentUserId, targetUserId);
    res.status(200).json({ message: result.message });
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
};
const getFollowStats = async (req, res) => {
  try {
    const userId = req.params.id;
    const stats = await userAccountService.getFollowStats(userId);
    res.status(200).json(stats);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
};

// Get followers of a user by ID
const getFollowers = async (req, res) => {
  try {
    const followers = await userAccountService.getFollowers(req.params.id);
    return res.status(200).json(followers);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error fetching followers" });
  }
};

// Get following of a user by ID
const getFollowing = async (req, res) => {
  try {
    const following = await userAccountService.getFollowing(req.params.id);
    return res.status(200).json(following);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error fetching following" });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const user = await userAccountService.getById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error fetching user data" });
  }
};




module.exports = {
  getFollowStats,
  getFollowers,
  getFollowing,
  getUserById,
  toggleFollow,
  uploadProfileImage,
  get,
  getDeleted,
  getById,
  post,
  putSelf,
  deleteSelf,
};
