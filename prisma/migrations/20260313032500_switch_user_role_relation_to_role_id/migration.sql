-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "new_User" ("id", "name", "email", "passwordHash", "roleId", "role", "isDemo", "active", "createdAt", "updatedAt")
SELECT
    "User"."id",
    "User"."name",
    "User"."email",
    "User"."passwordHash",
    "Role"."id",
    "User"."role",
    "User"."isDemo",
    "User"."active",
    "User"."createdAt",
    "User"."updatedAt"
FROM "User"
INNER JOIN "Role" ON "Role"."code" = "User"."role";

DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_isDemo_idx" ON "User"("isDemo");
CREATE INDEX "User_roleId_idx" ON "User"("roleId");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
