const { pool } = require("../config/database");

class Channel {
  async getAll(server_id) {
    const result = await pool.query(
      "SELECT * FROM channels WHERE server_id = $1",
      [server_id],
    );
    return result.rows;
  }

  async getById(id) {
    const { rows } = await pool.query("SELECT * FROM channels WHERE id = $1", [
      id,
    ]);
    return rows[0];
  }

  async create(server_id, name) {
    const { rows } = await pool.query(
      "INSERT INTO channels (server_id, name) VALUES ($1,$2) RETURNING *",
      [server_id, name],
    );
    return rows[0];
  }

  async update(id, name) {
    const { rows } = await pool.query(
      "UPDATE channels SET name = $2 WHERE id = $1 RETURNING *",
      [id, name],
    );
    return rows[0];
  }

  async delete(id) {
    const { rows } = await pool.query(
      "DELETE FROM channels WHERE id = $1 RETURNING id",
      [id],
    );
    return { id: id, message: `Channel ${id} delete.` };
  }
}

module.exports = Channel;
