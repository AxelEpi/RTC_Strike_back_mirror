CREATE TYPE "server_member_role" AS ENUM (
  'OWNER',
  'ADMIN',
  'MEMBER',
  'BANNED'
);

CREATE TABLE "users" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "description" varchar(255),
  "username" varchar(255) UNIQUE NOT NULL,
  "email" varchar(255) UNIQUE NOT NULL,
  "password_hash" varchar(255) NOT NULL,
  "token" varchar(512),
  "token_expires_at" timestamp,
  "created_at" timestamp DEFAULT (now())
);

CREATE TABLE "servers" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "description" varchar(255),
  "user_id" uuid NOT NULL,
  "name" varchar(255) NOT NULL,
  "created_at" timestamp DEFAULT (now())
);

CREATE TABLE "server_members" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "server_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "role" server_member_role NOT NULL DEFAULT 'MEMBER',
  "joined_at" timestamp DEFAULT (now()),
  "banned_until" timestamp
);

CREATE TABLE "channels" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "server_id" uuid NOT NULL,
  "name" varchar(255) NOT NULL,
  "created_at" timestamp DEFAULT (now())
);

CREATE TABLE "invitations" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "server_id" uuid NOT NULL,
  "user_id" uuid,
  "code" varchar(255) UNIQUE NOT NULL,
  "uses" int DEFAULT 0,
  "max_uses" int,
  "created_at" timestamp DEFAULT (now()),
  "expires_at" timestamp
);

CREATE UNIQUE INDEX "unique_server_user" ON "server_members" ("server_id", "user_id");

CREATE INDEX "idx_channels_server_name" ON "channels" ("server_id", "name");

CREATE INDEX "idx_channels_server" ON "channels" ("server_id");

CREATE INDEX "idx_invitations_code" ON "invitations" ("code");

CREATE INDEX "idx_invitations_server" ON "invitations" ("server_id");

COMMENT ON COLUMN "users"."username" IS 'Obligatoire - Nom d''utilisateur';

COMMENT ON COLUMN "users"."email" IS 'Obligatoire - Email de connexion';

COMMENT ON COLUMN "users"."password_hash" IS 'Obligatoire - Hash bcrypt du mot de passe';

COMMENT ON COLUMN "users"."token" IS 'Token de récupération de mot de passe (optionnel)';

COMMENT ON COLUMN "users"."token_expires_at" IS 'Date d''expiration du token (optionnel)';

COMMENT ON COLUMN "servers"."user_id" IS 'Créateur du serveur';

COMMENT ON COLUMN "invitations"."user_id" IS 'Créateur de l''invitation (optionnel)';

COMMENT ON COLUMN "invitations"."code" IS 'Code d''invitation unique';

COMMENT ON COLUMN "invitations"."uses" IS 'Nombre d''utilisations actuelles';

COMMENT ON COLUMN "invitations"."max_uses" IS 'NULL = utilisations illimitées';

COMMENT ON COLUMN "invitations"."expires_at" IS 'NULL = pas d''expiration';

ALTER TABLE "servers" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "server_members" ADD FOREIGN KEY ("server_id") REFERENCES "servers" ("id") ON DELETE CASCADE;

ALTER TABLE "channels" ADD FOREIGN KEY ("server_id") REFERENCES "servers" ("id") ON DELETE CASCADE;

ALTER TABLE "invitations" ADD FOREIGN KEY ("server_id") REFERENCES "servers" ("id") ON DELETE CASCADE;

ALTER TABLE "server_members" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "invitations" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

-- Trigger function pour initialiser un nouveau serveur
-- 1. Ajoute le créateur comme OWNER dans server_members
-- 2. Crée un channel "general" par défaut
CREATE OR REPLACE FUNCTION initialize_new_server()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. Ajouter le créateur comme OWNER
  INSERT INTO server_members (server_id, user_id, role)
  VALUES (NEW.id, NEW.user_id, 'OWNER');
  
  -- 2. Créer le channel "general"
  INSERT INTO channels (server_id, name)
  VALUES (NEW.id, 'general');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS server_members_initialize ON servers;

-- Créer le nouveau trigger
CREATE TRIGGER server_members_initialize
AFTER INSERT ON servers
FOR EACH ROW
EXECUTE FUNCTION initialize_new_server();



-- ============================================
-- TRIGGER QUI NETTOIE TOUS LES TOKENS EXPIRÉS
-- Sur CHAQUE action (INSERT, UPDATE, DELETE, SELECT via trigger)
-- ============================================

-- Fonction qui nettoie TOUS les tokens expirés
CREATE OR REPLACE FUNCTION clean_all_expired_tokens_trigger()
RETURNS TRIGGER AS $$
DECLARE
    count INTEGER;
BEGIN
    -- Nettoyer TOUS les tokens expirés dans la table users
    UPDATE users
    SET token = NULL, token_expires_at = NULL
    WHERE token IS NOT NULL 
      AND token_expires_at < NOW();
    
    GET DIAGNOSTICS count = ROW_COUNT;
    
    -- Logger si des tokens ont été nettoyés
    IF count > 0 THEN
        RAISE NOTICE '🧹 Nettoyé % token(s) expiré(s)', count;
    END IF;
    
    -- Retourner la ligne modifiée (important pour le trigger)
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Supprimer les anciens triggers s'ils existent
DROP TRIGGER IF EXISTS trigger_clean_all_expired_tokens ON users;

-- Créer le trigger sur TOUTES les opérations
CREATE TRIGGER trigger_clean_all_expired_tokens
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW
    EXECUTE FUNCTION clean_all_expired_tokens_trigger();
