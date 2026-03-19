const { pool } = require("../config/database");

class Server_members { 
  // Récupère les serveurs auxquels un utilisateur appartient, avec son rôle et la date d'adhésion
  async getByIdUser(user_id) {
    const result = await pool.query(
      `SELECT 
                s.id,
                s.name,
                s.created_at,
                sm.role,
                sm.joined_at
            FROM server_members sm
            JOIN servers s ON sm.server_id = s.id
                        WHERE sm.user_id = $1
                            AND sm.role != 'BANNED'
            ORDER BY sm.joined_at ASC`,
      [user_id],
    );
    return result.rows;
  }
  // Récupère les noms d'utilisateur et rôles pour une liste d'IDs utilisateur dans un serveur donné
  async getUsernamesByIds(serverId, userIds) {
    if (!userIds.length) return {};

    try {
      const idsArray = Array.isArray(userIds) ? userIds : [userIds];

      const result = await pool.query(
        `SELECT sm.user_id, u.username, sm.role
       FROM server_members sm
       JOIN users u ON sm.user_id = u.id
       WHERE sm.server_id = $1 AND sm.user_id = ANY($2::uuid[])`,
        [serverId, idsArray],
      );

      const userMap = {};
      result.rows.forEach((row) => {
        userMap[row.user_id] = {
          username: row.username,
          role: row.role || "MEMBER",
        };
      });

      return userMap;
    } catch (e) {
      console.error("Erreur usernames:", e.message);
      return {};
    }
  }
  // Récupère tous les membres d'un serveur, avec leurs rôles et la date d'adhésion, en excluant les bannis
  async getAll(server_id) {
    const result = await pool.query(
      `SELECT 
                sm.id,
                sm.server_id,
                sm.user_id,
                sm.role,
                sm.joined_at,
                u.username,
                u.email,
                u.description,
                u.token_expires_at
            FROM server_members sm
            JOIN users u ON sm.user_id = u.id
                        WHERE sm.server_id = $1
                            AND sm.role != 'BANNED'
             
            ORDER BY joined_at ASC`,
      [server_id],
    );
    return result.rows;
  }
  // Récupère un membre spécifique d'un serveur par son ID de membre
  async getById(id) {
    const { rows } = await pool.query(
      "SELECT * FROM server_members WHERE id = $1",
      [id],
    );
    return rows[0];
  }
  // Récupère tous les membres bannis d'un serveur, avec leurs rôles et la date d'adhésion
  async getBannedUsers(server_id) {
    const result = await pool.query(
      `SELECT 
                sm.id,
                sm.server_id,
                sm.user_id,
                sm.role,
                sm.joined_at,
                sm.banned_until,
                u.username,
                u.email,
                u.description,
                u.token_expires_at
            FROM server_members sm
            JOIN users u ON sm.user_id = u.id
                        WHERE sm.server_id = $1
                            AND sm.role = 'BANNED'
             
            ORDER BY joined_at ASC`,
      [server_id],
    );
    return result.rows;
  }
  // Récupère le rôle et la date de bannissement d'un utilisateur dans un serveur donné
  async getRoleForUser(server_id, user_id) {
    const { rows } = await pool.query(
      "SELECT role, banned_until FROM server_members WHERE server_id = $1 AND user_id = $2",
      [server_id, user_id],
    );
    return rows[0];
  }
  // Ajoute un utilisateur à un serveur avec un rôle donné, ou met à jour son rôle s'il est déjà membre
  async create(server_id, user_id, role = "MEMBER") {
    const { rows } = await pool.query(
      "INSERT INTO server_members (server_id, user_id, role) VALUES ($1,$2,$3)\n" +
        "ON CONFLICT (server_id, user_id) DO UPDATE SET role = server_members.role\n" +
        "RETURNING *",
      [server_id, user_id, role],
    );
    return rows[0];
  }
  // Met à jour le rôle d'un membre dans un serveur donné
  async update(server_id, user_id, role) {
    const { rows } = await pool.query(
      "UPDATE server_members SET role = $3 WHERE server_id = $1 AND user_id = $2 RETURNING *",
      [server_id, user_id, role],
    );
    return rows[0];
  }
  // Supprime un membre d'un serveur donné
  async delete(server_id, user_id) {
    const { rows: selectRows } = await pool.query(
      "SELECT id FROM server_members WHERE server_id = $1 AND user_id = $2",
      [server_id, user_id],
    );

    if (!selectRows[0]) {
      return { message: `servers_members not found.` };
    }

    const id = selectRows[0].id;

    await pool.query(
      "DELETE FROM server_members WHERE server_id = $1 AND user_id = $2",
      [server_id, user_id],
    );

    return { id, message: `servers_members ${id} deleted.` };
  }
  // Banni un utilisateur d'un serveur, avec une date de fin de bannissement optionnelle
  async ban(server_id, user_id, banned_until = null) {
  const { rows } = await pool.query(
    "UPDATE server_members SET role = 'BANNED', banned_until = $3 WHERE server_id = $1 AND user_id = $2 RETURNING *",
    [server_id, user_id, banned_until]
  );
  return rows[0];
  }
  // Débanni un utilisateur d'un serveur, en réinitialisant son rôle à "MEMBER" et en supprimant la date de bannissement
  async unban(server_id, user_id) {
    const { rows } = await pool.query(
      "UPDATE server_members SET role = 'MEMBER', banned_until = NULL WHERE server_id = $1 AND user_id = $2 RETURNING *",
      [server_id, user_id]
    );
    return rows[0];
  }
}

module.exports = Server_members;
