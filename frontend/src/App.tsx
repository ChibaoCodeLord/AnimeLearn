import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { PlayCircle, Search, BookOpen, Tv, GraduationCap } from 'lucide-react'

function App() {
  const [searchQuery, setSearchQuery] = useState('')

  const featuredLessons = [
    {
      id: 1,
      title: 'Everyday Greetings in Anime',
      description: 'Learn how characters say hello, goodbye, and express gratitude in daily life.',
      level: 'Beginner',
      duration: '12 min',
      image: 'https://images.unsplash.com/photo-1578357078586-491adf1aa5ba?auto=format&fit=crop&q=80&w=400&h=250',
    },
    {
      id: 2,
      title: 'Mastering the "Wa" and "Ga" Particles',
      description: 'Stop getting confused! A visual guide to particles using classic shounen scenes.',
      level: 'Intermediate',
      duration: '18 min',
      image: 'https://images.unsplash.com/photo-1613376023733-0a73315d9b06?auto=format&fit=crop&q=80&w=400&h=250',
    },
    {
      id: 3,
      title: 'JLPT N4 Grammar: Casual Speech',
      description: 'How to sound natural. Moving away from polite forms to conversational Japanese.',
      level: 'Advanced',
      duration: '25 min',
      image: 'https://images.unsplash.com/photo-1545569341-9eb8b3097314?auto=format&fit=crop&q=80&w=400&h=250',
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Navigation */}
      <nav className="border-b bg-white sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight">
            <Tv className="w-6 h-6 text-red-500" />
            <span>Anime<span className="text-red-500">Learn</span></span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#" className="hover:text-red-500 transition-colors">Courses</a>
            <a href="#" className="hover:text-red-500 transition-colors">Grammar</a>
            <a href="#" className="hover:text-red-500 transition-colors">Vocabulary</a>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" className="hidden sm:inline-flex">Log in</Button>
            <Button className="bg-red-500 hover:bg-red-600 text-white">Start Learning</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-slate-950 text-white py-20 px-4 text-center">
        <div className="container mx-auto max-w-3xl">
          <Badge className="bg-red-500/10 text-red-400 hover:bg-red-500/20 mb-6 border-red-500/20">
            New: Spring 2026 Anime Lessons Added!
          </Badge>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
            Master Japanese by watching <span className="text-red-500">Anime</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 mb-10">
            Stop memorizing boring textbooks. Learn authentic vocabulary, native pronunciation, and complex grammar through your favorite shows.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input 
                type="text" 
                placeholder="Search for an anime or grammar point..." 
                className="w-full pl-10 bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 h-12"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button size="lg" className="w-full sm:w-auto h-12 bg-red-500 hover:bg-red-600">
              <PlayCircle className="w-5 h-5 mr-2" /> Browse
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 bg-white border-b">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
              <Tv className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Native Context</h3>
            <p className="text-slate-600 text-sm">Hear how words are actually used by native speakers in various situations.</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Interactive Subtitles</h3>
            <p className="text-slate-600 text-sm">Hover over any word to see its furigana, romaji, and English definition instantly.</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-lg mb-2">JLPT Aligned</h3>
            <p className="text-slate-600 text-sm">Lessons are tagged by JLPT levels (N5 to N1) so you can track your study progress.</p>
          </div>
        </div>
      </section>

      {/* Featured Lessons Grid */}
      <section className="py-16 px-4 container mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold tracking-tight">Featured Lessons</h2>
          <Button variant="outline">View All</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredLessons.map((lesson) => (
            <Card key={lesson.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="relative group cursor-pointer">
                <img 
                  src={lesson.image} 
                  alt={lesson.title} 
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <PlayCircle className="w-16 h-16 text-white drop-shadow-md" />
                </div>
                <Badge className="absolute top-3 right-3 bg-black/70 hover:bg-black/90 text-white border-none">
                  {lesson.duration}
                </Badge>
              </div>
              <CardHeader className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className={
                    lesson.level === 'Beginner' ? 'text-green-600 border-green-200 bg-green-50' :
                    lesson.level === 'Intermediate' ? 'text-blue-600 border-blue-200 bg-blue-50' :
                    'text-purple-600 border-purple-200 bg-purple-50'
                  }>
                    {lesson.level}
                  </Badge>
                </div>
                <CardTitle className="text-lg line-clamp-1">{lesson.title}</CardTitle>
                <CardDescription className="line-clamp-2 mt-2">
                  {lesson.description}
                </CardDescription>
              </CardHeader>
              <CardFooter className="p-4 pt-0">
                <Button className="w-full" variant="secondary">
                  Start Lesson
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}

export default App