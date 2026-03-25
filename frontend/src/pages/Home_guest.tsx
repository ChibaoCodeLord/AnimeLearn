'use client'

import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

// Header Component
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
            <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20"></div>
              <div className="relative z-10 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-full mb-4 backdrop-blur-sm">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                </div>
                <p className="text-white text-sm">Anime Lessons</p>
              </div>

              <div className="absolute bottom-0 right-0 m-6 bg-gray-800/90 backdrop-blur rounded-lg p-4 max-w-xs border border-gray-700">
                <p className="text-gray-400 text-xs mb-2">NOW STREAMING</p>
                <h3 className="text-white font-semibold mb-1">Jujutsu Kaisen: Cursed Energy Vocabulary</h3>
                <p className="text-gray-400 text-xs">Essential anime vocabulary</p>
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
  const lessons = [
    {
      id: 1,
      title: 'Naruto: Basic Greetings',
      description: 'Learn essential greetings',
      tag: 'IKKA',
      color: 'from-orange-400 to-orange-600'
    },
    {
      id: 2,
      title: 'One Piece: Battle Expressions',
      description: 'Powerful expressions and phrases',
      tag: 'IKKA',
      color: 'from-amber-400 to-amber-600'
    },
    {
      id: 3,
      title: 'Your Name: Romantic Vocab',
      description: 'Emotional expressions and love phrases',
      tag: 'IKKA',
      color: 'from-orange-400 to-red-600'
    }
  ]

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

      <div className="grid md:grid-cols-3 gap-6">
        {lessons.map((lesson) => (
          <Card 
            key={lesson.id}
            className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group border-0"
          >
            <div className={`aspect-video bg-gradient-to-br ${lesson.color} relative overflow-hidden`}>
              <div className="absolute inset-0 opacity-20 bg-pattern"></div>
              <div className="absolute top-4 left-4">
                <span className="text-white text-xs font-bold bg-black/40 px-3 py-1 rounded-full">
                  {lesson.tag}
                </span>
              </div>
              <div className="absolute inset-0 flex items-center justify-center group-hover:opacity-100 opacity-0 transition-opacity">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="p-6">
              <h3 className="font-bold text-lg mb-2 group-hover:text-emerald-600 transition-colors">
                {lesson.title}
              </h3>
              <p className="text-gray-600 text-sm">
                {lesson.description}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </section>
  )
}

// Why Learn Component
function WhyLearn() {
  const features = [
    {
      id: 1,
      icon: '📚',
      title: 'Contextual Learning',
      description: 'Don\'t just memorize words. See how native speakers use them in high-stakes dramatic situations.'
    },
    {
      id: 2,
      icon: '✓',
      title: 'Interactive Quizzes',
      description: 'Instantly test your retention with dynamic flashcard and multiple-choice offer key concepts, Mastery mode available.'
    },
    {
      id: 3,
      icon: '🎮',
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
        {features.map((feature) => (
          <div key={feature.id} className="text-center">
            <div className="text-5xl mb-4">{feature.icon}</div>
            <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
            <p className="text-gray-600 leading-relaxed">
              {feature.description}
            </p>
          </div>
        ))}
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
      lessons: '240+',
      color: 'from-blue-50 to-cyan-50',
      borderColor: 'border-blue-200'
    },
    {
      id: 2,
      level: 'Intermediate (N3-N2)',
      description: 'Bridge the gap. Dive into complex grammar and thousands of Kanji through iconic scenes.',
      lessons: '180+',
      color: 'from-purple-50 to-pink-50',
      borderColor: 'border-purple-200'
    },
    {
      id: 3,
      level: 'Advanced (N1)',
      description: 'Master the nuances. Finally political dramas and philosophical dialogue for near-native comprehension.',
      lessons: '95+',
      color: 'from-green-50 to-emerald-50',
      borderColor: 'border-green-200'
    }
  ]

  return (
    <section className="bg-gray-100 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-bold mb-12">Choose Your Path</h2>

        <div className="space-y-4">
          {paths.map((path) => (
            <Card
              key={path.id}
              className={`p-8 border-l-4 border-l-emerald-600 bg-gradient-to-r ${path.color} hover:shadow-lg transition-all cursor-pointer group`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-3 group-hover:text-emerald-600 transition-colors">
                    {path.level}
                  </h3>
                  <p className="text-gray-700 leading-relaxed max-w-2xl">
                    {path.description}
                  </p>
                </div>
                <div className="text-right ml-8">
                  <p className="text-4xl font-bold text-emerald-600 mb-1">
                    {path.lessons}
                  </p>
                  <p className="text-xs text-gray-600 uppercase tracking-wide">
                    Lessons Available
                  </p>
                  <button className="mt-6 text-emerald-600 hover:text-emerald-700 transition-colors">
                    <svg className="w-6 h-6 ml-auto" fill="currentColor" viewBox="0 0 20 20">
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
      <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl p-12 text-center text-white">
        <h2 className="text-4xl font-bold mb-4">
          Ready to start your journey?
        </h2>
        <p className="text-lg mb-8 opacity-95">
          Stop watching with subtitles. Start living the language. Join thousands of fans today.
        </p>
        
        <Button 
          className="bg-white hover:bg-gray-100 text-emerald-600 font-semibold px-8 py-6 text-base"
          onClick={() => navigate('/signup')}
        >
          Sign Up Now
        </Button>

        <p className="mt-6 text-sm opacity-75">
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
