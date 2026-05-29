import { useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import YouTubeOrigin from 'react-youtube';
import { isCurrentVideoWorkspaceRoute } from '@/lib/playerRoute';
import { getYouTubeVideoId } from '@/lib/youtube';
import { usePlayerStore } from '@/stores/usePlayerStore';

const YouTube = (YouTubeOrigin as any).default || YouTubeOrigin;

export default function GlobalAudioPlayer() {
  const location = useLocation();
  const playerRef = useRef<any>(null);
  const currentTimeRef = useRef(0);
  const isPlayerReadyRef = useRef(false);
  const {
    currentVideo,
    isPlaying,
    currentTime,
    duration,
    setIsPlaying,
    setPlaybackPosition,
  } = usePlayerStore();

  const isOnCurrentWorkspace = isCurrentVideoWorkspaceRoute(
    location.pathname,
    location.search,
    currentVideo,
  );
  const videoId = getYouTubeVideoId(currentVideo?.youtubeUrl);
  const shouldPlayHidden = Boolean(currentVideo && videoId && isPlaying && !isOnCurrentWorkspace);

  const getAttachedPlayer = useCallback(() => {
    const player = playerRef.current;

    if (!player || !isPlayerReadyRef.current) {
      return null;
    }

    try {
      const iframe = player.getIframe?.();

      if (!iframe || !iframe.isConnected || !iframe.contentWindow) {
        return null;
      }
    } catch {
      return null;
    }

    return player;
  }, []);

  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  useEffect(() => {
    isPlayerReadyRef.current = false;
    playerRef.current = null;
  }, [videoId]);

  useEffect(() => {
    if (!currentVideo || !videoId) return;

    const player = getAttachedPlayer();
    if (!player) return;

    try {
      if (shouldPlayHidden) {
        const resumeTime = currentTimeRef.current;
        if (resumeTime > 0) {
          player.seekTo?.(resumeTime, true);
        }
        player.setVolume?.(100);
        player.unMute?.();
        player.playVideo?.();
        return;
      }

      player.mute?.();
      player.setVolume?.(0);
      player.pauseVideo?.();
    } catch {
      // The iframe can disappear during route/player teardown.
    }
  }, [currentVideo, getAttachedPlayer, shouldPlayHidden, videoId]);

  useEffect(() => {
    if (!currentVideo || !videoId || isOnCurrentWorkspace) return;

    const interval = window.setInterval(async () => {
      const player = getAttachedPlayer();
      if (!player) return;

      try {
        const nextTime = await player.getCurrentTime?.();
        const nextDuration = await player.getDuration?.();

        if (typeof nextTime === 'number') {
          setPlaybackPosition(
            nextTime,
            typeof nextDuration === 'number' ? nextDuration : undefined,
          );
        }
      } catch {
        // YouTube iframe can be temporarily unavailable while switching videos.
      }
    }, 500);

    return () => window.clearInterval(interval);
  }, [currentVideo, getAttachedPlayer, videoId, isOnCurrentWorkspace, setPlaybackPosition]);

  if (!currentVideo || !videoId) return null;

  return (
    <div
      className="pointer-events-none fixed -left-[9999px] top-0 h-px w-px overflow-hidden opacity-0"
      aria-hidden="true"
    >
      <YouTube
        key={videoId}
        videoId={videoId}
        opts={{
          width: '1',
          height: '1',
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            playsinline: 1,
            enablejsapi: 1,
            rel: 0,
            origin: window.location.origin,
          },
        }}
        onReady={async (event: any) => {
          playerRef.current = event.target;
          isPlayerReadyRef.current = true;

          try {
            const iframe = event.target.getIframe?.();
            if (!iframe || !iframe.isConnected) return;

            const duration = await event.target.getDuration?.();
            const resumeTime = currentTimeRef.current;
            setPlaybackPosition(resumeTime, typeof duration === 'number' ? duration : undefined);
            if (shouldPlayHidden) {
              event.target.setVolume?.(100);
              event.target.unMute?.();
              event.target.seekTo?.(resumeTime, true);
              event.target.playVideo?.();
            } else {
              event.target.mute?.();
              event.target.setVolume?.(0);
              event.target.pauseVideo?.();
            }
          } catch {
            // The player will retry on the next interval tick.
          }
        }}
        onStateChange={(event: any) => {
          if (!getAttachedPlayer()) return;
          if (isOnCurrentWorkspace) return;

          if (event.data === 1) {
            setIsPlaying(true);
          }

          if (event.data === 2 || event.data === 0) {
            setIsPlaying(false);
          }
        }}
        onEnd={() => {
          if (!getAttachedPlayer()) return;
          if (!isOnCurrentWorkspace) {
            setIsPlaying(false);
            const finalDuration = duration || currentVideo.duration || 0;
            setPlaybackPosition(finalDuration, finalDuration || undefined);
          }
        }}
      />
    </div>
  );
}
