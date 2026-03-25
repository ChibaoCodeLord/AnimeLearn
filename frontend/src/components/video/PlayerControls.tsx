import { Button } from '@/components/ui/button';
import { Repeat, Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Định nghĩa Interface để dọn sạch lỗi 7031 (implicitly has an 'any' type)
export interface PlayerControlsProps {
  isPlaying: boolean;
  isLooping: boolean;
  loopCount: number;
  onTogglePlay: () => void;
  onToggleLoop: () => void;
  onPrevLine: () => void;
  onNextLine: () => void;
}

export default function PlayerControls({ 
  isPlaying, 
  isLooping, 
  loopCount, 
  onTogglePlay, 
  onToggleLoop, 
  onPrevLine, 
  onNextLine 
}: PlayerControlsProps) { // <--- Gắn interface vào đây
  
  return (
    <div className="flex items-center justify-center gap-2 py-3 px-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={onPrevLine}
        className="text-gray-400 hover:text-white hover:bg-[#1e1e3a]"
      >
        <SkipBack className="w-4 h-4" />
      </Button>

      <Button
        onClick={onTogglePlay}
        // Đã sửa bg-gradient-to-r thành bg-linear-to-r
        className="w-12 h-12 rounded-full bg-linear-to-r from-[#ff6b9d] to-[#c084fc] hover:opacity-90 text-white"
      >
        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={onNextLine}
        className="text-gray-400 hover:text-white hover:bg-[#1e1e3a]"
      >
        <SkipForward className="w-4 h-4" />
      </Button>

      <div className="w-px h-6 bg-[#1e1e3a] mx-2" />

      <Button
        variant="ghost"
        onClick={onToggleLoop}
        className={`gap-2 ${isLooping ? 'text-[#ff6b9d] bg-[#ff6b9d]/10' : 'text-gray-400 hover:text-white hover:bg-[#1e1e3a]'}`}
      >
        <Repeat className="w-4 h-4" />
        {isLooping && (
          <Badge className="bg-[#ff6b9d]/20 text-[#ff6b9d] border-0 text-xs px-1.5">
            {loopCount}x
          </Badge>
        )}
      </Button>
    </div>
  );
}