require('dotenv').config({ path: '../.env' });
const request = require('supertest');
const app = require('../api');
const { test, expect, afterAll } = require('@jest/globals');
const { pool, mongoose } = require('../config/database');

// Cleanup test data and close connections
afterAll(async () => {
  try {
    // Delete test users
    await pool.query("DELETE FROM users WHERE username LIKE 'test_%'");
    await pool.end();
    await mongoose.connection.close();
  } catch (err) {
    console.error('Cleanup error:', err);
  }
});

//USERS

// Generate unique but short username (max 20 chars)
let randomId = Math.floor(Math.random() * 10000);
let username = `test_user${randomId}`;
let email = `${username}@example.com`;
let password = 'TestPassword123';
let userId;
let cookie_auth;

//POST /auth/signup - Create a new user account
test('POST /auth/signup - Create a new user account', async () => {
  const res = await request(app).post('/auth/signup').send({
    username: username,
    email: email,
    password: password,
  });

  expect(res.statusCode).toBe(201);
  expect(res.body).toHaveProperty('username', username);
  expect(res.body).toHaveProperty('email', `${username}@example.com`);
  expect(res.body).toHaveProperty('id');
  userId = res.body.id;
});

// POST /auth/login - Authenticate and get tokens
test('POST /auth/login - Authenticate and get tokens', async () => {
  const res = await request(app).post('/auth/login').send({
    email: email,
    password: password,
  });

  expect(res.statusCode).toBe(200);
  expect(res.body).toHaveProperty('success', true);
  expect(res.body).toHaveProperty('message', 'Connected');
  // Extract cookies from login response
  cookie_auth = res.headers['set-cookie'];
});

// GET /me - Get current user information
test('GET /me - Get current user information', async () => {
  const res = await request(app).get('/me').set('Cookie', cookie_auth);

  expect(res.statusCode).toBe(200);
  expect(res.body).toHaveProperty('success', true);
  expect(res.body.data).toHaveProperty('id', userId);
  expect(res.body.data).toHaveProperty('username', username);
  expect(res.body.data).toHaveProperty('email', email);
});

// PUT /auth/update - Update user account
test('PUT /auth/update - Update user account', async () => {
  randomId = Math.floor(Math.random() * 10000);
  username = `test_user${randomId}`;
  email = `${username}@example.com`;
  password = 'TestPassword974';
  const description = 'Updated description for testing';
  const res = await request(app).put('/auth/update').set('Cookie', cookie_auth).send({
    username: username,
    email: email,
    password: password,
    description: description,
  });

  expect(res.statusCode).toBe(200);
  expect(res.body).toHaveProperty('username', username);
  expect(res.body).toHaveProperty('email', email);
  expect(res.body).toHaveProperty('description', description);
});

// SERVER
let serverId;
let serverName = 'Test Server';
let serverDescription = 'This is a test server';

// POST /servers - Create a new server
test('POST /servers - Create a new server', async () => {
  const res = await request(app)
    .post('/servers')
    .send({
      name: serverName,
      description: serverDescription,
    })
    .set('Cookie', cookie_auth);

  expect(res.statusCode).toBe(201);
  expect(res.body).toHaveProperty('name', serverName);
  expect(res.body).toHaveProperty('description', serverDescription);
  expect(res.body).toHaveProperty('user_id', userId);
  serverId = res.body.id;
});

//GET /servers - List user's servers
test("GET /servers - List user's servers", async () => {
  const res = await request(app).get('/servers').set('Cookie', cookie_auth);

  expect(res.statusCode).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
});

// GET /server/{id} - Get server details
test('GET  /server/{id} - Get server details', async () => {
  const res = await request(app).get(`/servers/${serverId}`).set('Cookie', cookie_auth);

  expect(res.statusCode).toBe(200);
  expect(res.body).toHaveProperty('id', serverId);
  expect(res.body).toHaveProperty('name', serverName);
  expect(res.body).toHaveProperty('description', serverDescription);
  expect(res.body).toHaveProperty('user_id', userId);
});

// GET /servers/all - List all servers
test('GET /servers/all - List all servers', async () => {
  const res = await request(app).get('/servers/all').set('Cookie', cookie_auth);

  expect(res.statusCode).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
});

// PUT /servers/{id} - Update server
test('PUT /servers/{id} - Update server', async () => {
  serverName = 'Updated Test Server';
  serverDescription = 'This is an updated test server';
  const res = await request(app).put(`/servers/${serverId}`).set('Cookie', cookie_auth).send({
    name: serverName,
    description: serverDescription,
  });

  expect(res.statusCode).toBe(200);
  expect(res.body).toHaveProperty('id', serverId);
  expect(res.body).toHaveProperty('name', serverName);
  expect(res.body).toHaveProperty('description', serverDescription);
  expect(res.body).toHaveProperty('user_id', userId);
});

// SERVER MEMBERS
let serverMemberId;

// DELETE kick member from server
test('DELETE /servers/{id}/members/:userId - Kick member from server', async () => {
  const res = await request(app)
    .delete(`/servers/${serverId}/members/${userId}`)
    .set('Cookie', cookie_auth);
  expect(res.statusCode).toBe(200);
  expect(res.body).toHaveProperty('message', `servers_members ${res.body.id} deleted.`);
});

// POST /servers/{id}/join - Join a server\
test('POST /servers/{id}/join - Join a server', async () => {
  const res = await request(app).post(`/servers/${serverId}/join`).set('Cookie', cookie_auth);
  expect(res.statusCode).toBe(201);
  expect(res.body).toHaveProperty('user_id', userId);
  expect(res.body).toHaveProperty('server_id', serverId);
  serverMemberId = res.body.id;
});

// GET /servers/{id}/members - List server members
test('GET /servers/{id}/members - List server members', async () => {
  const res = await request(app).get(`/servers/${serverId}/members`).set('Cookie', cookie_auth);
  expect(res.statusCode).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
});

// PUT /servers/{id}/members/:userId - Update member role
test('PUT /servers/{id}/members/:userId - Update member role', async () => {
  const res = await request(app)
    .put(`/servers/${serverId}/members/${userId}`)
    .set('Cookie', cookie_auth)
    .send({
      role: 'ADMIN',
    });
  expect(res.statusCode).toBe(200);
  expect(res.body).toHaveProperty('id', serverMemberId);
  expect(res.body).toHaveProperty('role', 'ADMIN');
});

//Get current user's role in server (including banned)
test("GET /servers/{id}/members/me - Get current user's role in server", async () => {
  const res = await request(app).get(`/servers/${serverId}/members/me`).set('Cookie', cookie_auth);
  expect(res.statusCode).toBe(200);
  expect(res.body).toHaveProperty('role', 'ADMIN');
});

// CHANNELS
let channelId;
let channelName = 'Test Channel';

// POST /servers/{serverId}/channels - Create a channel
test('POST /servers/{serverId}/channels - Create a channel', async () => {
  const res = await request(app)
    .post(`/servers/${serverId}/channels`)
    .set('Cookie', cookie_auth)
    .send({
      name: channelName,
    });
  expect(res.statusCode).toBe(201);
  expect(res.body).toHaveProperty('name', channelName);
  expect(res.body).toHaveProperty('server_id', serverId);
  channelId = res.body.id;
});

// GET /servers/{serverId}/channels - List server channels
test('GET /servers/{serverId}/channels - List server channels', async () => {
  const res = await request(app).get(`/servers/${serverId}/channels`).set('Cookie', cookie_auth);
  expect(res.statusCode).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
});

// GET /channels/{id} - Get channel details
test('GET /channels/{id} - Get channel details', async () => {
  const res = await request(app).get(`/channels/${channelId}`).set('Cookie', cookie_auth);
  expect(res.statusCode).toBe(200);
  expect(res.body).toHaveProperty('id', channelId);
  expect(res.body).toHaveProperty('name', channelName);
  expect(res.body).toHaveProperty('server_id', serverId);
});

// PUT /channels/{id} - Update channel
test('PUT /channels/{id} - Update channel', async () => {
  channelName = 'Updated Test Channel';
  const res = await request(app).put(`/channels/${channelId}`).set('Cookie', cookie_auth).send({
    name: channelName,
  });
  expect(res.statusCode).toBe(200);
  expect(res.body).toHaveProperty('id', channelId);
  expect(res.body).toHaveProperty('name', channelName);
  expect(res.body).toHaveProperty('server_id', serverId);
});

// MESSAGES
let messageId;
let messageContent;
// POST /servers/{serverId}/channels/{channelId}/messages - Send a message
test('POST /servers/{serverId}/channels/{channelId}/messages - Send a message', async () => {
  // First, create a new channel to send messages to
  const channelRes = await request(app)
    .post(`/servers/${serverId}/channels`)
    .set('Cookie', cookie_auth)
    .send({
      name: 'Message Test Channel',
    });

  // Now, send a message to that channel
  messageContent = 'Hello, this is a test message!';
  const res = await request(app)
    .post(`/servers/${serverId}/channels/${channelId}/messages`)
    .set('Cookie', cookie_auth)
    .send({ content: messageContent });

  expect(res.statusCode).toBe(201);
  expect(res.body).toHaveProperty('success', true);
  expect(res.body).toHaveProperty('message');
  expect(res.body.message).toHaveProperty('content', messageContent);
  expect(res.body.message).toHaveProperty('userId', userId);
  messageId = res.body.message._id;
});

// GET /channels/{id}/messages - Get channel message history
test('GET /servers/{serverId}/channels/{channelId}/messages - Get channel message history', async () => {
  // First, create a new channel and send a message to ensure there's at least one message in the history
  const channelRes = await request(app)
    .post(`/servers/${serverId}/channels`)
    .set('Cookie', cookie_auth)
    .send({
      name: 'Message History Test Channel',
    });

  const res = await request(app)
    .get(`/servers/${serverId}/channels/${channelId}/messages`)
    .set('Cookie', cookie_auth);

  expect(res.statusCode).toBe(200);
  expect(res.body).toHaveProperty('success', true);
  expect(res.body).toHaveProperty('messages');
  expect(Array.isArray(res.body.messages)).toBe(true);
  expect(res.body.messages.length).toBeGreaterThan(0);
  expect(res.body.messages[0]).toHaveProperty('content', messageContent);
  expect(res.body.messages[0]).toHaveProperty('channelId', channelId);
  expect(res.body.messages[0]).toHaveProperty('userId', userId);
});

// DELETE /messages/{id} - Delete message
test('DELETE /servers/{serverId}/channels/{channelId}/messages/{id} - Delete message', async () => {
  const res = await request(app)
    .delete(`/servers/${serverId}/channels/${channelId}/messages/${messageId}`)
    .set('Cookie', cookie_auth);

  expect(res.statusCode).toBe(200);
  expect(res.body).toHaveProperty('success', true);
  expect(res.body).toHaveProperty('message', 'Message supprimé');
});

// ---------------------------------------END-------------------------------------------

// CHANNELS
// DELETE /channels/{id} - Delete channel
test('DELETE /channels/{id} - Delete channel', async () => {
  const res = await request(app).delete(`/channels/${channelId}`).set('Cookie', cookie_auth);
  expect(res.statusCode).toBe(200);
  expect(res.body).toHaveProperty('id', channelId);
  expect(res.body).toHaveProperty('message', `Channel ${channelId} delete.`);
});

//SERVER MEMBERS
// DELETE /servers/{id}/leave - Leave a server
test('DELETE /servers/{id}/leave - Leave a server', async () => {
  const res = await request(app).delete(`/servers/${serverId}/leave`).set('Cookie', cookie_auth);
  expect(res.statusCode).toBe(200);
  expect(res.body).toHaveProperty('id', serverMemberId);
  expect(res.body).toHaveProperty('message', `servers_members ${serverMemberId} deleted.`);
});

//SERVER
// DELETE /servers/{id} - Delete server
test('DELETE /servers/{id} - Delete server', async () => {
  const res = await request(app).delete(`/servers/${serverId}`).set('Cookie', cookie_auth);

  expect(res.statusCode).toBe(200);
  expect(res.body).toHaveProperty('id', serverId);
  expect(res.body).toHaveProperty('message', `Server ${serverId} delete.`);
});

// USER
// POST /auth/logout - Invalidate tokens
test('POST /auth/logout - Invalidate tokens', async () => {
  const res = await request(app).post('/auth/logout').set('Cookie', cookie_auth);

  expect(res.statusCode).toBe(200);
  expect(res.body).toHaveProperty('success', true);
  expect(res.body).toHaveProperty('message', 'Disconnected');
});
