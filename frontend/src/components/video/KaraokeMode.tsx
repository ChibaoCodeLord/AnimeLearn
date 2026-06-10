import React, { useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  ChevronLeft,
  Music2,
  Palette,
  Pause,
  Play,
  Quote,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type KaraokeTheme = 'dark' | 'light' | 'pink' | 'blue';

type KaraokeThemeConfig = {
  shell: string;
  header: string;
  stage: string;
  controlBg: string;
  border: string;
  iconBg: string;
  themeRail: string;
  activeLine: string;
  activeText: string;
  nearText: string;
  inactiveText: string;
  subText: string;
  activeSubText: string;
  accentBar: string;
  accentText: string;
  iconButton: string;
  playButton: string;
  range: string;
  badge: string;
};

type MaybePromise<T> = T | Promise<T>;

type PlayerLike = {
  getVolume?: () => number;
  isMuted?: () => boolean;
  getCurrentTime?: () => MaybePromise<number>;
  getDuration?: () => MaybePromise<number>;
  seekTo?: (seconds: number, allowSeekAhead?: boolean) => void;
  setVolume?: (volume: number) => void;
  unMute?: () => void;
  mute?: () => void;
};

type KanjiInfo = {
  kanji?: string;
  mean?: string;
  level?: string | number;
  stroke_count?: string | number;
  kun?: string;
  on?: string;
  detail?: string;
};

type VocabItem = {
  word?: string;
  reading?: string;
  meaning?: string;
  meaning_vi?: string;
  kanji_info?: KanjiInfo[];
};

type ScriptLine = {
  japanese?: string;
  vietnamese?: string;
  vocabulary?: VocabItem[];
};

const setCookie = (name: string, value: string) => {
  document.cookie = `${name}=${value};path=/;max-age=${30 * 24 * 60 * 60}`;
};

const getCookie = (name: string) => {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  if (match) return match[2];
  return null;
};

interface KaraokeModeProps {
  script: ScriptLine[];
  vocabList: VocabItem[];
  currentIndex: number;
  playerRef: React.RefObject<PlayerLike | null>;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onJumpToTime: (index: number) => void;
}

const themeStyles: Record<KaraokeTheme, KaraokeThemeConfig> = {
  dark: {
    shell: 'bg-zinc-950 text-white border-zinc-800',
    header: 'bg-zinc-900/95',
    stage: 'bg-zinc-950',
    controlBg: 'bg-zinc-900/95',
    border: 'border-zinc-800',
    iconBg: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/20',
    themeRail: 'bg-black/25 border-white/10',
    activeLine: 'bg-white/[0.08] border-white/10 shadow-2xl shadow-black/30',
    activeText: 'text-white',
    nearText: 'text-zinc-300',
    inactiveText: 'text-zinc-600',
    subText: 'text-zinc-500',
    activeSubText: 'text-emerald-300',
    accentBar: 'bg-emerald-400',
    accentText: 'text-emerald-300',
    iconButton: 'text-zinc-400 hover:bg-white/10 hover:text-white',
    playButton: 'bg-white text-zinc-950 hover:bg-emerald-100',
    range: 'bg-zinc-700 accent-emerald-400',
    badge: 'bg-zinc-800 text-zinc-300 border-zinc-700',
  },
  light: {
    shell: 'bg-white text-slate-950 border-slate-200',
    header: 'bg-white/95',
    stage: 'bg-slate-50',
    controlBg: 'bg-white/95',
    border: 'border-slate-200',
    iconBg: 'bg-teal-50 text-teal-700 border-teal-100',
    themeRail: 'bg-slate-100 border-slate-200',
    activeLine: 'bg-white border-slate-200 shadow-xl shadow-slate-200/70',
    activeText: 'text-slate-950',
    nearText: 'text-slate-600',
    inactiveText: 'text-slate-300',
    subText: 'text-slate-400',
    activeSubText: 'text-teal-600',
    accentBar: 'bg-teal-500',
    accentText: 'text-teal-700',
    iconButton: 'text-slate-500 hover:bg-slate-100 hover:text-slate-900',
    playButton: 'bg-slate-950 text-white hover:bg-teal-700',
    range: 'bg-slate-200 accent-teal-600',
    badge: 'bg-slate-100 text-slate-600 border-slate-200',
  },
  pink: {
    shell: 'bg-[#fff8fb] text-rose-950 border-rose-100',
    header: 'bg-white/80',
    stage: 'bg-[#fff8fb]',
    controlBg: 'bg-white/90',
    border: 'border-rose-100',
    iconBg: 'bg-rose-100 text-rose-700 border-rose-200',
    themeRail: 'bg-white/80 border-rose-100',
    activeLine: 'bg-white/90 border-rose-100 shadow-xl shadow-rose-100/70',
    activeText: 'text-rose-950',
    nearText: 'text-rose-700',
    inactiveText: 'text-rose-200',
    subText: 'text-rose-300',
    activeSubText: 'text-teal-600',
    accentBar: 'bg-teal-500',
    accentText: 'text-teal-700',
    iconButton: 'text-rose-400 hover:bg-rose-50 hover:text-rose-800',
    playButton: 'bg-rose-950 text-white hover:bg-teal-700',
    range: 'bg-rose-100 accent-teal-600',
    badge: 'bg-rose-50 text-rose-700 border-rose-100',
  },
  blue: {
    shell: 'bg-[#f5fbff] text-slate-950 border-sky-100',
    header: 'bg-white/85',
    stage: 'bg-[#f5fbff]',
    controlBg: 'bg-white/90',
    border: 'border-sky-100',
    iconBg: 'bg-sky-100 text-sky-700 border-sky-200',
    themeRail: 'bg-white/85 border-sky-100',
    activeLine: 'bg-white/95 border-sky-100 shadow-xl shadow-sky-100/70',
    activeText: 'text-slate-950',
    nearText: 'text-sky-800',
    inactiveText: 'text-sky-200',
    subText: 'text-sky-300',
    activeSubText: 'text-indigo-600',
    accentBar: 'bg-indigo-500',
    accentText: 'text-indigo-700',
    iconButton: 'text-sky-500 hover:bg-sky-50 hover:text-sky-900',
    playButton: 'bg-slate-950 text-white hover:bg-indigo-700',
    range: 'bg-sky-100 accent-indigo-600',
    badge: 'bg-sky-50 text-sky-700 border-sky-100',
  },
};

export default function KaraokeMode({
  script,
  vocabList,
  currentIndex,
  playerRef,
  isPlaying,
  onTogglePlay,
  onJumpToTime,
}: KaraokeModeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const [theme, setThemeState] = useState<KaraokeTheme>(() => {
    const saved = getCookie('karaoke_theme');
    return (saved as KaraokeTheme) || 'dark';
  });

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);

  const [modalStep, setModalStep] = useState(0);
  const [selectedLine, setSelectedLine] = useState<ScriptLine | null>(null);
  const [selectedVocab, setSelectedVocab] = useState<VocabItem | null>(null);
  const [selectedKanji, setSelectedKanji] = useState<KanjiInfo | null>(null);

  const setTheme = (nextTheme: KaraokeTheme) => {
    setThemeState(nextTheme);
    setCookie('karaoke_theme', nextTheme);
  };

  const currentTheme = themeStyles[theme];

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    let volumeSyncTimeout: ReturnType<typeof setTimeout> | undefined;

    if (playerRef?.current) {
      volumeSyncTimeout = setTimeout(() => {
        try {
          const currentVol = playerRef.current?.getVolume?.();
          const muted = playerRef.current?.isMuted?.();
          if (typeof currentVol === 'number') setVolume(currentVol);
          if (typeof muted === 'boolean') setIsMuted(muted);
        } catch (error) {
          console.debug('Unable to sync YouTube volume state', error);
        }
      }, 0);

      interval = setInterval(async () => {
        if (!isDragging) {
          try {
            const time = await playerRef.current?.getCurrentTime?.();
            const dur = await playerRef.current?.getDuration?.();
            setCurrentTime(time || 0);
            if (dur && duration === 0) setDuration(dur);
          } catch (error) {
            console.debug('Unable to sync YouTube playback time', error);
          }
        }
      }, 500);
    }

    return () => {
      if (interval) clearInterval(interval);
      if (volumeSyncTimeout) clearTimeout(volumeSyncTimeout);
    };
  }, [playerRef, isDragging, duration]);

  useEffect(() => {
    const activeEl = lineRefs.current[currentIndex];
    const container = containerRef.current;

    if (activeEl && container) {
      const targetScroll =
        activeEl.offsetTop -
        container.offsetTop -
        container.clientHeight / 2 +
        activeEl.clientHeight / 2;

      container.scrollTo({ top: Math.max(0, targetScroll), behavior: 'smooth' });
    }
  }, [currentIndex]);

  const handleSeekCommit = () => {
    playerRef?.current?.seekTo?.(currentTime, true);
    setIsDragging(false);
  };

  const handleSkip = async (amount: number) => {
    if (playerRef?.current) {
      const time = (await playerRef.current.getCurrentTime?.()) || 0;
      const nextTime = Math.max(0, time + amount);
      playerRef.current.seekTo?.(nextTime, true);
      setCurrentTime(nextTime);
    }
  };

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextVolume = parseInt(event.target.value, 10);
    setVolume(nextVolume);

    if (playerRef?.current) {
      playerRef.current.setVolume?.(nextVolume);
      if (nextVolume > 0 && isMuted) {
        playerRef.current.unMute?.();
        setIsMuted(false);
      }
    }
  };

  const toggleMute = () => {
    if (playerRef?.current) {
      if (isMuted) {
        playerRef.current.unMute?.();
        setIsMuted(false);
      } else {
        playerRef.current.mute?.();
        setIsMuted(true);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  if (!script || script.length === 0) return null;

  const iconButtonClass = cn(
    'flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 active:scale-95',
    currentTheme.iconButton
  );
  const currentLineNumber = Math.min(script.length, Math.max(1, currentIndex + 1));

  return (
    <div
      className={cn(
        'relative flex h-[calc(100vh-11rem)] min-h-[560px] max-h-[820px] w-full flex-col overflow-hidden rounded-2xl border shadow-xl transition-colors duration-500',
        currentTheme.shell
      )}
    >
      <div className={cn('shrink-0 border-b px-4 py-3 md:px-6', currentTheme.header, currentTheme.border)}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border', currentTheme.iconBg)}>
              <Music2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className={cn('text-sm font-black uppercase tracking-normal', currentTheme.accentText)}>Karaoke</p>
              <p className="truncate text-xs font-semibold opacity-70">
                {currentLineNumber}/{script.length} câu
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <Badge variant="outline" className={cn('h-7 rounded-full px-3 text-xs font-bold', currentTheme.badge)}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </Badge>
            <div className={cn('flex items-center gap-2 rounded-full border p-1.5 shadow-sm', currentTheme.themeRail)}>
              <Palette className="h-4 w-4 opacity-60" />
              {(['dark', 'light', 'pink', 'blue'] as KaraokeTheme[]).map((themeOption) => (
                <button
                  key={themeOption}
                  type="button"
                  aria-label={`Theme ${themeOption}`}
                  title={`Theme ${themeOption}`}
                  onClick={() => setTheme(themeOption)}
                  className={cn(
                    'h-6 w-6 rounded-full border-2 transition-all duration-200',
                    theme === themeOption
                      ? 'scale-110 border-white shadow-md ring-2 ring-black/10'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  )}
                  style={{
                    backgroundColor:
                      themeOption === 'dark'
                        ? '#18181b'
                        : themeOption === 'light'
                          ? '#cbd5e1'
                          : themeOption === 'pink'
                            ? '#fbcfe8'
                            : '#bae6fd',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={cn('relative min-h-0 flex-1 overflow-hidden', currentTheme.stage)}>
        <div
          ref={containerRef}
          className="h-full overflow-y-auto custom-scrollbar scroll-smooth px-4 py-20 md:px-10 md:py-24 lg:px-20"
        >
          <div className="mx-auto max-w-5xl space-y-5">
            {script.map((line, index) => {
              const isActive = index === currentIndex;
              const distance = Math.abs(index - currentIndex);
              const isNear = distance <= 1;

              return (
                <button
                  type="button"
                  key={index}
                  ref={(element) => {
                    lineRefs.current[index] = element;
                  }}
                  onClick={() =>
                    index === currentIndex
                      ? (setSelectedLine(line), setModalStep(1))
                      : onJumpToTime(index)
                  }
                  className={cn(
                    'group relative block w-full rounded-2xl border text-left transition-all duration-500',
                    isActive
                      ? cn('px-5 py-5 md:px-8 md:py-6', currentTheme.activeLine)
                      : cn(
                          'border-transparent px-5 py-3 hover:bg-white/40',
                          isNear ? 'opacity-95' : 'opacity-55 hover:opacity-80'
                        )
                  )}
                >
                  {isActive && (
                    <span className={cn('absolute left-0 top-5 h-[calc(100%-2.5rem)] w-1 rounded-r-full', currentTheme.accentBar)} />
                  )}
                  <h2
                    className={cn(
                      'break-words font-black leading-tight tracking-normal transition-colors duration-500',
                      isActive
                        ? cn('text-3xl md:text-5xl', currentTheme.activeText)
                        : cn(isNear ? currentTheme.nearText : currentTheme.inactiveText, 'text-2xl md:text-3xl')
                    )}
                  >
                    {line.japanese}
                  </h2>
                  <p
                    className={cn(
                      'mt-3 break-words font-semibold leading-relaxed transition-colors duration-500',
                      isActive
                        ? cn('text-base md:text-xl', currentTheme.activeSubText)
                        : cn(currentTheme.subText, isNear ? 'text-sm md:text-base' : 'text-sm')
                    )}
                  >
                    {line.vietnamese}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className={cn('z-10 shrink-0 border-t px-4 py-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] md:px-6 md:py-5', currentTheme.controlBg, currentTheme.border)}>
        <div className={cn('mx-auto flex w-full max-w-6xl items-center gap-3 font-mono text-xs font-bold', currentTheme.subText)}>
          <span>{formatTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            aria-label="Timeline"
            onPointerDown={() => setIsDragging(true)}
            onChange={(event) => setCurrentTime(parseFloat(event.target.value))}
            onPointerUp={handleSeekCommit}
            onBlur={handleSeekCommit}
            className={cn('h-1.5 flex-1 cursor-pointer appearance-none rounded-full transition-all', currentTheme.range)}
          />
          <span>{formatTime(duration)}</span>
        </div>

        <div className="mx-auto mt-4 flex min-h-16 w-full max-w-6xl flex-col gap-3 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center">
          <div className="hidden min-w-0 items-center gap-2 md:flex">
            <Badge variant="outline" className={cn('h-7 rounded-full px-3 text-[10px] font-black uppercase', currentTheme.badge)}>
              Karaoke mode
            </Badge>
            <span className={cn('truncate text-xs font-bold', currentTheme.subText)}>
              Câu {currentLineNumber}/{script.length}
            </span>
          </div>

          <div className="flex items-center justify-center gap-1.5 sm:gap-3">
            <button type="button" title="Lùi 15 giây" aria-label="Lùi 15 giây" onClick={() => handleSkip(-15)} className={iconButtonClass}>
              <RotateCcw className="h-5 w-5" />
            </button>
            <button type="button" title="Câu trước" aria-label="Câu trước" onClick={() => onJumpToTime(Math.max(0, currentIndex - 1))} className={iconButtonClass}>
              <SkipBack className="h-5 w-5 fill-current" />
            </button>
            <button
              type="button"
              title={isPlaying ? 'Tạm dừng' : 'Phát'}
              aria-label={isPlaying ? 'Tạm dừng' : 'Phát'}
              onClick={onTogglePlay}
              className={cn(
                'flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-200 hover:scale-105 active:scale-95',
                currentTheme.playButton
              )}
            >
              {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="ml-1 h-5 w-5 fill-current" />}
            </button>
            <button type="button" title="Câu tiếp" aria-label="Câu tiếp" onClick={() => onJumpToTime(Math.min(script.length - 1, currentIndex + 1))} className={iconButtonClass}>
              <SkipForward className="h-5 w-5 fill-current" />
            </button>
            <button type="button" title="Tiến 15 giây" aria-label="Tiến 15 giây" onClick={() => handleSkip(15)} className={iconButtonClass}>
              <RotateCw className="h-5 w-5" />
            </button>
          </div>

          <div className="flex min-w-0 items-center justify-center gap-2 md:justify-end">
            <button
              type="button"
              title={isMuted || volume === 0 ? 'Bật âm thanh' : 'Tắt âm thanh'}
              aria-label={isMuted || volume === 0 ? 'Bật âm thanh' : 'Tắt âm thanh'}
              onClick={toggleMute}
              className={iconButtonClass}
            >
              {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={isMuted ? 0 : volume}
              aria-label="Volume"
              onChange={handleVolumeChange}
              className={cn('h-1 w-24 cursor-pointer appearance-none rounded-full', currentTheme.range)}
            />
          </div>
        </div>
      </div>

      {modalStep > 0 && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 p-4 animate-in fade-in duration-300 md:p-8 dark:bg-slate-950/70"
          onClick={() => setModalStep(0)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] border border-white/20 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
              {modalStep > 1 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setModalStep(modalStep - 1)}
                  className="rounded-full text-slate-500 hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <ChevronLeft className="mr-1 h-4 w-4" /> Quay lại
                </Button>
              ) : (
                <div className="w-20" />
              )}
              <Badge className="rounded-full border-none bg-emerald-100 px-4 py-1.5 text-[10px] font-bold uppercase text-emerald-700">
                Phân tích chuyên sâu
              </Badge>
              <button
                type="button"
                onClick={() => setModalStep(0)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 shadow-inner transition-all hover:bg-rose-500 hover:text-white dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-rose-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain bg-[#fcfcfd] p-6 custom-scrollbar md:p-10 dark:bg-slate-950">
              {modalStep === 1 && selectedLine && (
                <div className="animate-in slide-in-from-bottom-4">
                  <div className="mb-8 rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-8 shadow-sm dark:border-emerald-900/60 dark:from-emerald-950/50 dark:to-teal-950/40">
                    <p className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-normal text-emerald-600">
                      <Quote className="h-4 w-4" /> Dịch nghĩa câu
                    </p>
                    <h3 className="mb-4 text-3xl font-black leading-tight text-slate-800 dark:text-slate-50">
                      {selectedLine.japanese}
                    </h3>
                    <p className="text-xl font-medium leading-relaxed text-slate-600 italic dark:text-slate-200">
                      {selectedLine.vietnamese}
                    </p>
                  </div>
                  <p className="mb-4 text-[10px] font-black uppercase tracking-normal text-slate-400">
                    Từ vựng quan trọng
                  </p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {selectedLine.vocabulary?.map((vocab, index) => (
                      <div
                        key={index}
                        onClick={() => {
                          const enriched = vocabList.find((item) => item.word === vocab.word);
                          setSelectedVocab(enriched ? { ...vocab, ...enriched } : vocab);
                          setModalStep(2);
                        }}
                        className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:-translate-y-1 hover:border-emerald-400 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-500"
                      >
                        <p className="mb-1 text-[10px] font-bold uppercase tracking-normal text-slate-400 dark:text-slate-500">
                          {vocab.reading}
                        </p>
                        <p className="text-2xl font-black text-slate-800 dark:text-slate-50">{vocab.word}</p>
                        <p className="mt-2 line-clamp-1 border-t border-slate-50 pt-2 text-sm font-medium text-slate-500 dark:border-slate-800 dark:text-slate-300">
                          {vocab.meaning}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {modalStep === 2 && selectedVocab && (
                <div className="animate-in slide-in-from-right-4">
                  <div className="mb-8 rounded-3xl border border-violet-100 bg-violet-50 p-8 shadow-sm dark:border-violet-900/50 dark:bg-violet-950/30">
                    <p className="mb-1 text-lg font-bold text-violet-500">{selectedVocab.reading}</p>
                    <h3 className="mb-4 break-words text-5xl font-black text-slate-800 dark:text-slate-50 md:text-6xl">
                      {selectedVocab.word}
                    </h3>
                    <p className="text-xl font-bold text-slate-700 dark:text-slate-200">
                      {selectedVocab.meaning || selectedVocab.meaning_vi}
                    </p>
                  </div>
                  <div className="space-y-4">
                    <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-normal text-slate-400">
                      <BookOpen className="h-4 w-4" /> Phân tích Hán tự
                    </p>
                    {selectedVocab.kanji_info?.map((kanji, index) => (
                      <div
                        key={index}
                        onClick={() => {
                          setSelectedKanji(kanji);
                          setModalStep(3);
                        }}
                        className="group flex cursor-pointer items-center gap-6 rounded-2xl border border-slate-100 bg-white p-5 transition-all hover:border-rose-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:hover:border-rose-500"
                      >
                        <div className="text-5xl font-black text-rose-500 drop-shadow-sm transition-transform group-hover:scale-110">
                          {kanji.kanji}
                        </div>
                        <div>
                          <p className="text-2xl font-black uppercase text-slate-800 dark:text-slate-50">{kanji.mean}</p>
                          <p className="mt-1 text-sm font-bold text-slate-400">
                            N{kanji.level} • {kanji.stroke_count} nét
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {modalStep === 3 && selectedKanji && (
                <div className="animate-in slide-in-from-right-4">
                  <div className="mb-8 flex flex-col items-center gap-8 rounded-[2rem] border border-rose-100 bg-gradient-to-br from-rose-50 to-orange-50 p-10 shadow-inner md:flex-row dark:border-rose-900/60 dark:from-rose-950/50 dark:to-orange-950/30">
                    <div className="select-none text-[120px] font-black leading-none text-rose-600 drop-shadow-2xl md:text-[140px]">
                      {selectedKanji.kanji}
                    </div>
                    <div className="text-center md:text-left">
                      <h2 className="mb-3 text-4xl font-black uppercase text-slate-800 md:text-5xl dark:text-slate-50">
                        {selectedKanji.mean}
                      </h2>
                      <div className="flex justify-center gap-2 md:justify-start">
                        <Badge className="rounded-full bg-rose-500 px-4 py-1.5 font-bold text-white shadow-md">
                          N{selectedKanji.level}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="rounded-full border-rose-200 bg-white px-4 py-1.5 font-bold shadow-sm dark:border-rose-900 dark:bg-slate-900 dark:text-slate-200"
                        >
                          {selectedKanji.stroke_count} nét
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                      <p className="mb-2 text-[10px] font-black uppercase tracking-normal text-pink-400">
                        Âm Kun (Nhật)
                      </p>
                      <p className="text-2xl font-black text-slate-700 dark:text-slate-200">
                        {selectedKanji.kun || '---'}
                      </p>
                    </div>
                    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                      <p className="mb-2 text-[10px] font-black uppercase tracking-normal text-sky-400">
                        Âm On (Hán)
                      </p>
                      <p className="text-2xl font-black text-slate-700 dark:text-slate-200">
                        {selectedKanji.on || '---'}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-[2rem] border border-slate-100 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <p className="mb-5 text-[10px] font-black uppercase tracking-normal text-slate-400">
                      Định nghĩa chi tiết
                    </p>
                    <ul className="space-y-4">
                      {selectedKanji.detail?.split(/[,;]/).map((meaning: string, index: number) => (
                        <li key={index} className="flex items-start gap-4 text-slate-700 dark:text-slate-200">
                          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-100 text-sm font-black text-rose-600 shadow-sm">
                            {index + 1}
                          </span>
                          <span className="pt-1.5 text-lg font-medium leading-relaxed">{meaning.trim()}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
