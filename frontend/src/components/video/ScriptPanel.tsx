import { useRef, useEffect } from 'react';
import { Clock } from 'lucide-react';
import VocabularyAnalysis from './VocabularyAnalysis';

// 1. Định nghĩa cấu trúc của một dòng phụ đề
export interface ScriptLine {
  timestamp: string;
  japanese: string;
  vietnamese: string;
  english?: string;
  vocabulary?: any[]; // Nếu bạn có type riêng cho Vocabulary thì thay 'any' nhé
}

// 2. Định nghĩa Props của component
interface ScriptPanelProps {
  script: ScriptLine[];
  currentIndex: number;
  onLineClick: (index: number) => void;
  onWordSelect: (word: string, position: { x: number; y: number }) => void;
}

export default function ScriptPanel({ 
  script, 
  currentIndex, 
  onLineClick, 
  onWordSelect 
}: ScriptPanelProps) {
  
  // 3. Thêm <HTMLDivElement> để TypeScript hiểu đây là Ref trỏ vào thẻ div
  const activeRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeRef.current && containerRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentIndex]);

  // 4. Thêm type React.MouseEvent cho event click
  const handleWordClick = (e: React.MouseEvent<HTMLSpanElement>, word: string) => {
    e.stopPropagation();
    const target = e.target as HTMLSpanElement; // Ép kiểu an toàn để lấy getBoundingClientRect
    const rect = target.getBoundingClientRect();
    onWordSelect(word, { x: rect.left, y: rect.bottom });
  };

  // 5. Đã xóa tham số 'lineIndex' thừa
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

  if (!script || script.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <p>Chưa có script. Nhấn "Tạo Script" để bắt đầu.</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full overflow-y-auto custom-scrollbar">
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
            
            {/* Vocabulary Analysis */}
            {line.vocabulary && line.vocabulary.length > 0 && (
              <VocabularyAnalysis vocabulary={line.vocabulary} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}