const { pool } = require("../config/database");

class Server {
  async getAll(user_id = null) {
    if (!user_id) {
      const result = await pool.query(
        "SELECT * FROM servers ORDER BY created_at ASC",
      );
      return result.rows;
    }

    const result = await pool.query(
      `SELECT s.*
             FROM servers s
             WHERE NOT EXISTS (
                SELECT 1
                FROM server_members sm
                WHERE sm.server_id = s.id
                  AND sm.user_id = $1
                  AND sm.role = 'BANNED'
             )
             ORDER BY s.created_at ASC`,
      [user_id],
    );
    return result.rows;
  }

  async getByIdUser(id) {
    const result = await pool.query(
      `SELECT * FROM servers WHERE user_id = $1`,
      [id],
    );
    return result.rows;
  }

  async getById(id) {
    const { rows } = await pool.query("SELECT * FROM servers WHERE id = $1", [
      id,
    ]);
    return rows[0];
  }

  async create(user_id, name, description) {
    const { rows } = await pool.query(
      "INSERT INTO servers (user_id, name , description) VALUES ($1,$2,$3) RETURNING *",
      [user_id, name, description],
    );
    return rows[0];
  }

  async update(id, name, description) {
    const { rows } = await pool.query(
      "UPDATE servers SET name = $2 , description = $3 WHERE id = $1 RETURNING *",
      [id, name, description],
    );
    return rows[0];
  }

  async delete(id) {
    const { rows } = await pool.query(
      "DELETE FROM servers WHERE id = $1 RETURNING id",
      [id],
    );
    return { id: id, message: `Server ${id} delete.` };
  }
}

module.exports = Server;
