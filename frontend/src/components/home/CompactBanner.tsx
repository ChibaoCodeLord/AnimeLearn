import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Play, Upload, ArrowRight, Sparkles, Search, FileText, Youtube } from 'lucide-react';

export default function CompactBanner() {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (youtubeUrl.trim()) {
      navigate(`/VideoWorkspace?url=${encodeURIComponent(youtubeUrl.trim())}`);
    }
  };

  return (
    <section className="relative py-8 md:py-10 px-4 overflow-hidden bg-slate-50">
      {/* Đã thu nhỏ vệt sáng nền để phù hợp với chiều dọc mới */}
      <div className="absolute w-full h-100 bg-emerald-400/30  blur-[80px] pointer-events-none" />

      <div className="relative max-w-5xl mx-auto flex flex-col items-center">
        
        {/* Phần Header: Ép margin (mb) nhỏ lại */}
        <div className="text-center mb-6 md:mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight mb-3 md:mb-4">
            Học tiếng Nhật qua <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">Anime</span>
          </h1>
          <p className="text-slate-500 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Dán link YouTube hoặc tải video lên. Hệ thống AI sẽ tự động bóc băng, dịch thuật và phân tích từ vựng ngay lập tức.
          </p>
        </div>

        {/* Phần Form (Command Bar) */}
        <form onSubmit={handleSubmit} className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150">
          <div className="relative flex flex-col sm:flex-row items-center gap-2 p-2 bg-white border border-slate-200/80 rounded-2xl sm:rounded-full shadow-sm hover:shadow-md focus-within:border-emerald-300 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all duration-300">
            
            <div className="flex-1 flex items-center w-full pl-4 relative">
              <Youtube className="w-5 h-5 text-slate-400 shrink-0" />
              <Input
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="Dán link YouTube anime tại đây..."
                className="h-12 md:h-14 border-0 shadow-none focus-visible:ring-0 text-base bg-transparent text-slate-900 placeholder:text-slate-400 truncate"
              />
            </div>
            
            <div className="flex w-full sm:w-auto gap-2 sm:pr-1">
              <Button 
                type="button"
                variant="ghost"
                className="flex-1 sm:flex-none h-10 md:h-12 px-4 md:px-5 rounded-xl sm:rounded-full text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 font-medium transition-colors"
              >
                <Upload className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Tải lên</span>
              </Button>
              <Button 
                type="submit" 
                className="flex-1 sm:flex-none h-10 md:h-12 px-6 md:px-8 rounded-xl sm:rounded-full bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-sm transition-all"
              >
                Bắt đầu
                <ArrowRight className="w-4 h-4 ml-1 md:ml-2" />
              </Button>
            </div>
          </div>
        </form>

        {/* Phần Features Tags: Kéo sát lên form hơn (mt-12 -> mt-8) */}
        <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 mt-8 animate-in fade-in duration-700 delay-300">
          <div className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-white border border-slate-100 shadow-sm text-xs md:text-sm text-slate-600 font-medium">
            <FileText className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-500" />
            Script AI tự động
          </div>
          <div className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-white border border-slate-100 shadow-sm text-xs md:text-sm text-slate-600 font-medium">
            <Play className="w-3.5 h-3.5 md:w-4 md:h-4 text-teal-500" />
            Phụ đề song ngữ
          </div>
          <div className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-white border border-slate-100 shadow-sm text-xs md:text-sm text-slate-600 font-medium">
            <Search className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-500" />
            Tra từ thông minh
          </div>
        </div>

      </div>
    </section>
  );
}