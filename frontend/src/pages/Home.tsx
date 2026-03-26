import { useHomeData } from '../hooks/useHomeData';
import CompactBanner from '../components/home/CompactBanner';
import VideosByLevel from '../components/home/VideosByLevel';

export default function Home() {
  const { data: videos = [], isLoading, error } = useHomeData();

  return (
    <div>
      <CompactBanner />
      <VideosByLevel videos={videos} isLoading={isLoading} />
      {error && <p className="text-red-500">Error loading videos</p>}
    </div>
  );
}