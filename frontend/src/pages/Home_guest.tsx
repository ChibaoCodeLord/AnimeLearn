'use client'

import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import moment from 'moment'
import { FaBook, FaCheckCircle, FaGamepad } from 'react-icons/fa'

// Interfaces
interface VideoItem {
  id: string;
  title: string;
  created_date: string;
  jlpt_level?: string;
  youtube_id?: string;
}

// Mock Data
const mockVideos: VideoItem[] = [
  { id: 'vid1', title: 'My Hero Academia Final Season Opening Cover', created_date: '2026-03-13T10:00:00Z', jlpt_level: 'N3', youtube_id: 'Y0MZQMQrOLU' },
  { id: 'vid2', title: '呪術廻戦 懐玉・玉折(過去編) [青のすみか/キタニタツヤ]', created_date: '2026-03-12T15:30:00Z', jlpt_level: 'N4', youtube_id: 'ED1zGslwM8o' },
  { id: 'vid3', title: 'Attack on Titan - Advanced Grammar & Expressions N2', created_date: '2026-03-11T09:00:00Z', jlpt_level: 'N2', youtube_id: 'd6qCbdXqsOs' },
];

// Mock API
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const mockApi = {
  getVideos: async () => { await delay(800); return mockVideos; },
};
function Header() {
  const navigate = useNavigate()
  
  return (
    <header className="border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="font-bold text-lg">AnimeLearn</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#" className="text-sm text-gray-700 hover:text-gray-900">
              Courses
            </a>
            <a href="#" className="text-sm text-gray-700 hover:text-gray-900">
              Pricing
            </a>
            <a href="#" className="text-sm text-gray-700 hover:text-gray-900">
              About
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="ghost" className="text-sm" onClick={() => navigate('/login')}>
              Login
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm" onClick={() => navigate('/signup')}>
              Sign Up
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

// Hero Component
function Hero() {
  const navigate = useNavigate()
  
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-2 mb-6 bg-emerald-50 rounded-full px-4 py-2">
            <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
            <span className="text-xs font-semibold text-emerald-600 uppercase">
              The Future of Fluency
            </span>
          </div>

          <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-6">
            Master Japanese
            <br />
            Through Your
            <br />
            <span className="text-emerald-600">Favorite Anime</span>
          </h1>

          <p className="text-lg text-gray-600 mb-8 leading-relaxed">
            Join 50,000+ learners who turned their passion into fluency with our immersive video-based curriculum.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-base px-8 py-6" onClick={() => navigate('/signup')}>
              Start Free Lesson
            </Button>
            <Button 
              variant="outline"
              className="text-base px-8 py-6 border-gray-300 hover:bg-gray-50"
              onClick={() => navigate('/login')}
            >
              Browse Library
            </Button>
          </div>
        </div>

        <div className="relative">
          <div className="bg-gray-900 rounded-lg overflow-hidden shadow-2xl">
            <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 relative">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/XMeQeIG_rQg"
                title="Anime Lessons"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0"
              ></iframe>

              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-gray-900/98 to-transparent backdrop-blur p-6 z-10">
                <div className="flex items-center gap-4">
                  <button className="flex-shrink-0 w-14 h-14 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors shadow-lg">
                    <svg className="w-6 h-6 text-gray-900 ml-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                    </svg>
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-emerald-400 text-xs font-bold uppercase tracking-wide">NOW STREAMING</p>
                    <h3 className="text-white font-bold text-lg leading-tight truncate">Black Clover Opening 10 | Black Catcher</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Trending Lessons Component
function TrendingLessons() {
  const { data: videos = [], isLoading: videoLoading } = useQuery<VideoItem[]>({
    queryKey: ['home-trending-videos'],
    queryFn: mockApi.getVideos,
    initialData: [],
  });

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h2 className="text-3xl font-bold mb-2">Trending Now</h2>
          <p className="text-gray-600">The most popular lessons this week</p>
        </div>
        <a href="#" className="text-emerald-600 font-semibold flex items-center gap-2 hover:gap-3 transition-all">
          View All
          <span>→</span>
        </a>
      </div>

      {videoLoading ? (
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="overflow-hidden rounded-lg">
              <Skeleton className="aspect-video bg-slate-100" />
              <div className="p-6 space-y-3">
                <Skeleton className="h-6 w-full bg-slate-100" />
                <Skeleton className="h-4 w-2/3 bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {videos.slice(0, 3).map((video) => {
            return (
              <Card 
                key={video.id}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group border-0 flex flex-col h-full"
              >
                <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 relative overflow-hidden">
                  {video.youtube_id && (
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${video.youtube_id}`}
                      title={video.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="absolute inset-0"
                    ></iframe>
                  )}
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-lg group-hover:text-emerald-600 transition-colors line-clamp-2 flex-1">
                        {video.title}
                      </h3>
                      {video.jlpt_level && (
                        <span className="text-white text-xs font-bold bg-emerald-600 px-2 py-1 rounded ml-2 whitespace-nowrap">
                          {video.jlpt_level}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mt-2">
                    {moment(video.created_date).fromNow()}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  )
}

// Why Learn Component
function WhyLearn() {
  const features = [
    {
      id: 1,
      icon: FaBook,
      title: 'Contextual Learning',
      description: 'Don\'t just memorize words. See how native speakers use them in high-stakes dramatic situations.'
    },
    {
      id: 2,
      icon: FaCheckCircle,
      title: 'Interactive Quizzes',
      description: 'Instantly test your retention with dynamic flashcard and multiple-choice offer key concepts, Mastery mode available.'
    },
    {
      id: 3,
      icon: FaGamepad,
      title: 'Gamified Progress',
      description: 'Earn XP with legendary character unlocks and leaderboards as you level up your fluency.'
    }
  ]

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold mb-4">Why Learn with Anime?</h2>
        <p className="text-gray-600 text-lg">Master the language through immersion and entertainment</p>
      </div>

      <div className="grid md:grid-cols-3 gap-12">
        {features.map((feature) => {
          const IconComponent = feature.icon
          return (
            <div key={feature.id} className="text-center">
              <div className="flex justify-center mb-4">
                <IconComponent className="text-5xl text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

// Choose Path Component
function ChoosePath() {
  const paths = [
    {
      id: 1,
      level: 'Beginner (N5-N4)',
      description: 'Start from zero. Learn Hiragana, Katakana, and basic survival phrases using slice-of-the-anime.',
      lessons: '240+'
    },
    {
      id: 2,
      level: 'Intermediate (N3-N2)',
      description: 'Bridge the gap. Dive into complex grammar and thousands of Kanji through iconic scenes.',
      lessons: '180+'
    },
    {
      id: 3,
      level: 'Advanced (N1)',
      description: 'Master the nuances. Study political drama and philosophical dialogue for near-native comprehension.',
      lessons: '95+'
    }
  ]

  return (
    <section className="bg-gray-100 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-12">Choose Your Path</h2>

        <div className="space-y-4">
          {paths.map((path) => (
            <Card
              key={path.id}
              className="p-8 border-l-4 border-l-emerald-600 bg-white hover:shadow-md transition-shadow cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {path.level}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {path.description}
                  </p>
                </div>
                <div className="text-right ml-8 flex items-center gap-4 shrink-0">
                  <div>
                    <p className="text-3xl font-bold text-emerald-700 mb-1">
                      {path.lessons}
                    </p>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">
                      Lessons Available
                    </p>
                  </div>
                  <button className="text-emerald-600 hover:text-emerald-700 transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

// CTA Section Component
function CTASection() {
  const navigate = useNavigate()
  
  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="bg-emerald-700 rounded-3xl p-12 text-center text-white">
        <h2 className="text-4xl font-bold mb-4">
          Ready to start your journey?
        </h2>
        <p className="text-lg mb-8 text-emerald-50">
          Stop watching with subtitles. Start living the language. Join thousands of fans today.
        </p>
        
        <Button 
          className="bg-white hover:bg-gray-100 text-emerald-700 font-semibold px-8 py-3 text-base rounded-full"
          onClick={() => navigate('/signup')}
        >
          Sign Up Now
        </Button>

        <p className="mt-6 text-sm text-emerald-100">
          7-day free trial • No credit card required
        </p>
      </div>
    </section>
  )
}

// Footer Component
function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-emerald-600 rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="font-bold text-white">AnimeLearn</span>
            </div>
            <p className="text-sm">
              © 2024 AnimeLearn. Master Japanese through the joy of anime.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-emerald-400">Curriculum</a></li>
              <li><a href="#" className="hover:text-emerald-400">Instructors</a></li>
              <li><a href="#" className="hover:text-emerald-400">FAQ</a></li>
              <li><a href="#" className="hover:text-emerald-400">Pricing</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-emerald-400">Terms</a></li>
              <li><a href="#" className="hover:text-emerald-400">Privacy</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Follow Us</h4>
            <div className="flex gap-4">
              <a href="#" className="hover:text-emerald-400">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 0C4.477 0 0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.879V12.89h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.989C16.343 19.129 20 14.99 20 10c0-5.523-4.477-10-10-10z" />
                </svg>
              </a>
              <a href="#" className="hover:text-emerald-400">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-sm text-center text-gray-500">
          <p>&copy; 2024 AnimeLearn. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

// Main Page
export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Header />
      <Hero />
      <TrendingLessons />
      <WhyLearn />
      <ChoosePath />
      <CTASection />
      <Footer />
    </main>
  )
}
