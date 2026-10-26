const HttpError = require("./httpError");

// Strict type checks stop NoSQL-injection objects like {"$gt": ""} from reaching queries.
const str = (value, name, { min = 1, max = 100 } = {}) => {
  if (typeof value !== "string") throw new HttpError(400, `${name} is required`);
  const trimmed = value.trim();
  if (trimmed.length < min || trimmed.length > max) {
    throw new HttpError(400, `${name} must be ${min}-${max} characters`);
  }
  return trimmed;
};

const num = (value, name, { min, max, integer = false } = {}) => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new HttpError(400, `${name} must be a number`);
  }
  if (integer && !Number.isInteger(value)) {
    throw new HttpError(400, `${name} must be a whole number`);
  }
  if ((min !== undefined && value < min) || (max !== undefined && value > max)) {
    throw new HttpError(400, `${name} must be between ${min} and ${max}`);
  }
  return value;
};

const objectId = (value, name = "id") => {
  if (typeof value !== "string" || !/^[a-f\d]{24}$/i.test(value)) {
    throw new HttpError(400, `Invalid ${name}`);
  }
  return value;
};

module.exports = { str, num, objectId };