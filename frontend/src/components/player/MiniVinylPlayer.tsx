import { Disc3, Music2, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { isCurrentVideoWorkspaceRoute } from '@/lib/playerRoute';
import { getYouTubeThumbnailUrl } from '@/lib/youtube';
import { usePlayerStore } from '@/stores/usePlayerStore';

interface MiniVinylPlayerProps {
  className?: string;
}

export default function MiniVinylPlayer({ className = '' }: MiniVinylPlayerProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    currentVideo,
    isPlaying,
    progress,
    currentTime,
    isMiniPlayerVisible,
    clearPlayer,
    togglePlay,
  } = usePlayerStore();

  if (!isMiniPlayerVisible) return null;

  const isCurrentWorkspace = isCurrentVideoWorkspaceRoute(
    location.pathname,
    location.search,
    currentVideo,
  );

  if (!currentVideo) {
  return (
    <div
      className={`
        flex h-11 min-w-0 max-w-30 items-center gap-3
        rounded-sm
        border border-green-400/30 dark:border-green-800/50
        bg-green-100 dark:bg-green-900/60
        px-2.5 pr-4
        text-green-900 dark:text-white
        shadow-sm shadow-green-500/20
        backdrop-blur
        ${className}
      `}
    >
      <div
        className="
          relative
          flex h-8 w-8 shrink-0 items-center justify-center
          rounded-full
          bg-green-200 dark:bg-green-800
          ring-1 ring-green-400/40 dark:ring-green-700/50
          shadow-sm shadow-green-500/20
        "
      >
        <Disc3 className="h-5 w-5 text-green-600 dark:text-green-300" />

        <span
          className="
            absolute -right-0.5 -top-0.5
            h-2.5 w-2.5
            rounded-full
            bg-green-500 dark:bg-green-400
            ring-2 ring-green-100 dark:ring-green-900
          "
        />
      </div>

      <p className="min-w-0 truncate text-xs font-semibold text-green-800 dark:text-white">
        Chọn một video để chill nào (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧
      </p>
    </div>
  );
}

  const thumbnailUrl =
    currentVideo.thumbnailUrl || getYouTubeThumbnailUrl(currentVideo.youtubeUrl);

  const openCurrentVideo = () => {
    const targetPath = currentVideo.workspacePath || `/VideoWorkspace?id=${currentVideo.id}`;
    const [pathname, rawSearch = ''] = targetPath.split('?');
    const params = new URLSearchParams(rawSearch);
    const resumeTime = Math.max(0, Math.floor(currentTime));

    if (resumeTime > 0) {
      params.set('t', String(resumeTime));
    }

    const nextSearch = params.toString();
    navigate(nextSearch ? `${pathname}?${nextSearch}` : pathname);
  };

  return (
  <div
    className={`
      relative
      h-12
      min-w-0
      max-w-40
      rounded-md
      p-[2px]
      overflow-visible
      ${
        isPlaying
          ? 'bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 shadow-md shadow-cyan-500/30'
          : 'bg-cyan-300'
      }
      ${className}
    `}
  >
    {/* Clear playing animation */}
    {isPlaying && (
      <div className="pointer-events-none absolute -inset-0.5 rounded-md border border-cyan-400/70 shadow-[0_0_14px_rgba(34,211,238,0.1)] animate-pulse" />
    )}

    {/* Inner content */}
    <div
      onClick={openCurrentVideo}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openCurrentVideo();
        }
      }}
      className="
        relative z-10
        flex h-full min-w-0 max-w-full
        cursor-pointer items-center gap-3
        rounded-[4px]
        bg-slate-950
        px-2 pr-2.5
        shadow-sm
        transition-colors duration-150
        hover:bg-slate-900
      "
    >
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          togglePlay();
        }}
        className="
          group relative h-9 w-9 shrink-0 rounded-full
          focus:outline-none
          focus-visible:ring-2
          focus-visible:ring-cyan-300
          focus-visible:ring-offset-2
          focus-visible:ring-offset-slate-950
        "
        aria-label={isPlaying ? 'Tạm dừng mini player' : 'Phát mini player'}
        title={isPlaying ? 'Tạm dừng' : 'Phát'}
      >
        {/* Vinyl + thumbnail cùng quay */}
        <span
          className={`
            absolute inset-0 rounded-full
            shadow-inner ring-1 ring-cyan-300/30
            ${isPlaying ? 'animate-spin' : ''}
          `}
          style={{
            animationDuration: '7s',
            background:
              'repeating-radial-gradient(circle, #020617 0 3px, #111827 3px 5px, #1e293b 5px 8px)',
          }}
        >
          <span className="absolute inset-[5px] rounded-full border border-white/20 bg-slate-900" />

          <span className="absolute inset-[9px] flex items-center justify-center overflow-hidden rounded-full bg-cyan-50 ring-2 ring-cyan-200">
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <Music2 className="h-3.5 w-3.5 text-cyan-500" />
            )}
          </span>

          <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/90 shadow-sm" />
        </span>
      </button>

      <div className="min-w-0 flex-1">
        <p
          className="truncate text-xs font-bold leading-5 text-slate-100"
          title={currentVideo.title}
        >
          <span
            className={`
              font-extrabold
              ${isPlaying ? 'text-cyan-300' : 'text-amber-300'}
            `}
          >
            {isPlaying ? 'Playing:' : 'Paused:'}
          </span>{' '}
          <span className="text-slate-100">
            {currentVideo.title || 'Anime đang phát'}
          </span>
        </p>

        <div className="h-1 overflow-hidden rounded-full bg-slate-800">
          <div
            className={`
              h-full rounded-full transition-all duration-300
              ${
                isPlaying
                  ? 'bg-linear-to-r from-cyan-400 via-blue-500 to-indigo-500'
                  : 'bg-linear-to-r from-amber-300 to-orange-400'
              }
            `}
            style={{
              width: `${Math.min(100, Math.max(0, progress))}%`,
            }}
          />
        </div>
      </div>

      {!isCurrentWorkspace && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            clearPlayer();
          }}
          className="
            flex h-7 w-7 shrink-0 items-center justify-center
            rounded-full
            text-slate-400
            transition-colors
            hover:bg-slate-800
            hover:text-cyan-300
            focus:outline-none
            focus-visible:ring-2
            focus-visible:ring-cyan-300
          "
          aria-label="Tắt mini player"
          title="Tắt"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  </div>
);
}