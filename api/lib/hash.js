const bcrypt = require("bcrypt");

const saltRounds = 10;

async function hashPassword(plainPassword) {
  try {
    return await bcrypt.hash(plainPassword, saltRounds);
  } catch (error) {
    throw new Error("Error while hashing the password");
  }
}

async function verifyPassword(plainPassword, hashedPassword) {
  try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (error) {
    throw new Error("Error while verifying the password");
  }
}

module.exports = { hashPassword, verifyPassword };
