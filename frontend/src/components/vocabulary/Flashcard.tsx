import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Định nghĩa kiểu dữ liệu cho một từ vựng trong Flashcard
export interface FlashcardWord {
  id: string | number;
  word: string;
  reading?: string;
  meaning_vi?: string;
  meaning_en?: string;
  jlpt_level?: string;
  example_sentence?: string;
  example_meaning?: string;
  ease_factor?: number;
  review_interval?: number;
  review_count?: number;
}

// Định nghĩa Props truyền vào component
interface FlashCardProps {
  words: FlashcardWord[];
  onReview: (payload: { id: string | number; data: any }) => void;
}

const jlptColors: Record<string, string> = {
  N5: 'bg-green-500/20 text-green-400',
  N4: 'bg-blue-500/20 text-blue-400',
  N3: 'bg-purple-500/20 text-purple-400',
  N2: 'bg-orange-500/20 text-orange-400',
  N1: 'bg-red-500/20 text-red-400',
  Unknown: 'bg-gray-500/20 text-gray-400',
};

// Hàm tính toán Spaced Repetition
function calculateNextReview(quality: number, easeFactor: number, interval: number) {
  let newEase = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  newEase = Math.max(1.3, newEase);

  let newInterval;
  if (quality < 2) {
    newInterval = 1; // Again
  } else if (quality === 2) {
    newInterval = Math.max(1, Math.round(interval * 1.2)); // Hard
  } else if (quality === 3) {
    newInterval = Math.max(1, Math.round(interval * newEase)); // Good
  } else {
    newInterval = Math.max(1, Math.round(interval * newEase * 1.3)); // Easy
  }

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + newInterval);

  return {
    ease_factor: newEase,
    review_interval: newInterval,
    next_review_date: nextDate.toISOString().split('T')[0],
    review_count: 1
  };
}

export default function FlashCard({ words, onReview }: FlashCardProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const word = words[currentIdx];
  if (!word) return null;

  const handleReview = (quality: number) => {
    const result = calculateNextReview(quality, word.ease_factor || 2.5, word.review_interval || 1);
    onReview({ id: word.id, data: { ...result, review_count: (word.review_count || 0) + 1 } });

    setFlipped(false);
    if (currentIdx < words.length - 1) {
      setCurrentIdx(currentIdx + 1);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="text-center mb-6">
        <span className="text-sm text-gray-500">{currentIdx + 1} / {words.length}</span>
      </div>

      <div
        className="relative cursor-pointer mb-8"
        onClick={() => setFlipped(!flipped)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={flipped ? 'back' : 'front'}
            initial={{ rotateY: 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: -90, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="min-h-70 rounded-3xl border border-[#1e1e3a] bg-[#12122a] flex flex-col items-center justify-center p-8"
          >
            {!flipped ? (
              <>
                <p className="text-5xl font-bold text-white mb-4">{word.word}</p>
                {word.reading && <p className="text-xl text-[#ff6b9d]">{word.reading}</p>}
                {word.jlpt_level && (
                  <Badge className={`mt-4 ${jlptColors[word.jlpt_level] || jlptColors.Unknown} border-0`}>
                    {word.jlpt_level}
                  </Badge>
                )}
                <p className="text-sm text-gray-600 mt-6">Nhấn để xem nghĩa</p>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-white mb-2">{word.word}</p>
                <p className="text-lg text-[#ff6b9d] mb-4">{word.reading}</p>
                <div className="w-12 h-px bg-[#1e1e3a] mb-4" />
                <p className="text-xl text-gray-200 mb-2">{word.meaning_vi}</p>
                <p className="text-gray-400 text-center">{word.meaning_en}</p>
                {word.example_sentence && (
                  <div className="mt-6 text-center">
                    <p className="text-sm text-white">{word.example_sentence}</p>
                    <p className="text-xs text-gray-500 mt-1">{word.example_meaning}</p>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {flipped && (
        <div className="grid grid-cols-4 gap-3">
          <Button onClick={() => handleReview(1)} className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 h-auto py-2">
            <div className="text-center">
              <div className="font-semibold">Again</div>
              <div className="text-xs opacity-70">1 ngày</div>
            </div>
          </Button>
          <Button onClick={() => handleReview(2)} className="bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border border-orange-500/30 h-auto py-2">
            <div className="text-center">
              <div className="font-semibold">Hard</div>
              <div className="text-xs opacity-70">{Math.round((word.review_interval || 1) * 1.2)}d</div>
            </div>
          </Button>
          <Button onClick={() => handleReview(3)} className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30 h-auto py-2">
            <div className="text-center">
              <div className="font-semibold">Good</div>
              <div className="text-xs opacity-70">{Math.round((word.review_interval || 1) * (word.ease_factor || 2.5))}d</div>
            </div>
          </Button>
          <Button onClick={() => handleReview(4)} className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30 h-auto py-2">
            <div className="text-center">
              <div className="font-semibold">Easy</div>
              <div className="text-xs opacity-70">{Math.round((word.review_interval || 1) * (word.ease_factor || 2.5) * 1.3)}d</div>
            </div>
          </Button>
        </div>
      )}

      <div className="flex items-center justify-center gap-4 mt-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => { setCurrentIdx(Math.max(0, currentIdx - 1)); setFlipped(false); }}
          disabled={currentIdx === 0}
          className="text-gray-400 hover:text-white"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => { setCurrentIdx(Math.min(words.length - 1, currentIdx + 1)); setFlipped(false); }}
          disabled={currentIdx === words.length - 1}
          className="text-gray-400 hover:text-white"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}