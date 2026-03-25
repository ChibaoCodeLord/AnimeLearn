import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Play, Upload, ArrowRight } from 'lucide-react';

export default function CompactBanner() {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e : any) => {
    e.preventDefault();
    if (youtubeUrl.trim()) {
      navigate(`/VideoWorkspace?url=${encodeURIComponent(youtubeUrl.trim())}`);
    }
  };

  return (
    <section className="relative py-12 px-4 bg-gradient-to-r from-emerald-500 to-teal-600">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utb3BhY2l0eT0iLjA1IiBzdHJva2Utd2lkdGg9IjIiLz48L2c+PC9zdmc+')] opacity-20"></div>
      
      <div className="relative max-w-5xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Học tiếng Nhật qua Anime
          </h1>
          <p className="text-emerald-50 text-sm md:text-base">
            Dán link YouTube hoặc tải video lên - AI tạo script, dịch và phân tích ngay
          </p>
        </div>

        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-3 p-2 rounded-2xl bg-white shadow-xl">
            <div className="flex-1 relative">
              <Play className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
              <Input
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="Dán link YouTube anime tại đây..."
                className="pl-12 h-12 bg-transparent border-0 text-slate-900 placeholder:text-slate-400 focus-visible:ring-0"
              />
            </div>
            <Button 
              type="button"
              variant="outline"
              className="h-12 px-6 bg-white hover:bg-emerald-50 border-emerald-200 text-emerald-700 gap-2"
            >
              <Upload className="w-4 h-4" />
              Tải lên
            </Button>
            <Button 
              type="submit" 
              className="h-12 px-8 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold gap-2"
            >
              Bắt đầu
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </form>

        <div className="flex flex-wrap items-center justify-center gap-6 mt-6 text-sm text-emerald-50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-200" />
            Script AI tự động
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-200" />
            Phụ đề song ngữ
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-200" />
            Tra từ thông minh
          </div>
        </div>
      </div>
    </section>
  );
}