import { useRef, useEffect, useState } from 'react';
import { Clock, X, Volume2, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import VocabularyAnalysis from './VocabularyAnalysis';

// 1. Định nghĩa cấu trúc của một dòng phụ đề
export interface ScriptLine {
  timestamp: string;
  japanese: string;
  vietnamese: string;
  english?: string;
  vocabulary?: any[]; 
}

// 2. Định nghĩa Props của component
interface ScriptPanelProps {
  script: ScriptLine[];
  currentIndex: number;
  onLineClick: (index: number) => void;
  onWordSelect: (word: string, position: { x: number; y: number }) => void;
  showVocabList?: boolean; // Tùy chọn ẩn/hiện danh sách từ vựng
}

export default function ScriptPanel({ 
  script, 
  currentIndex, 
  onLineClick, 
  onWordSelect,
  showVocabList = true // Mặc định là hiện
}: ScriptPanelProps) {
  
  const activeRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // STATE QUẢN LÝ MODAL TỪ VỰNG Ở GIỮA MÀN HÌNH
  const [centeredVocab, setCenteredVocab] = useState<any | null>(null);

  // HIỆU ỨNG CUỘN ĐỈNH NHẤT QUÁN
  useEffect(() => {
    if (activeRef.current && containerRef.current) {
      const container = containerRef.current;
      const element = activeRef.current;

      // Lấy chính xác vị trí đỉnh của thẻ, trừ đi 16px (bằng đúng padding-top của container) 
      const scrollToPosition = element.offsetTop - 16;

      container.scrollTo({
        top: scrollToPosition,
        behavior: 'smooth'
      });
    }
  }, [currentIndex]);

  const handleWordClick = (e: React.MouseEvent<HTMLSpanElement>, word: string) => {
    e.stopPropagation();
    const target = e.target as HTMLSpanElement; 
    const rect = target.getBoundingClientRect();
    onWordSelect(word, { x: rect.left, y: rect.bottom });
  };

  const renderJapaneseText = (text: string) => {
    try {
      const segmenter = new Intl.Segmenter('ja', { granularity: 'word' });
      const segments = Array.from(segmenter.segment(text));
      return segments.map((seg, i) => {
        if (seg.segment.trim() === '') return <span key={i}>{seg.segment}</span>;
        return (
          <span
            key={i}
            className="cursor-pointer hover:bg-[#ff6b9d]/20 hover:text-[#ff6b9d] rounded px-0.5 transition-colors"
            onClick={(e) => handleWordClick(e, seg.segment)}
          >
            {seg.segment}
          </span>
        );
      });
    } catch (e) {
      const segments = text.split(/(\s+)/);
      return segments.map((segment, i) => {
        if (segment.trim() === '') return <span key={i}>{segment}</span>;
        return (
          <span
            key={i}
            className="cursor-pointer hover:bg-[#ff6b9d]/20 hover:text-[#ff6b9d] rounded px-0.5 transition-colors"
            onClick={(e) => handleWordClick(e, segment)}
          >
            {segment}
          </span>
        );
      });
    }
  };

  // Hàm phát âm Audio cho Modal trung tâm
  const playAudio = (word: string) => {
    if (!word) return;
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  // Logic bóc tách Hán Việt cho Modal trung tâm
  let hanViet = '';
  let meaningLines: string[] = [];
  if (centeredVocab?.meaning) {
    const lines = centeredVocab.meaning.split('\n').map((l: string) => l.trim()).filter(Boolean);
    if (lines.length > 0 && lines[0] === lines[0].toUpperCase() && !lines[0].match(/^[0-9]/)) {
      hanViet = lines[0];
      meaningLines = lines.slice(1);
    } else {
      meaningLines = lines;
    }
  }

  if (!script || script.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400">
        <p>Chưa có kịch bản. Nhấn "Tạo Script AI" để bắt đầu.</p>
      </div>
    );
  }

  return (
    <>
      <div ref={containerRef} className="h-full overflow-y-auto custom-scrollbar relative">
        <div className="space-y-1 p-4">
          {script.map((line, index) => (
            <div
              key={index}
              ref={index === currentIndex ? activeRef : null}
              onClick={() => onLineClick(index)}
              className={`p-3 rounded-xl cursor-pointer transition-all ${
                index === currentIndex
                  ? 'bg-linear-to-r from-[#ff6b9d]/10 to-[#c084fc]/10 border border-[#ff6b9d]/30'
                  : 'hover:bg-slate-50 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <span className="text-xs text-slate-500 font-mono">{line.timestamp}</span>
              </div>
              <p className="text-slate-800 font-medium text-base leading-relaxed">
                {renderJapaneseText(line.japanese)}
              </p>
              <p className="text-slate-600 font-medium text-sm mt-1">{line.vietnamese}</p>
              {line.english && (
                <p className="text-slate-400 text-xs mt-0.5">{line.english}</p>
              )}
              
              {/* Chỉ hiện danh sách từ vựng khi showVocabList = true */}
              {showVocabList && line.vocabulary && line.vocabulary.length > 0 && (
                <div onClick={(e) => e.stopPropagation()}>
                  <VocabularyAnalysis 
                    vocabulary={line.vocabulary} 
                    onWordClick={(vocabData: any) => setCenteredVocab(vocabData)} 
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL TỪ VỰNG TRUNG TÂM (TO & RÕ RÀNG) */}
      {/* ======================================================== */}
      {centeredVocab && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm transition-all"
          onClick={() => setCenteredVocab(null)}
        >
          <div 
            className="w-full max-w-lg bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-pink-100"
            onClick={(e) => e.stopPropagation()} // Ngăn click xuyên qua modal
          >
            {/* Nút tắt */}
            <button 
              onClick={() => setCenteredVocab(null)} 
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-pink-500 hover:bg-pink-50 rounded-full transition-all z-10"
            >
              <X className="w-6 h-6" />
            </button>

            {/* HEADER */}
            <div className="p-8 bg-[#fbf3f8] relative shrink-0 border-b border-pink-100/60">
              <div className="flex flex-col mb-2 pr-8">
                <div className="flex items-center gap-3 mb-2">
                  <p className="text-pink-500 font-bold text-lg tracking-widest">{centeredVocab.reading || '???'}</p>
                  <button 
                    onClick={() => playAudio(centeredVocab.word)} 
                    className="text-violet-400 hover:text-violet-600 hover:bg-violet-100 p-1.5 rounded-full transition-all active:scale-95"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>
                <h3 className="text-6xl font-black text-slate-800 tracking-tight drop-shadow-sm mb-2">{centeredVocab.word}</h3>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                {hanViet && (
                  <Badge className="bg-pink-100 hover:bg-pink-200 text-pink-700 border-none font-bold text-sm tracking-widest px-3 py-1 shadow-xs">
                    {hanViet}
                  </Badge>
                )}
                {centeredVocab.pos && (
                  <Badge variant="outline" className="bg-white text-violet-600 border-violet-200 text-sm px-3 py-1 font-medium">
                    {centeredVocab.pos}
                  </Badge>
                )}
              </div>
            </div>

            {/* BODY (ĐỊNH NGHĨA) */}
            <div className="p-8 bg-[#fffbfd] max-h-[50vh] overflow-y-auto custom-scrollbar">
              {meaningLines.length > 0 ? (
                <ul className="space-y-4">
                  {meaningLines.map((line, idx) => {
                    const match = line.match(/^([0-9]+\.)(.*)/);
                    if (match) {
                      return (
                        <li key={idx} className="text-slate-700 text-lg leading-relaxed flex gap-3">
                          <span className="font-black text-pink-400 shrink-0 select-none">{match[1]}</span>
                          <span className="font-medium">{match[2]}</span>
                        </li>
                      );
                    }
                    return (
                      <li key={idx} className="text-slate-700 text-lg leading-relaxed relative pl-5 before:absolute before:left-0 before:top-2.5 before:w-2 before:h-2 before:bg-violet-300 before:rounded-full font-medium">
                        {line}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 text-slate-400 py-6 italic">
                  <Sparkles className="w-8 h-8 text-pink-300" />
                  <span className="text-base">Chưa có định nghĩa chi tiết cho từ này.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}