-- CreateTable
CREATE TABLE IF NOT EXISTS "OwnerAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "passwordSalt" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "OwnerSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OwnerSession_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "OwnerAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "OwnerAccount_phone_key" ON "OwnerAccount"("phone");
CREATE UNIQUE INDEX IF NOT EXISTS "OwnerSession_token_key" ON "OwnerSession"("token");

-- Seed default owner (example data) when empty
INSERT INTO "OwnerAccount" ("id","name","phone","passwordHash","passwordSalt","createdAt","updatedAt")
SELECT 'owner-seed','Dona Exemplo','login-demo-123','f225abd44d78408a9e78d970e0736aec2f028b0eb93f971af87f70009c8f3cc2','segredo-demo-2025',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "OwnerAccount" LIMIT 1);
