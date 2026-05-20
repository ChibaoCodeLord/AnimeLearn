import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Upload, ArrowRight, Youtube, PlayCircle, BookOpen, TrendingUp } from 'lucide-react';
import animeLogo from '@/assets/demon_slayer.gif';

interface CompactBannerProps {
  totalVideos?: number;
  totalVocab?: string;
  userProgress?: string;
}

export default function CompactBanner({ 
  totalVideos = 0, 
  totalVocab = '45.2K', 
  userProgress = '12 bài' 
}: CompactBannerProps) {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (youtubeUrl.trim()) {
      navigate(`/VideoWorkspace?url=${encodeURIComponent(youtubeUrl.trim())}`);
    }
  };

  return (
  <section className="w-full pt-6 px-4 md:px-6 animate-in fade-in slide-in-from-top-4 duration-700">
    <div className="w-full max-w-[1600px] mx-auto">
      <div className="
        relative w-full
        bg-gradient-to-r from-teal-500 via-emerald-400 to-sky-400
        rounded-3xl p-5 md:p-7 lg:p-8
        shadow-lg overflow-hidden
        grid grid-cols-1
        lg:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.85fr)]
        xl:grid-cols-[minmax(0,1.55fr)_minmax(400px,0.9fr)]
        2xl:grid-cols-[minmax(0,1.2fr)_minmax(460px,1fr)]
        items-stretch gap-5 md:gap-6
        transition-all duration-300
      ">
        <div
          className="absolute inset-0 bg-white/10"
          style={{
            backgroundImage:
              'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.2) 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Left: Text & Stats */}
        <div className="relative z-10 min-w-0 w-full text-white flex flex-col justify-center transition-all duration-300">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight mb-3 drop-shadow-sm">
            Luyện Shadowing qua{' '}
            <span
              className="
                relative inline-block overflow-hidden
                py-2 px-2 rounded-2xl
                align-middle
                shadow-lg
                border-2 border-white/70
                
              "
              style={{
                backgroundImage: `url(${animeLogo})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center ',
              }}
            >
              <span className="absolute inset-0 bg-linear-to-r from-black/55 via-black/30 to-black/10" />
              <span className="absolute inset-0 ring-1 ring-white/30 rounded-2xl" />

              <span className="relative z-10 inline-block -translate-y-1.5 leading-none font-black">
                <span
                  className="absolute inset-0 text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-sky-300 animate-gradient-x"
                  style={{
                    WebkitTextStroke: '3px white',
                  }}
                >
                  Anime
                </span>

                <span className="relative text-emerald-400 drop-shadow-md">
                  Anime
                </span>
              </span>
            </span>
          </h1>

          <p className="text-teal-50 text-sm md:text-base mb-5 leading-relaxed max-w-3xl">
            Chọn video theo trình độ JLPT, luyện nghe, từ vựng và shadowing một cách có hệ thống.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-[140px] flex items-center gap-2 bg-black/10 backdrop-blur-sm px-4 py-2 rounded-2xl border border-white/20">
              <PlayCircle className="w-5 h-5 text-teal-100 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-teal-100 font-medium">Tổng video</p>
                <p className="text-base font-bold truncate">
                  {totalVideos > 0 ? totalVideos.toLocaleString() : '...'}
                </p>
              </div>
            </div>

            <div className="min-w-[150px] flex items-center gap-2 bg-black/10 backdrop-blur-sm px-4 py-2 rounded-2xl border border-white/20">
              <BookOpen className="w-5 h-5 text-teal-100 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-teal-100 font-medium">Từ vựng & Kanji</p>
                <p className="text-base font-bold truncate">{totalVocab}</p>
              </div>
            </div>

            <div className="min-w-[130px] hidden sm:flex items-center gap-2 bg-black/10 backdrop-blur-sm px-4 py-2 rounded-2xl border border-white/20">
              <TrendingUp className="w-5 h-5 text-teal-100 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-teal-100 font-medium">Tiến độ</p>
                <p className="text-base font-bold truncate">{userProgress}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Create Lesson Form */}
        <div className="relative z-10 min-w-0 w-full transition-all duration-300">
          <div className="h-full w-full bg-white/95 backdrop-blur-md p-4 md:p-5 rounded-3xl shadow-xl border border-white/40 flex flex-col justify-center">
            <div className="mb-4">
              <h3 className="text-slate-800 font-bold">Tạo bài học mới</h3>
              <p className="text-slate-500 text-xs truncate">
                Dán link YouTube để AI bóc băng tự động
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="relative flex items-center w-full min-w-0">
                <Youtube className="absolute left-3 w-5 h-5 text-rose-500 shrink-0" />
                <Input
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://youtube.com/..."
                  className="
                    pl-10 h-12 w-full min-w-0
                    bg-slate-50 border-slate-200
                    focus-visible:ring-teal-500
                    text-slate-900 rounded-xl
                  "
                />
              </div>

              <div className="flex gap-2 w-full min-w-0">
                <Button
                  type="button"
                  variant="outline"
                  className="
                    flex-1 min-w-0 h-11 rounded-xl
                    text-slate-600 border-slate-200
                    hover:bg-slate-50 hover:text-teal-600 px-2
                  "
                >
                  <Upload className="w-4 h-4 sm:mr-2 shrink-0" />
                  <span className="hidden sm:inline truncate">Tải File</span>
                </Button>

                <Button
                  type="submit"
                  className="
                    flex-[1.4] min-w-0 h-11 rounded-xl
                    bg-teal-500 hover:bg-teal-600
                    text-white font-semibold shadow-sm
                    transition-colors px-2
                  "
                >
                  <span className="truncate">Bắt đầu</span>
                  <ArrowRight className="w-4 h-4 ml-1 shrink-0" />
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </section>
);
}