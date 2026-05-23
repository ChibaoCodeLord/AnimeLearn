import { useState } from 'react';
import { useHomeData } from '../hooks/useHomeData';
import CompactBanner from '../components/home/CompactBanner';
import VideosByLevel from '../components/home/VideosByLevel';

export default function Home() {
  const { data: videos = [], isLoading, error } = useHomeData();
  
  // State lưu trữ tổng số video thật để truyền vào Banner
  const [totalVideos, setTotalVideos] = useState<number>(0);

  return (
    <div className="bg-slate-50 min-h-screen pb-12">
      {/* Truyền số thật vào Banner */}
      <CompactBanner totalVideos={totalVideos} />
      
      {/* Truyền hàm setTotalVideos xuống để VideosByLevel gọi khi load xong data */}
      <VideosByLevel 
        initialVideos={videos} 
        isInitialLoading={isLoading} 
        onTotalUpdate={setTotalVideos} 
      />
      
      {error && (
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 mt-4">
          <p className="text-rose-500 bg-rose-50 p-4 rounded-xl border border-rose-200">
            Đã có lỗi xảy ra khi tải danh sách video. Vui lòng thử lại sau.
          </p>
        </div>
      )}
    </div>
  );
}