import type { PlayerVideo } from '@/stores/usePlayerStore';

export function isCurrentVideoWorkspaceRoute(
  pathname: string,
  search: string,
  currentVideo: PlayerVideo | null,
) {
  if (!currentVideo) return false;

  const normalizedPath = pathname.toLowerCase();
  const pathAndSearch = `${pathname}${search}`;

  if (currentVideo.workspacePath && pathAndSearch === currentVideo.workspacePath) {
    return true;
  }

  const workspaceMatch = normalizedPath.match(/^\/workspace\/([^/]+)$/);
  if (workspaceMatch?.[1] === currentVideo.id.toLowerCase()) {
    return true;
  }

  if (normalizedPath === '/videoworkspace') {
    const params = new URLSearchParams(search);
    const routeVideoId = params.get('id');
    const routeUrl = params.get('url');

    if (routeVideoId && routeVideoId === currentVideo.id) {
      return true;
    }

    if (routeUrl && routeUrl === currentVideo.youtubeUrl) {
      return true;
    }
  }

  return false;
}
