const { hashPassword, verifyPassword } = require("../lib/hash");
const userModel = require("../model/User");
const jwt = require("jsonwebtoken");
const KEY_JWT = process.env.JWT_SECRET;
const DURATION = 60 * 60 * 24 * 7; // 7 days
const v = require("../lib/validators");

class AuthController {
  constructor() {
    this.model = new userModel();
  }

  // GET /me
  me = async (req, res) => {
    try {
      // req.user comes from the auth middleware
      const userId = req.user.id;

      // Fetch the user from the DB (WITHOUT the password)
      const user = await this.model.getById(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  // POST /signup
  signup = async (req, res) => {
    try {
      const { username, email, password } = req.body;
      if (!v.isUsername(username)) {
        return res.status(400).json({ error: "Invalid username" });
      }
      if (!v.isEmail(email)) {
        return res.status(400).json({ error: "Invalid email" });
      }
      if (!v.isPassword(password)) {
        return res.status(400).json({ error: "Invalid password" });
      }
      const hashed = await hashPassword(password);
      const signup = await this.model.create(username, email, hashed);
      res.status(201).json(signup);
    } catch (err) {
      console.error(err); // To see the complete error

      // Check if it's a duplicate error
      if (err.code === "23505" || err.constraint === "users_email_key") {
        return res
          .status(409)
          .json({ error: "This email or username is already in use" });
      }

      res.status(500).json({ error: "Unable to create user" });
    }
  };

  // POST /login
  login = async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!v.isEmail(email)) {
        return res.status(400).json({ error: "Invalid email" });
      }
      if (!v.isPassword(password)) {
        return res.status(400).json({ error: "Invalid password" });
      }

      if (!email || !password) {
        return res
          .status(400)
          .json({ error: "Email and password are required" });
      }
      const user = await this.model.getByEmail(email);

      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const isPasswordValid = await verifyPassword(
        password,
        user.password_hash,
      );

      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      //  Generate the JWT token
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          username: user.username,
          description: user.description,
        },
        KEY_JWT,
        { expiresIn: DURATION },
      );

      const tokenExpiresAt = new Date(Date.now() + DURATION * 1000);

      //Update the user with token + expiration date
      await this.model.updateToken(user.id, token, tokenExpiresAt);

      // Send the httpOnly cookie
      res.cookie("auth_token", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: false, // true if HTTPS
        path: "/",
        expires: tokenExpiresAt,
      });

      return res
        .status(200)
        .json({ success: true, message: "Connected", token });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  };

  // POST /logout
  logout = async (req, res) => {
    try {
      // Accept token from cookie, body, or Authorization header
      const tokenFromCookie = req.cookies?.auth_token;
      const tokenFromBody = req.body?.token;
      const tokenFromHeader = req.headers.authorization?.split(" ")[1];
      const token = tokenFromCookie || tokenFromBody || tokenFromHeader;

      if (!token)
        return res
          .status(400)
          .json({ success: false, message: "No token provided" });

      // Verify the token to find user
      const decoded = jwt.verify(token, KEY_JWT);
      const id = decoded.id;
      const user = await this.model.getById(id);

      if (!user)
        return res
          .status(404)
          .json({ success: false, message: "User not found" });

      await this.model.updateToken(user.id, null, null);

      res.clearCookie("auth_token", {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        path: "/",
      });

      return res.status(200).json({ success: true, message: "Disconnected" });
    } catch (error) {
      if (
        error.name === "JsonWebTokenError" ||
        error.name === "TokenExpiredError"
      ) {
        return res.status(401).json({
          success: false,
          message: "Invalid or expired token",
        });
      }

      console.error("Logout error:", error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  };

  delete = async (req, res) => {
    try {
      const { email, username } = req.body;
      const deleted = await this.model.delete({ email, username });
      if (!deleted) return res.status(404).json({ error: "Not found" });
      res.json(deleted);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

  update = async (req, res) => {
    try {
      if (!v.isUUID(req.user.id)) {
        throw new Error("Invalid user ID");
      }
      if (!v.isText(req.body.description)) {
        throw new Error("Invalid user description");
      }
      if (!v.isText(req.body.username)) {
        throw new Error("Invalid user username");
      }
      if (!v.isEmail(req.body.email)) {
        throw new Error("Invalid user email");
      }
      const rawPassword = req.body.password || req.body.password_hash;
      if (!v.isPassword(rawPassword)) {
        throw new Error("Invalid user password");
      }
      const { description, username, email } = req.body;
      const hashedPassword = await hashPassword(rawPassword);
      const updated = await this.model.update(
        req.user.id,
        description,
        username,
        email,
        hashedPassword,
      );
      if (!updated) return res.status(404).json({ error: "Not found" });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
}

module.exports = AuthController;
