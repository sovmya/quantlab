const jwt = require("jsonwebtoken");
const config = require("../config/env");
const User = require("../models/user.model");
const HttpError = require("../utils/httpError");
const asyncHandler = require("../utils/asyncHandler");

const protect = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) throw new HttpError(401, "Not authenticated");

  let decoded;
  try {
    decoded = jwt.verify(token, config.jwtSecret);
  } catch {
    throw new HttpError(401, "Session invalid or expired");
  }

  const user = await User.findById(decoded.id);
  if (!user) throw new HttpError(401, "Account no longer exists");

  req.user = user; // the ONLY trusted source of identity
  next();
});

module.exports = protect;