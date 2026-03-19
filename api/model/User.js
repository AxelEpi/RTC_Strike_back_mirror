const { pool } = require("../config/database");
const v = require("../lib/validators");

class User {
  async getById(id) {
    const { rows } = await pool.query(
      "SELECT id, email, username, description FROM users WHERE id = $1",
      [id],
    );
    return rows[0];
  }

  async getByEmail(email) {
    const { rows } = await pool.query(
      "SELECT id, email, username, description, password_hash FROM users WHERE email = $1",
      [email],
    );
    return rows[0];
  }

  async create(username, email, password) {
    const { rows } = await pool.query(
      "INSERT INTO users (username, email, password_hash) VALUES ($1,$2,$3) RETURNING *",
      [username, email, password],
    );
    return rows[0];
  }

  async updateToken(id, token, tokenExpiresAt) {
    const { rows } = await pool.query(
      "UPDATE users SET token = $1, token_expires_at = $2 WHERE id = $3 RETURNING *",
      [token, tokenExpiresAt, id],
    );
    return rows[0];
  }

  async delete({ email, username }) {
    if (!email && !username) {
      throw new Error("Email or username is required");
    }
    if (email && !v.isEmail(email)) {
      throw new Error("Invalid email");
    }
    if (username && !v.isUsername(username)) {
      throw new Error("Invalid username");
    }

    const { rows } = await pool.query(
      "DELETE FROM users WHERE ($1::text IS NULL OR email = $1) OR ($2::text IS NULL OR username = $2) RETURNING email, username",
      [email || null, username || null],
    );

    if (!rows[0]) return null;
    return {
      email: rows[0].email,
      username: rows[0].username,
      message: `User ${rows[0].email} deleted.`,
    };
  }

  async update(id, description, username, email, password) {
    const { rows } = await pool.query(
      "UPDATE users SET description = $2 , username = $3 , email = $4 , password_hash = $5   WHERE id = $1 RETURNING *",
      [id, description, username, email, password],
    );
    return rows[0];
  }
}

module.exports = User;
