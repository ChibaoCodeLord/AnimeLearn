import { Sparkles, Play, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HeroSection() {
  return (
    <div className="relative overflow-hidden bg-[#0a0a1a] py-16 lg:py-24">
      {/* Background Glow - Sử dụng w-150 và h-150 thay cho [600px] */}
      <div className="absolute -top-24 -right-24 w-150 h-150 bg-[#ff6b9d]/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -left-24 w-150 h-150 bg-[#c084fc]/10 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Content */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff6b9d]/10 border border-[#ff6b9d]/20 mb-6">
              <Sparkles className="w-4 h-4 text-[#ff6b9d]" />
              <span className="text-xs font-bold text-[#ff6b9d] uppercase tracking-wider">AI-Powered Learning</span>
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-extrabold text-white mb-6 leading-tight">
              Học tiếng Nhật qua <br />
              <span className="bg-linear-to-r from-[#ff6b9d] to-[#c084fc] bg-clip-text text-transparent">
                Anime yêu thích
              </span>
            </h1>
            
            <p className="text-lg text-gray-400 mb-8 max-w-xl mx-auto lg:mx-0">
              Biến những bộ phim Anime thành bài học tương tác. Tạo script tự động, tra từ vựng thông minh và luyện tập với AI Tutor.
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
              <Button size="lg" className="bg-linear-to-r from-[#ff6b9d] to-[#c084fc] text-white gap-2 h-12 px-8 rounded-xl hover:opacity-90">
                <Play className="w-4 h-4 fill-current" />
                Bắt đầu học ngay
              </Button>
              <Button size="lg" variant="ghost" className="text-white hover:bg-white/5 gap-2 h-12 px-8 rounded-xl border border-white/10">
                Khám phá video
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Visual Element (Mockup/Image) */}
          <div className="flex-1 w-full max-w-lg lg:max-w-none">
            <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/10 bg-[#12122a] shadow-2xl">
              <div className="absolute inset-0 bg-linear-to-tr from-[#ff6b9d]/20 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <Play className="w-6 h-6 text-white fill-current ml-1" />
                </div>
              </div>
              {/* Giả lập giao diện player */}
              <div className="absolute bottom-6 left-6 right-6 h-1 bg-white/20 rounded-full overflow-hidden">
                <div className="w-1/3 h-full bg-[#ff6b9d]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}