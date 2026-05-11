export function getSongVersionUrl(
  projectId: string,
  songId: string,
  versionId: string,
): string {
  return `/projects/${projectId}/songs/${songId}?version=${versionId}`;
}

export function getLyricsUrl(
  projectId: string,
  songId: string,
  versionNumber?: number,
): string {
  const base = `/projects/${projectId}/songs/${songId}?tab=lyrics`;
  return versionNumber ? `${base}&lyricsVersion=${versionNumber}` : base;
}

export function getSongUrl(projectId: string, songId: string): string {
  return `/projects/${projectId}/songs/${songId}`;
}

export function getProjectUrl(projectId: string): string {
  return `/projects/${projectId}`;
}

export function getEventUrl(projectId: string, eventId: string): string {
  return `/projects/${projectId}/calendar?event=${eventId}`;
}
