-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Entry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "path" TEXT NOT NULL,
    "version" TEXT,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "requests" JSONB NOT NULL,
    "try" TEXT,
    "media" JSONB NOT NULL,
    "body" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "firstPublishedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" DATETIME NOT NULL,
    "removedAt" DATETIME
);
INSERT INTO "new_Entry" ("body", "contentHash", "date", "firstPublishedAt", "id", "media", "path", "publishedAt", "removedAt", "requests", "status", "title", "try", "type", "version") SELECT "body", "contentHash", "date", "firstPublishedAt", "id", "media", "path", "publishedAt", "removedAt", "requests", "status", "title", "try", "type", "version" FROM "Entry";
DROP TABLE "Entry";
ALTER TABLE "new_Entry" RENAME TO "Entry";
CREATE INDEX "Entry_version_idx" ON "Entry"("version");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- Reading-first review: only open change requests remain a status.
UPDATE "Entry" SET "status" = 'open' WHERE "status" <> 'changes-requested';
