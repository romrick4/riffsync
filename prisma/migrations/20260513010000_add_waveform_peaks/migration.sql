-- AlterTable
ALTER TABLE "SongVersion" ADD COLUMN "waveformPeaks" JSONB,
ADD COLUMN "durationSec" DOUBLE PRECISION;
