const express = require("express");
const router = express.Router();

// Health check endpoint
router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

function createRoute(controller, path, method) {
  path = "/" + path;
  switch (method) {
    case "get":
      router.get(path, controller);
      break;
    case "post":
      router.post(path, controller);
      break;
    case "put":
      router.put(path, controller);
      break;
    case "delete":
      router.delete(path, controller);
      break;
  }
}

function createRouteAuth(controller, path, method) {
  const authMiddleware = require("./middleware/auth.middleware");
  path = "/" + path;
  switch (method) {
    case "get":
      router.get(path, authMiddleware, controller);
      break;
    case "post":
      router.post(path, authMiddleware, controller);
      break;
    case "put":
      router.put(path, authMiddleware, controller);
      break;
    case "delete":
      router.delete(path, authMiddleware, controller);
      break;
  }
}

function createRouteAuthWithGuard(controller, path, method) {
  const authMiddleware = require("./middleware/auth.middleware");
  const bannedMiddleware = require("./middleware/permission.middleware");
  path = "/" + path;
  switch (method) {
    case "get":
      router.get(path, authMiddleware, bannedMiddleware, controller);
      break;
    case "post":
      router.post(path, authMiddleware, bannedMiddleware, controller);
      break;
    case "put":
      router.put(path, authMiddleware, bannedMiddleware, controller);
      break;
    case "delete":
      router.delete(path, authMiddleware, bannedMiddleware, controller);
      break;
  }
}

//AUTHENTICATION
let authController = require("./controller/AuthController");
authController = new authController();

//Create a new user account
createRoute(authController.signup, "auth/signup", "post"); //auth/signup
//Authenticate and get tokens
createRoute(authController.login, "auth/login", "post"); //auth/login
//Invalidate tokens
createRoute(authController.logout, "auth/logout", "post"); //auth/logout
//Get current user information (protected)
createRouteAuth(authController.me, "me", "get"); //me
//Update user account
createRouteAuth(authController.update, "auth/update", "put"); //auth/update
//Delete user account
createRoute(authController.delete, "auth/delete", "delete"); //auth/delete

//SERVER
let serverController = require("./controller/ServerController");
serverController = new serverController();

//SERVER_MEMBERS
let server_membersController = require("./controller/Server_membersController");
server_membersController = new server_membersController();

//Create a new server
createRouteAuth(serverController.create, "servers", "post"); //servers
//List user's servers (as member)
createRouteAuth(server_membersController.getByIdUser, "servers", "get"); //servers
//List all servers
createRouteAuth(serverController.getAll, "servers/all", "get"); //servers/all
//Get server details
createRouteAuthWithGuard(serverController.getById, "servers/:id", "get"); //servers/:id
//Update server
createRouteAuthWithGuard(serverController.update, "servers/:id", "put"); //servers/:id
//Delete server
createRouteAuthWithGuard(serverController.delete, "servers/:id", "delete"); //servers/:id
//Join a server
createRouteAuthWithGuard(
  server_membersController.create,
  "servers/:id/join",
  "post",
); //servers/:id/join
//Leave a server
createRouteAuthWithGuard(
  server_membersController.delete,
  "servers/:id/leave",
  "delete",
); //servers/:id/leave
//Get current user's role in server — statique, DOIT être avant /:userId
createRouteAuth(
  server_membersController.getMyRole,
  "servers/:id/members/me",
  "get",
); //servers/:id/members/me
//List banned members — statique, DOIT être avant /:userId
createRouteAuthWithGuard(
  server_membersController.getBannedUsers,
  "servers/:id/members/banned",
  "get",
); //servers/:id/members/banned
//List server members
createRouteAuthWithGuard(
  server_membersController.getAll,
  "servers/:id/members",
  "get",
); //servers/:id/members
//Update member role
createRouteAuthWithGuard(
  server_membersController.update,
  "servers/:id/members/:userId",
  "put",
); //servers/:id/members/:userId
//Kick member from server
createRouteAuthWithGuard(
  server_membersController.kick,
  "servers/:id/members/:userId",
  "delete",
); //servers/:id/members/:userId
//Ban member from server
createRouteAuthWithGuard(
  server_membersController.ban,
  "servers/:id/members/:userId/ban",
  "put",
); //servers/:id/members/:userId/ban
//Unban member from server
createRouteAuthWithGuard(
  server_membersController.unban,
  "servers/:id/members/:userId/unban",
  "put",
); //servers/:id/members/:userId/unban

//CHANNELS
let channelController = require("./controller/ChannelController");
channelController = new channelController();
//Create a channel
createRouteAuthWithGuard(
  channelController.create,
  "servers/:serverId/channels",
  "post",
); //servers/:serverId/channels
//List server channels
createRouteAuthWithGuard(
  channelController.getAll,
  "servers/:serverId/channels",
  "get",
); //servers/:serverId/channels
//Get channel details
createRouteAuth(channelController.getById, "channels/:id", "get"); //channels/:id
//Update channel
createRouteAuth(channelController.update, "channels/:id", "put"); //channels/:id
//Delete channel
createRouteAuth(channelController.delete, "channels/:id", "delete"); //channels/:id

//INVITATIONS
let invitationController = require("./controller/InvitationController");
invitationController = new invitationController();
//Route publique pour la page join (sans auth)
router.get("/invitations/:code", invitationController.getByCode);
//Create an invitation
createRouteAuthWithGuard(
  invitationController.create,
  "servers/:serverId/invitations",
  "post",
); //servers/:serverId/invitations
//List server invitations
createRouteAuthWithGuard(
  invitationController.getAll,
  "servers/:serverId/invitations",
  "get",
); //servers/:serverId/invitations
//Get invitation details
createRouteAuthWithGuard(
  invitationController.getByCode,
  "servers/:serverId/invitations/:code",
  "get",
); //servers/:serverId/invitations/:code
//Delete invitation
createRouteAuthWithGuard(
  invitationController.delete,
  "servers/:serverId/invitations/:id",
  "delete",
); //servers/:serverId/invitations/:id
//Join via invitation code
createRouteAuthWithGuard(
  invitationController.join,
  "invitations/join",
  "post",
); //invitations/join

//MESSAGES
let messageController = require("./controller/MessagesController");
messageController = new messageController();
//Send a message
createRouteAuth(
  messageController.sendMessage,
  "servers/:serverId/channels/:channelId/messages",
  "post",
); //servers/:serverId/channels/:channelId/messages
//Get messages
createRouteAuth(
  messageController.getMessages,
  "servers/:serverId/channels/:channelId/messages",
  "get",
); //servers/:serverId/channels/:channelId/messages
//Delete a message
createRouteAuth(
  messageController.deleteMessage,
  "servers/:serverId/channels/:channelId/messages/:id",
  "delete",
); //servers/:serverId/channels/:channelId/messages/:id

module.exports = router;