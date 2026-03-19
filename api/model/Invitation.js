const { pool } = require("../config/database");

class Invitation {
  async getAll(server_id) {
    const { rows } = await pool.query(
      "SELECT * FROM invitations WHERE server_id = $1",
      [server_id],
    );
    return rows[0];
  }

  async getById(user_id, server_id) {
    const { rows } = await pool.query(
      "SELECT * FROM invitations WHERE user_id = $1 AND server_id = $2",
      [user_id, server_id],
    );
    return rows[0];
  }
  async getByCode(code) {
    const { rows } = await pool.query(
      `SELECT invitations.*, servers.name AS server_name
      FROM invitations
      JOIN servers ON invitations.server_id = servers.id
      WHERE invitations.code = $1`,
      [code]
    );
    return rows[0];
  }

  async create(server_id, user_id, code, max_uses, uses, expires_at) {
    const { rows } = await pool.query(
      "INSERT INTO invitations (server_id, user_id, code, max_uses, uses, expires_at) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *",
      [server_id, user_id, code, max_uses, uses, expires_at],
    );
    return rows[0];
  }

  async delete(id) {
    const { rows } = await pool.query(
      "DELETE FROM invitations WHERE id = $1 RETURNING id",
      [id],
    );
    return { id: id, message: `Invitation ${id} delete.` };
  }
}

module.exports = Invitation;
