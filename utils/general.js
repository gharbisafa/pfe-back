const CastError = require("../errors/castError");
const crypto = require("crypto");

const castData = (data, fields, type = "object") => {
  if (!data || data.constructor.name.toLowerCase() !== type) {
    return false;
  }
  let castedData = {};
  try {
    Object.keys(data).forEach((key) => {
      let result = fields.find(
        (item) =>
          key === item ||
          (item.type === "object" && item.field === key) ||
          (item.type === "array" && item.field === key)
      );
      if (!result) {
        return;
      } else if (data[key] === null) {
        castedData[key] = undefined;
      } else if (typeof result === "string") {
        if (
          data[key] &&
          (data[key].constructor.name.toLowerCase() === "object" ||
            data[key].constructor.name.toLowerCase() === "array")
        ) {
          throw new CastError();
        }
        castedData[key] = data[key];
      } else if (
        !data[key] ||
        data[key].constructor.name.toLowerCase() !== result.type
      ) {
        throw new CastError();
      } else if (result.type === "object") {
        let check = castData(data[key], result.fields);
        if (check) {
          castedData[key] = check;
        } else {
          throw new CastError();
        }
      } else if (result.fields) {
        let dataArray = [];
        data[key].forEach((subData) => {
          let check = castData(subData, result.fields);
          if (check) {
            dataArray.push(check);
          } else {
            throw new CastError();
          }
        });
        castedData[key] = dataArray;
      } else {
        if (
          !result.ignore &&
          data[key].some((element) => typeof element === "object")
        ) {
          throw new CastError();
        }
        castedData[key] = data[key];
      }
    });
    return castedData;
  } catch (error) {
    if (error instanceof CastError) {
      return false;
    } else {
      throw error;
    }
  }
};

const generateRandomHex = (number) => {
  return crypto.randomBytes(number).toString("hex");
};

const getDaysArray = (s, e) => {
  let endDate = new Date(e);
  let a = [];
  for (d = new Date(s); d <= endDate; d.setDate(d.getDate() + 1)) {
    a.push(d.toISOString().split("T")[0]);
  }
  return a;
};

module.exports = { castData, generateRandomHex, getDaysArray };
