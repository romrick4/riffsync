-- CreateTable
CREATE TABLE "BandPage" (
    "id" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "bio" TEXT,
    "contactEmail" TEXT,
    "heroImagePath" TEXT,
    "socialLinks" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "BandPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BandPageTrack" (
    "id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bandPageId" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "versionId" TEXT,

    CONSTRAINT "BandPageTrack_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BandPage_projectId_key" ON "BandPage"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "BandPageTrack_bandPageId_songId_key" ON "BandPageTrack"("bandPageId", "songId");

-- AddForeignKey
ALTER TABLE "BandPage" ADD CONSTRAINT "BandPage_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BandPageTrack" ADD CONSTRAINT "BandPageTrack_bandPageId_fkey" FOREIGN KEY ("bandPageId") REFERENCES "BandPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BandPageTrack" ADD CONSTRAINT "BandPageTrack_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BandPageTrack" ADD CONSTRAINT "BandPageTrack_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "SongVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
