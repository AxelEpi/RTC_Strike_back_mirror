const { pool } = require("../config/database");

class InvitationService {
  /**
   * Join a server using an invitation code
   * @param {string} code - Invitation code
   * @param {string} userId - User ID attempting to join
   * @returns {Promise<Object>} Result with server info
   */
  static async joinWithCode(code, userId) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // 1. Get the invitation by code
      const invitationQuery = await client.query(
        `SELECT i.*, s.name as server_name 
                 FROM invitations i 
                 JOIN servers s ON i.server_id = s.id 
                 WHERE i.code = $1`,
        [code],
      );

      if (invitationQuery.rows.length === 0) {
        throw { status: 404, message: "Invalid invitation code" };
      }

      const invitation = invitationQuery.rows[0];

      // 2. Check if invitation is expired
      if (new Date(invitation.expires_at) < new Date()) {
        throw { status: 410, message: "This invitation has expired" };
      }

      // 3. Check if invitation has reached max uses
      if (invitation.max_uses > 0 && invitation.uses >= invitation.max_uses) {
        throw {
          status: 410,
          message: "This invitation has reached its maximum uses",
        };
      }

      // 4. Check if user is already a member
      const memberCheck = await client.query(
        "SELECT id FROM server_members WHERE server_id = $1 AND user_id = $2",
        [invitation.server_id, userId],
      );

      if (memberCheck.rows.length > 0) {
        throw {
          status: 409,
          message: "You are already a member of this server",
        };
      }

      // 5. Add user to server as MEMBER
      await client.query(
        `INSERT INTO server_members (server_id, user_id, role) 
                 VALUES ($1, $2, 'MEMBER')`,
        [invitation.server_id, userId],
      );

      // 6. Increment invitation uses
      await client.query(
        "UPDATE invitations SET uses = uses + 1 WHERE id = $1",
        [invitation.id],
      );

      await client.query("COMMIT");

      return {
        message: "Successfully joined the server",
        server: {
          id: invitation.server_id,
          name: invitation.server_name,
        },
        invitation_code: code,
      };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
}

module.exports = InvitationService;
