export function getYouTubeVideoId(mediaPath?: string | null) {
  if (!mediaPath) return null;

  const trimmedPath = mediaPath.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmedPath)) {
    return trimmedPath;
  }

  try {
    const url = new URL(trimmedPath);
    const host = url.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') {
      return url.pathname.split('/').filter(Boolean)[0] || null;
    }

    if (host.includes('youtube.com')) {
      const watchId = url.searchParams.get('v');
      if (watchId) return watchId;

      const parts = url.pathname.split('/').filter(Boolean);
      const keyedSegment = parts.findIndex((part) => ['embed', 'shorts', 'v'].includes(part));
      if (keyedSegment >= 0) {
        return parts[keyedSegment + 1] || null;
      }
    }
  } catch {
    const match = trimmedPath.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|shorts\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s/]+)/,
    );
    return match?.[1] || null;
  }

  return null;
}

export function getYouTubeThumbnailUrl(mediaPath?: string | null) {
  const videoId = getYouTubeVideoId(mediaPath);
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : undefined;
}
