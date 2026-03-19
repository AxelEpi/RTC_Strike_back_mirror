const jwt = require("jsonwebtoken");

const KEY_JWT = process.env.JWT_SECRET;

module.exports = function authMiddleware(req, res, next) {
  try {
    // Try cookie first, then Authorization header
    const token =
      req.cookies?.auth_token ||
      (req.headers.authorization && req.headers.authorization.split(" ")[1]);

    if (!token)
      return res
        .status(401)
        .json({ success: false, message: "No token provided" });

    const decoded = jwt.verify(token, KEY_JWT);
    req.user = decoded;
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired token" });
  }
};
