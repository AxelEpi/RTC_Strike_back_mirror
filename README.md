-- Active: 1764252690218@@127.0.0.1@8080@mysql
# RTC - Real Time Chat Application

Application de chat en temps réel (type Discord) avec serveurs, canaux, rôles et messagerie instantanée.

## ✨ Fonctionnalités

- 🔐 Authentification complète (JWT)
- 💬 Chat temps réel via WebSocket
- 🏢 Serveurs & Canaux
- 👥 Rôles (Owner, Admin, Member)
- 🎨 Interface responsive
- ✏️ Édition/Suppression de messages


---
 
## 🚀 Installation

### 1. Prérequis
- Docker et Docker Compose
- Ports : 3000, 4000, 5432, 27017

### 2. Configuration
Créez `.env` à la racine :
```bash
API_PORT=4000
API_URL=http://localhost:4000
APP_PORT=3000
APP_HOST=http://localhost:3000

POSTGRES_USER=admin
POSTGRES_PASSWORD=admin
POSTGRES_DB=mydb
DATABASE_URL=postgresql://admin:admin@postgres:5432/mydb

MONGO_INITDB_ROOT_USERNAME=root
MONGO_INITDB_ROOT_PASSWORD=rootpassword
MONGO_INITDB_DATABASE=chat_db
MONGO_URL=mongodb://root:rootpassword@mongodb:27017/chat_db?authSource=admin

JWT_SECRET=your-super-secret-jwt-key-change-this
```

⚠️ **Ne jamais commiter le `.env` !**

### 3. Lancement
```bash
# Première fois
docker compose up --build

# Utilisations suivantes
docker compose up -d

# Arrêter
docker compose down

# Réinitialiser (supprime les données)
docker compose down -v && docker compose up --build
```

### 4. Accès
- Frontend : http://localhost:3000
- Backend : http://localhost:4000
- Health : http://localhost:4000/health
- Adminer : http://localhost:7777

---

## 📁 Structure

```
api/                    # Backend Node.js + Express
├── config/            # DB connections
├── model/             # Modèles Postgres & Mongo
├── services/          # Logique métier
├── controller/        # Routes handlers
├── middleware/        # Auth & permissions
├── sockets/           # WebSocket handlers
├── test/              # 24 tests automatisés
└── router.js

my-app/                # Frontend Next.js
└── src/
    ├── pages/         # Routes (auth, servers)
    ├── components/    # Chat, Sidebar, Layout
    ├── hooks/         # useAuth, useSidebarData
    └── lib/           # API client, Socket

db/schema.sql          # Init PostgreSQL
compose.yml            # Docker orchestration
```

---

## 🛠️ Stack

| Composant | Technologie |
|-----------|-------------|
| Frontend | Next.js 16, React 19, Tailwind CSS |
| Backend | Node.js 20, Express 5, WebSocket (ws) |
| DB | PostgreSQL 16, MongoDB 7 |
| Auth | JWT |
| DevOps | Docker Compose |

**PostgreSQL** : users, servers, channels, members, invitations  
**MongoDB** : messages, typing, presence

---

## 🌐 Routes API Principales

**Auth** : `/auth/signup`, `/auth/login`, `/auth/me`, `/auth/logout`  
**Servers** : `/servers` (GET/POST), `/servers/:id` (GET/PUT/DELETE)  
**Channels** : `/servers/:id/channels` (GET/POST), `/channels/:id` (GET/PUT/DELETE)  
**Members** : `/servers/:id/members`, `/servers/:id/join`, `/servers/:id/leave`  
**WebSocket** : `ws://localhost:4000/ws` → events: `message:new`, `message:edit`, `message:delete`

---

## 🧪 Tests

```bash
# Voir les résultats (auto au démarrage)
docker compose logs test-runner

# Relancer
docker compose restart test-runner
```

24 tests : Auth, Servers, Channels, Members, Invitations

---

## 🔧 Commandes Utiles

```bash
# Logs
docker compose logs -f api
docker compose logs -f frontend

# Installer un package
docker compose exec api npm install <package>

# Accéder au conteneur
docker compose exec api sh

# PostgreSQL
docker compose exec postgres psql -U admin -d mydb

# MongoDB
docker compose exec mongodb mongosh -u root -p rootpassword
```

---

## ❓ Dépannage

**API ne démarre pas** :
```bash
docker compose logs api
# Vérifier ports et DATABASE_URL dans .env
```

**Frontend ne se connecte pas** :
```bash
curl http://localhost:4000/health
# Devrait retourner {"status":"ok"}
```

**Tables n'existent pas** :
```bash
docker compose down -v
docker compose up --build
```

**WebSocket déconnecté** :
```bash
# Vérifier dans my-app/src/lib/socket.js
# URL: ws://localhost:4000/ws
```

**Module manquant** :
```bash
docker compose exec api npm install
docker compose restart api
```

---

## 🗂️ Où Coder ?

**Authentification** :  
→ `api/services/auth.service.js` + `api/controller/AuthController.js`  
→ `my-app/src/pages/auth/login.js` + `my-app/src/hooks/useAuth.js`

**Serveurs/Canaux** :  
→ `api/services/server.service.js` + `api/controller/ServerController.js`  
→ `my-app/src/components/Sidebar/page.js`

**Messages** :  
→ `api/sockets/index.js` + `api/services/message.service.js`  
→ `my-app/src/components/Chat/page.js` + `my-app/src/lib/socket.js`

---

## 📝 Responsive Design

Breakpoints Tailwind (mobile-first) :
```jsx
<div className="px-2 md:px-4 lg:px-6">
  <h1 className="text-lg md:text-xl lg:text-2xl">Titre</h1>
</div>
```

`md:` = tablette (768px), `lg:` = desktop (1024px)

---

## 📄 Projet

**Projet Epitech - T-JSF-600**  
Application de chat temps réel  
