// Nombre entier
exports.isNumber = (value) => /^\d+$/.test(String(value));

// Texte (tout sauf vide, accepte emojis et ponctuation)
exports.isText = (value) => value && String(value).trim().length > 0;

// Email
exports.isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

// Username (3–20 caractères alphanum + _)
exports.isUsername = (value) => /^[a-zA-Z0-9_]{3,20}$/.test(value);

// Password safe (8+ char, 1 maj, 1 min, 1 chiffre)
exports.isPassword = (value) =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(value);

// UUID (si tu utilises postgres uuid)
exports.isUUID = (value) => /^[0-9a-fA-F-]{36}$/.test(value);
