import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, ChevronLeft, Volume2, VolumeX, Sparkles, 
  BookOpen, SkipBack, SkipForward, RotateCcw, RotateCw, X, Quote, Palette
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type KaraokeTheme = 'dark' | 'light' | 'pink' | 'blue';

// --- Helper Cookie ---
const setCookie = (name: string, value: string) => {
  document.cookie = `${name}=${value};path=/;max-age=${30 * 24 * 60 * 60}`; // Lưu 30 ngày
};

const getCookie = (name: string) => {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  if (match) return match[2];
  return null;
};

interface KaraokeModeProps {
  script: any[];
  vocabList: any[];
  currentIndex: number;
  playerRef: any;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onJumpToTime: (index: number) => void;
}

export default function KaraokeMode({
  script, vocabList, currentIndex, playerRef, isPlaying, onTogglePlay, onJumpToTime
}: KaraokeModeProps) {
  
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  // Khởi tạo theme từ Cookie (nếu có), mặc định là 'dark'
  const [theme, setThemeState] = useState<KaraokeTheme>(() => {
    const saved = getCookie('karaoke_theme');
    return (saved as KaraokeTheme) || 'dark';
  });

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);

  // Modal State
  const [modalStep, setModalStep] = useState(0);
  const [selectedLine, setSelectedLine] = useState<any>(null);
  const [selectedVocab, setSelectedVocab] = useState<any>(null);
  const [selectedKanji, setSelectedKanji] = useState<any>(null);

  const setTheme = (t: KaraokeTheme) => {
    setThemeState(t);
    setCookie('karaoke_theme', t);
  };

  const themeStyles: Record<KaraokeTheme, any> = {
    dark: { bg: 'bg-zinc-950', activeText: 'text-white', inactiveText: 'text-zinc-700', subText: 'text-zinc-500', controlBg: 'bg-zinc-900', border: 'border-zinc-800' },
    light: { bg: 'bg-white', activeText: 'text-slate-900', inactiveText: 'text-slate-200', subText: 'text-slate-400', controlBg: 'bg-slate-50', border: 'border-slate-200' },
    pink: { bg: 'bg-[#fff5f7]', activeText: 'text-rose-900', inactiveText: 'text-rose-200', subText: 'text-rose-300', controlBg: 'bg-white', border: 'border-rose-100' },
    blue: { bg: 'bg-[#f0f9ff]', activeText: 'text-sky-900', inactiveText: 'text-sky-200', subText: 'text-sky-300', controlBg: 'bg-white', border: 'border-sky-100' },
  };

  const currentTheme = themeStyles[theme];

  // 1. Cập nhật thời gian & Lấy âm lượng ban đầu
  useEffect(() => {
    let interval: any;
    if (playerRef?.current) {
      // Lấy âm lượng hiện tại từ YouTube Player
      try {
        const currentVol = playerRef.current.getVolume();
        setVolume(currentVol);
        setIsMuted(playerRef.current.isMuted());
      } catch (e) {}

      interval = setInterval(async () => {
        if (!isDragging) {
          try {
            const time = await playerRef.current.getCurrentTime();
            const dur = await playerRef.current.getDuration();
            setCurrentTime(time || 0);
            if (dur && duration === 0) setDuration(dur);
          } catch (e) {}
        }
      }, 500);
    }
    return () => clearInterval(interval);
  }, [playerRef, isDragging, duration]);

  // 2. Cuộn thông minh (Chỉ trong khung Karaoke)
  useEffect(() => {
    const activeEl = lineRefs.current[currentIndex];
    const container = containerRef.current;
    if (activeEl && container) {
      const targetScroll = activeEl.offsetTop - container.offsetTop - (container.clientHeight / 2) + (activeEl.clientHeight / 2);
      container.scrollTo({ top: targetScroll, behavior: 'smooth' });
    }
  }, [currentIndex]);

  // 3. Điều khiển Scrubber
  const handleSeekCommit = () => {
    if (playerRef?.current) playerRef.current.seekTo(currentTime, true);
    setIsDragging(false);
  };

  const handleSkip = async (amount: number) => {
    if (playerRef?.current) {
      const time = await playerRef.current.getCurrentTime();
      playerRef.current.seekTo(time + amount, true);
      setCurrentTime(time + amount);
    }
  };

  // 4. FIX: Logic Điều chỉnh Âm lượng
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setVolume(val);
    if (playerRef?.current) {
      playerRef.current.setVolume(val);
      if (val > 0 && isMuted) {
        playerRef.current.unMute();
        setIsMuted(false);
      }
    }
  };

  const toggleMute = () => {
    if (playerRef?.current) {
      if (isMuted) {
        playerRef.current.unMute();
        setIsMuted(false);
      } else {
        playerRef.current.mute();
        setIsMuted(true);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!script || script.length === 0) return null;

  return (
    <div className={`relative flex flex-col w-full h-[600px] xl:h-[750px] ${currentTheme.bg} rounded-[2.5rem] overflow-hidden shadow-xl border ${currentTheme.border} transition-colors duration-500`}>
      
      {/* NÚT CHỌN THEME */}
      <div className="absolute top-6 right-8 z-20 flex gap-2 bg-white/10 backdrop-blur-md p-1.5 rounded-full border border-white/20 shadow-sm">
        {(['dark', 'light', 'pink', 'blue'] as KaraokeTheme[]).map((t) => (
          <button
            key={t}
            onClick={() => setTheme(t)}
            className={`w-6 h-6 rounded-full border-2 ${theme === t ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'} transition-all`}
            style={{ 
              backgroundColor: t === 'dark' ? '#18181b' : t === 'light' ? '#cbd5e1' : t === 'pink' ? '#fbcfe8' : '#bae6fd' 
            }}
          />
        ))}
      </div>

      {/* LỜI BÀI HÁT */}
      <div ref={containerRef} className="flex-1 overflow-y-auto custom-scrollbar px-6 md:px-24 py-[300px] scroll-smooth no-scrollbar">
        <div className="space-y-12 max-w-4xl mx-auto">
          {script.map((line, index) => {
            const isActive = index === currentIndex;
            return (
              <div
                key={index}
                ref={(el) => { lineRefs.current[index] = el; }}
                onClick={() => index === currentIndex ? (setSelectedLine(line), setModalStep(1)) : onJumpToTime(index)}
                className={`cursor-pointer transition-all duration-700 origin-left ${
                  isActive ? 'opacity-100 scale-105' : `opacity-100 ${currentTheme.inactiveText} scale-100`
                }`}
              >
                <h2 className={`font-black tracking-tight leading-tight transition-colors duration-500 ${isActive ? currentTheme.activeText : ''} text-3xl md:text-5xl mb-3`}>
                  {line.japanese}
                </h2>
                <p className={`font-medium transition-colors duration-500 ${isActive ? 'text-emerald-500' : currentTheme.subText} text-xl md:text-2xl`}>
                  {line.vietnamese}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* THANH ĐIỀU KHIỂN ÂM THANH */}
      <div className={`shrink-0 ${currentTheme.controlBg} border-t ${currentTheme.border} p-4 md:px-8 flex flex-col gap-3 z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]`}>
        {/* Scrubber */}
        <div className={`flex items-center gap-3 text-xs font-bold ${currentTheme.subText} font-mono max-w-5xl mx-auto w-full`}>
          <span>{formatTime(currentTime)}</span>
          <input 
            type="range" min={0} max={duration || 100} value={currentTime}
            onMouseDown={() => setIsDragging(true)}
            onChange={(e) => setCurrentTime(parseFloat(e.target.value))}
            onMouseUp={handleSeekCommit}
            className={`flex-1 h-1.5 rounded-full appearance-none cursor-pointer transition-all ${theme === 'dark' ? 'bg-zinc-700 accent-white' : 'bg-slate-200 accent-slate-600'}`}
          />
          <span>{formatTime(duration)}</span>
        </div>

        <div className="flex justify-between items-center max-w-5xl mx-auto w-full">
          <div className="w-1/4 hidden md:flex items-center gap-2">
             <Badge variant="outline" className={`${currentTheme.border} ${currentTheme.subText} px-3 py-1 rounded-full text-[10px]`}>KARAOKE MODE</Badge>
          </div>

          {/* Nút Playback */}
          <div className="flex justify-center items-center gap-6 flex-1">
            <button onClick={() => handleSkip(-15)} className={`${currentTheme.subText} hover:text-emerald-500 transition-colors`}><RotateCcw className="w-5 h-5" /></button>
            <button onClick={() => onJumpToTime(Math.max(0, currentIndex - 1))} className={currentTheme.subText}><SkipBack className="w-6 h-6 fill-current" /></button>
            <button onClick={onTogglePlay} className={`w-12 h-12 ${theme === 'dark' ? 'bg-white text-black' : 'bg-slate-900 text-white'} rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg`}>
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
            </button>
            <button onClick={() => onJumpToTime(Math.min(script.length - 1, currentIndex + 1))} className={currentTheme.subText}><SkipForward className="w-6 h-6 fill-current" /></button>
            <button onClick={() => handleSkip(15)} className={`${currentTheme.subText} hover:text-emerald-500 transition-colors`}><RotateCw className="w-5 h-5" /></button>
          </div>

          {/* FIX: Thanh Âm Lượng (Volume) */}
          <div className="w-1/4 flex items-center justify-end gap-3">
             <button onClick={toggleMute} className={`${currentTheme.subText} hover:text-emerald-500 transition-colors`}>
               {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
             </button>
             <input 
                type="range" 
                min={0} 
                max={100} 
                value={isMuted ? 0 : volume} 
                onChange={handleVolumeChange}
                className={`w-24 h-1 rounded-full appearance-none cursor-pointer hidden sm:block ${theme === 'dark' ? 'bg-zinc-700 accent-white' : 'bg-slate-200 accent-slate-600'}`} 
             />
          </div>
        </div>
      </div>

      {/* PORTAL MODAL DRILL-DOWN (Fixed Inset) */}
      {modalStep > 0 && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/40 flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300"
            onClick={() => setModalStep(0)}>    
          <div className="w-full max-w-2xl bg-white rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50 shrink-0">
              {modalStep > 1 ? (
                <Button variant="ghost" size="sm" onClick={() => setModalStep(modalStep - 1)} className="text-slate-500 hover:bg-slate-200 rounded-full">
                  <ChevronLeft className="w-4 h-4 mr-1" /> Quay lại
                </Button>
              ) : <div className="w-20" />}
              <Badge className="bg-emerald-100 text-emerald-700 border-none font-bold uppercase px-4 py-1.5 rounded-full text-[10px]">Phân tích chuyên sâu</Badge>
              <button onClick={() => setModalStep(0)} className="w-10 h-10 flex items-center justify-center bg-slate-200 hover:bg-rose-500 hover:text-white rounded-full transition-all shadow-inner"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar p-6 md:p-10 bg-[#fcfcfd]">
              {/* STEP 1: DỊCH NGHĨA */}
              {modalStep === 1 && selectedLine && (
                <div className="animate-in slide-in-from-bottom-4">
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-8 border border-emerald-100 mb-8 shadow-sm">
                    <p className="text-[10px] font-black text-emerald-600 mb-3 uppercase tracking-[0.2em] flex items-center gap-2"><Quote className="w-4 h-4" /> Dịch nghĩa câu</p>
                    <h3 className="text-3xl font-black text-slate-800 mb-4 leading-tight">{selectedLine.japanese}</h3>
                    <p className="text-xl font-medium text-slate-600 italic leading-relaxed">{selectedLine.vietnamese}</p>
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Từ vựng quan trọng</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedLine.vocabulary?.map((v: any, i: number) => (
                      <div key={i} onClick={() => {
                        const enriched = vocabList.find(item => item.word === v.word);
                        setSelectedVocab(enriched ? { ...v, ...enriched } : v);
                        setModalStep(2);
                      }} className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-emerald-400 hover:shadow-lg hover:-translate-y-1 cursor-pointer transition-all">
                        <p className="text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-widest">{v.reading}</p>
                        <p className="text-2xl font-black text-slate-800">{v.word}</p>
                        <p className="text-sm text-slate-500 mt-2 font-medium line-clamp-1 border-t border-slate-50 pt-2">{v.meaning}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 2: CHI TIẾT TỪ VỰNG */}
              {modalStep === 2 && selectedVocab && (
                <div className="animate-in slide-in-from-right-4">
                  <div className="bg-violet-50 rounded-3xl p-8 border border-violet-100 mb-8 shadow-sm">
                    <p className="text-violet-500 font-bold tracking-tighter text-lg mb-1">{selectedVocab.reading}</p>
                    <h3 className="text-6xl font-black text-slate-800 mb-4 tracking-tighter">{selectedVocab.word}</h3>
                    <p className="text-xl font-bold text-slate-700">{selectedVocab.meaning || selectedVocab.meaning_vi}</p>
                  </div>
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><BookOpen className="w-4 h-4"/> Phân tích Hán tự</p>
                    {selectedVocab.kanji_info?.map((kanji: any, i: number) => (
                      <div key={i} onClick={() => { setSelectedKanji(kanji); setModalStep(3); }} className="flex p-5 rounded-2xl border border-slate-100 bg-white hover:border-rose-300 hover:shadow-xl cursor-pointer transition-all items-center gap-6 group">
                        <div className="text-5xl font-black text-rose-500 group-hover:scale-110 transition-transform drop-shadow-sm">{kanji.kanji}</div>
                        <div>
                          <p className="font-black text-2xl text-slate-800 uppercase tracking-tighter">{kanji.mean}</p>
                          <p className="text-sm text-slate-400 mt-1 font-bold">N{kanji.level} • {kanji.stroke_count} nét</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 3: CHI TIẾT KANJI */}
              {modalStep === 3 && selectedKanji && (
                <div className="animate-in slide-in-from-right-4">
                  <div className="flex flex-col md:flex-row gap-8 items-center bg-gradient-to-br from-rose-50 to-orange-50 p-10 rounded-[3rem] border border-rose-100 mb-8 shadow-inner">
                    <div className="text-[120px] md:text-[140px] leading-none font-black text-rose-600 drop-shadow-2xl select-none">{selectedKanji.kanji}</div>
                    <div className="text-center md:text-left">
                      <h2 className="text-4xl md:text-5xl font-black text-slate-800 mb-3 uppercase tracking-tighter">{selectedKanji.mean}</h2>
                      <div className="flex gap-2 justify-center md:justify-start">
                        <Badge className="bg-rose-500 text-white font-bold px-4 py-1.5 rounded-full shadow-md">N{selectedKanji.level}</Badge>
                        <Badge variant="outline" className="bg-white border-rose-200 font-bold px-4 py-1.5 rounded-full shadow-sm">{selectedKanji.stroke_count} nét</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
                      <p className="text-[10px] font-black text-pink-400 uppercase tracking-widest mb-2">Âm Kun (Nhật)</p>
                      <p className="text-2xl font-black text-slate-700">{selectedKanji.kun || '---'}</p>
                    </div>
                    <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
                      <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-2">Âm On (Hán)</p>
                      <p className="text-2xl font-black text-slate-700">{selectedKanji.on || '---'}</p>
                    </div>
                  </div>
                  <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-5">Định nghĩa chi tiết</p>
                    <ul className="space-y-4">
                      {selectedKanji.detail?.split(/[,;]/).map((m: string, i: number) => (
                        <li key={i} className="flex gap-4 text-slate-700 items-start">
                          <span className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-black text-sm shrink-0 mt-0.5 shadow-sm">{i+1}</span>
                          <span className="text-lg font-medium leading-relaxed pt-1.5">{m.trim()}</span>
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