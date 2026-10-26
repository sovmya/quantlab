const bcrypt = require("bcrypt");
const User = require("../models/user.model");
const HttpError = require("../utils/httpError");
const asyncHandler = require("../utils/asyncHandler");
const { generateToken, cookieOptions, baseCookie } = require("../utils/generateToken");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Compared against when the email doesn't exist, so response time doesn't reveal it.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

const publicUser = (u) => ({ _id: u._id, name: u.name, email: u.email, createdAt: u.createdAt });

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if ([name, email, password].some((v) => typeof v !== "string")) {
    throw new HttpError(400, "Name, email and password are required");
  }
  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();

  if (cleanName.length < 2 || cleanName.length > 50) {
    throw new HttpError(400, "Name must be 2-50 characters");
  }
  if (!EMAIL_RE.test(cleanEmail)) throw new HttpError(400, "Enter a valid email");
  if (password.length < 8 || password.length > 72) {
    // bcrypt only uses the first 72 bytes
    throw new HttpError(400, "Password must be 8-72 characters");
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    throw new HttpError(400, "Password must contain a letter and a number");
  }

  if (await User.findOne({ email: cleanEmail })) {
    throw new HttpError(409, "Email already registered");
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ name: cleanName, email: cleanEmail, password: hashed });

  res.cookie("token", generateToken(user._id), cookieOptions);
  res.status(201).json({ success: true, user: publicUser(user) });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (typeof email !== "string" || typeof password !== "string") {
    throw new HttpError(400, "Email and password are required");
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+password");
  const valid = await bcrypt.compare(password, user ? user.password : DUMMY_HASH);

  // Same message whether the email or the password was wrong.
  if (!user || !valid) throw new HttpError(401, "Invalid credentials");

  res.cookie("token", generateToken(user._id), cookieOptions);
  res.json({ success: true, user: publicUser(user) });
});

const me = (req, res) => res.json({ success: true, user: publicUser(req.user) });

const logout = (req, res) => {
  res.clearCookie("token", baseCookie);
  res.json({ success: true, message: "Logged out" });
};

module.exports = { register, login, me, logout };