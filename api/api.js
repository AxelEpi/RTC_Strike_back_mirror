const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const http = require("http");
require("dotenv").config();

const app = express();
const router = require("./router");
const port = process.env.API_PORT || 4000;

// CORS
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use("/", router);

// Créer un serveur HTTP
const server = http.createServer(app);

// Initialiser le WebSocket (importé depuis le dossier sockets)
require("./sockets")(server);

// Démarrer le serveur uniquement si ce n'est pas un test
if (process.env.NODE_ENV !== "test") {
  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${port}`);
    console.log(`WebSocket server running on ws://localhost:${port}`);
  });
}

module.exports = app;
