import { useQuery } from '@tanstack/react-query';
import CompactBanner from '../components/home/CompactBanner';
import VideosByLevel from '../components/home/VideosByLevel';

// 1. Định nghĩa kiểu dữ liệu cho Video
// (Trùng khớp với VideoItem trong file VideosByLevel.tsx để tránh lỗi type)
export interface VideoItem {
  id: string | number;
  thumbnail_url?: string;
  title: string;
  jlpt_level?: string;
  views_count?: number;
  likes_count?: number;
  created_date: string | Date;
}

// 2. MOCK DATA: Giả lập danh sách video cộng đồng
const mockVideos: VideoItem[] = [
  { id: 'v1', title: 'Học tiếng Nhật cơ bản cùng Frieren (Tập 1)', thumbnail_url: '', jlpt_level: 'N5', views_count: 1250, likes_count: 340, created_date: '2026-03-12T10:00:00Z' },
  { id: 'v2', title: '100 Câu giao tiếp thường gặp', thumbnail_url: '', jlpt_level: 'N5', views_count: 3200, likes_count: 890, created_date: '2026-03-05T08:00:00Z' },
  { id: 'v3', title: 'Từ vựng N4 - Jujutsu Kaisen', thumbnail_url: '', jlpt_level: 'N4', views_count: 850, likes_count: 210, created_date: '2026-03-11T15:30:00Z' },
  { id: 'v4', title: 'Luyện nghe N3 với Anime Đời thường', thumbnail_url: '', jlpt_level: 'N3', views_count: 1500, likes_count: 420, created_date: '2026-03-10T09:15:00Z' },
  { id: 'v5', title: 'Phân tích Ngữ pháp N2 - Attack on Titan', thumbnail_url: '', jlpt_level: 'N2', views_count: 450, likes_count: 120, created_date: '2026-03-13T20:00:00Z' },
  { id: 'v6', title: 'Bóng tối của N1 - Death Note', thumbnail_url: '', jlpt_level: 'N1', views_count: 600, likes_count: 150, created_date: '2026-03-14T09:00:00Z' },
  { id: 'v7', title: 'Hội thoại công sở Nhật Bản', thumbnail_url: '', jlpt_level: 'Mixed', views_count: 2100, likes_count: 500, created_date: '2026-03-01T12:00:00Z' },
];

// 3. Hàm giả lập API
const mockApi = {
  getCommunityVideos: async (): Promise<VideoItem[]> => {
    // Tạo độ trễ 800ms để xem hiệu ứng loading
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(mockVideos);
      }, 800);
    });
  }
};

export default function Home() {
  // Thay thế base44 bằng mockApi
  const { data: videos = [], isLoading } = useQuery<VideoItem[]>({
    queryKey: ['community-videos'],
    queryFn: mockApi.getCommunityVideos,
    initialData: [],
  });

  return (
    <div>
      <CompactBanner />
      <VideosByLevel videos={videos} isLoading={isLoading} />
    </div>
  );
}