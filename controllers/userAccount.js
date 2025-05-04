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
    // console.log("Uploaded File:", file); // ✅ Debug here
    
    if (!file) {
      return res.status(400).json({ error: "NO_IMAGE_PROVIDED" });
    }

    const updatedUser = await userAccountService.updateProfileImage(
      req.user._id,
      file.path
    );

    // console.log("Returning profileImage:", updatedUser.profileImage);// ✅ Debug here

   
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




module.exports = {
  uploadProfileImage,
  get,
  getDeleted,
  getById,
  post,
  putSelf,
  deleteSelf,
};
