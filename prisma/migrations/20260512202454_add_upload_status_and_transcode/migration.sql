-- CreateEnum
CREATE TYPE "UploadStatus" AS ENUM ('AWAITING_UPLOAD', 'PROCESSING', 'READY', 'FAILED');

-- AlterTable: add compressedFilePath and uploadStatus to SongVersion
ALTER TABLE "SongVersion" ADD COLUMN "compressedFilePath" TEXT;
ALTER TABLE "SongVersion" ADD COLUMN "uploadStatus" "UploadStatus" NOT NULL DEFAULT 'AWAITING_UPLOAD';

-- CreateTable
CREATE TABLE "TranscodeJob" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "versionId" TEXT NOT NULL,

    CONSTRAINT "TranscodeJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TranscodeJob_versionId_key" ON "TranscodeJob"("versionId");

-- AddForeignKey
ALTER TABLE "TranscodeJob" ADD CONSTRAINT "TranscodeJob_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "SongVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
