const ENDPOINT = process.env.API_URL || "http://localhost:4000";

// Store the authentication token
let authToken = null;

/**
 * Set the authentication token
 */
function setAuthToken(token) {
  authToken = token;
  console.log("🔑 Token saved");
}

/**
 * Get the authentication token
 */
function getAuthToken() {
  return authToken;
}

/**
 * Generic function to make an HTTP request
 * @param {string} method - HTTP method ("GET", "POST", "PUT", "DELETE")
 * @param {string} path - Endpoint path
 * @param {string} task - Task name for logging
 * @param {Object} [body] - Request body (for POST, PUT)
 * @returns {Promise<Object|null>} - JSON result or null on error
 */
async function request(method, path, task, body = null) {
  const url = `${ENDPOINT}/${path}`;
  console.log(`\n→ Task ${task} | ${url}`);

  const headers = { "Content-Type": "application/json" };

  // Add Authorization header if we have a token
  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
    console.log("🔑 Sending token");
  }

  const options = {
    method,
    headers,
    ...(body && { body: JSON.stringify(body) }),
  };

  try {
    const response = await fetch(url, options);

    // Read body once, then parse
    const text = await response.text();
    let result;
    try {
      result = text ? JSON.parse(text) : {};
    } catch (e) {
      result = { message: text };
    }

    if (!response.ok) {
      console.error(`❌ Failed (${response.status}):\n`, result, "\n");
      return null;
    }

    // If response contains a token, save it
    if (result && result.token) {
      setAuthToken(result.token);
    }

    console.log("✅ Successful\n", result, "\n");
    return result;
  } catch (err) {
    console.error("❌ Failed:\n", err.message, "\n");
    return null;
  }
}

// Specific functions for each HTTP method
const get = (task, path) => request("GET", path, task);
const post = (task, path, body) => request("POST", path, task, body);
const put = (task, path, body) => request("PUT", path, task, body);
const remove = (task, path, body) => request("DELETE", path, task, body);

module.exports = { get, post, put, remove };
