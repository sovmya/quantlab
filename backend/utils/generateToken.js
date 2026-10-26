const jwt = require("jsonwebtoken");
const config = require("../config/env");

const generateToken = (userId) =>
  jwt.sign({ id: userId }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

// Same flags for set and clear, otherwise browsers won't clear the cookie.
const baseCookie = {
  httpOnly: true, // JavaScript cannot read it (XSS protection)
  secure: config.isProd, // HTTPS only in production
  sameSite: "lax", // frontend proxies /api, so requests are same-site
};

const cookieOptions = { ...baseCookie, maxAge: 7 * 24 * 60 * 60 * 1000 };

module.exports = { generateToken, cookieOptions, baseCookie };