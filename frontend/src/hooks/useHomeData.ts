import { useQuery } from '@tanstack/react-query';
import { homeApi } from '@/api/home.api';

export interface VideoItem {
  id: string | number;
  thumbnail_url?: string;
  title: string;
  jlpt_level?: string;
  views_count?: number;
  likes_count?: number;
  created_date: string | Date;
}

const fetchVideos = async (): Promise<VideoItem[]> => {
  return homeApi.getHomeVideos<VideoItem[]>();
};

export const useHomeData = () => {
  return useQuery<VideoItem[]>({
    queryKey: ['community-videos'],
    queryFn: fetchVideos,
    staleTime: 5 * 60 * 1000, // 5 phút
  });
};
