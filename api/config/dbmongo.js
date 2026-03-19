require("dotenv").config({ path: "../.env" }); // Charger les variables d'environnement depuis le fichier .env
const mongoose = require("mongoose"); // Importer mongoose pour MongoDB

// Configurer la connexion MongoDB
mongoose.connect(process.env.MONGO_URI, {
  authSource: "admin", // Utiliser la base de données admin pour l'authentification
});

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      authSource: "admin", // ✅ Correct si user créé dans admin DB
    });
  } catch (err) {
    process.exit(1);
  }
}
module.exports = {
  mongoose,
  connectDB,
};
