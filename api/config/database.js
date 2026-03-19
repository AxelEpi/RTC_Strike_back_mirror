require("dotenv").config({ path: "../.env" }); // Charger les variables d'environnement depuis le fichier .env
const { Pool } = require("pg"); // Importer le module pg pour PostgreSQL
const mongoose = require("mongoose"); // Importer mongoose pour MongoDB

// Configurer la connexion MongoDB
mongoose.connect(process.env.MONGO_URI, {
  authSource: "admin", // Utiliser la base de données admin pour l'authentification
});

// Configurer la connexion PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

module.exports = {
  pool,
  mongoose,
};
