import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export interface PlayerVideo {
  id: string;
  title: string;
  youtubeUrl: string;
  thumbnailUrl?: string;
  workspacePath?: string;
  duration?: number;
}

interface PlayerState {
  currentVideo: PlayerVideo | null;
  isPlaying: boolean;
  progress: number;
  currentTime: number;
  duration: number;
  isMiniPlayerVisible: boolean;
}

interface PlayerActions {
  setCurrentVideo: (video: PlayerVideo | null) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  togglePlay: () => void;
  setProgress: (progress: number) => void;
  setPlaybackPosition: (currentTime: number, duration?: number) => void;
  showMiniPlayer: () => void;
  hideMiniPlayer: () => void;
  clearPlayer: () => void;
}

export type PlayerStore = PlayerState & PlayerActions;

const initialState: PlayerState = {
  currentVideo: null,
  isPlaying: false,
  progress: 0,
  currentTime: 0,
  duration: 0,
  isMiniPlayerVisible: true,
};

const PlayerStoreContext = createContext<PlayerStore | null>(null);

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

export function PlayerStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PlayerState>(initialState);

  const setCurrentVideo = useCallback((video: PlayerVideo | null) => {
    setState((previous) => {
      if (!video) {
        return { ...initialState };
      }

      const isSameVideo = previous.currentVideo?.id === video.id;

      return {
        ...previous,
        currentVideo: video,
        isMiniPlayerVisible: true,
        progress: isSameVideo ? previous.progress : 0,
        currentTime: isSameVideo ? previous.currentTime : 0,
        duration: isSameVideo ? previous.duration : video.duration ?? 0,
      };
    });
  }, []);

  const setIsPlaying = useCallback((isPlaying: boolean) => {
    setState((previous) => ({ ...previous, isPlaying }));
  }, []);

  const togglePlay = useCallback(() => {
    setState((previous) => ({
      ...previous,
      isPlaying: previous.currentVideo ? !previous.isPlaying : false,
    }));
  }, []);

  const setProgress = useCallback((progress: number) => {
    setState((previous) => ({
      ...previous,
      progress: clampPercent(progress),
    }));
  }, []);

  const setPlaybackPosition = useCallback((currentTime: number, duration?: number) => {
    setState((previous) => {
      const nextDuration = typeof duration === 'number' && duration > 0
        ? duration
        : previous.duration;
      const nextProgress = nextDuration > 0
        ? clampPercent((currentTime / nextDuration) * 100)
        : previous.progress;

      return {
        ...previous,
        currentTime: Math.max(0, currentTime),
        duration: nextDuration,
        progress: nextProgress,
      };
    });
  }, []);

  const showMiniPlayer = useCallback(() => {
    setState((previous) => ({ ...previous, isMiniPlayerVisible: true }));
  }, []);

  const hideMiniPlayer = useCallback(() => {
    setState((previous) => ({ ...previous, isMiniPlayerVisible: false }));
  }, []);

  const clearPlayer = useCallback(() => {
    setState({ ...initialState });
  }, []);

  const value = useMemo<PlayerStore>(
    () => ({
      ...state,
      setCurrentVideo,
      setIsPlaying,
      togglePlay,
      setProgress,
      setPlaybackPosition,
      showMiniPlayer,
      hideMiniPlayer,
      clearPlayer,
    }),
    [
      state,
      setCurrentVideo,
      setIsPlaying,
      togglePlay,
      setProgress,
      setPlaybackPosition,
      showMiniPlayer,
      hideMiniPlayer,
      clearPlayer,
    ],
  );

  return (
    <PlayerStoreContext.Provider value={value}>
      {children}
    </PlayerStoreContext.Provider>
  );
}

export function usePlayerStore(): PlayerStore;
export function usePlayerStore<T>(selector: (store: PlayerStore) => T): T;
export function usePlayerStore<T>(selector?: (store: PlayerStore) => T) {
  const store = useContext(PlayerStoreContext);

  if (!store) {
    throw new Error('usePlayerStore must be used inside PlayerStoreProvider');
  }

  return selector ? selector(store) : store;
}
