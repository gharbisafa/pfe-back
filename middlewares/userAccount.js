const { hashPassword } = require("../utils/password");

const setData = async (req, res, next) => {
  let passwordHash;
  try {
    if (req.body.password) {
      passwordHash = await hashPassword(req.body.password);
    }
    try {
    } catch (error) {
    } finally {
      req.data = {
        ...req.body,
        ...(passwordHash ? { password: passwordHash } : {}),
        ...(req.image ? { image: req.image } : {}),
      };
      next();
    }
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
};

module.exports = { setData };

// const setData = async (req, res, next) => {
//   console.log("Entering setData middleware");
//   let passwordHash;
//   try {
//     if (req.body.password) {
//       console.log("Hashing password...");
//       passwordHash = await hashPassword(req.body.password);
//     }
//     req.data = {
//       ...req.body,
//       ...(passwordHash ? { password: passwordHash } : {}),
//       ...(req.image ? { image: req.image } : {}),
//     };
//     console.log("Request Data Prepared:", req.data); // Log the prepared data
//     next(); // Pass control to the next middleware or controller
//   } catch (error) {
//     console.error("Error in setData middleware:", error);
//     res.sendStatus(500);
//   }
// };
// module.exports = { setData };
