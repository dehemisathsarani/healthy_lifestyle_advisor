// Enhanced Mood Tracker API Service
import type {
  JokeResponse,
  UnsplashImage,
  YouTubeVideo,
  GameRecommendation
} from '../types/enhancedMoodTracker.ts';

// API Service for Enhanced Mood Tracker
export class EnhancedMoodTrackerAPI {
  
  // JokesAPI for jokes (Free API)
  static async getJokes(count: number = 3): Promise<JokeResponse[]> {
    try {
      const jokes: JokeResponse[] = []
      for (let i = 0; i < count; i++) {
        const response = await fetch('https://v2.jokeapi.dev/joke/Any?blacklistFlags=nsfw,religious,political,racist,sexist,explicit&type=single')
        const data = await response.json()
        jokes.push({
          id: data.id?.toString() || Date.now().toString(),
          joke: data.joke || `${data.setup} ${data.delivery}`,
          category: data.category || 'General',
          type: data.type || 'single',
          setup: data.setup,
          delivery: data.delivery
        })
      }
      return jokes
    } catch (error) {
      console.error('Error fetching jokes:', error)
      return this.getFallbackJokes()
    }
  }

  // Unsplash API for motivational images (requires API key)
  static async getMotivationalImages(query: string, _count: number = 3): Promise<UnsplashImage[]> {
    try {
      // Note: In production, you'd need an Unsplash API key
      // For now, using sample data
      return this.getFallbackImages(query)
    } catch (error) {
      console.error('Error fetching images:', error)
      return this.getFallbackImages(query)
    }
  }

  // YouTube Data API for music recommendations
  static async getYouTubeMusic(mood: 'positive' | 'negative', _count: number = 3): Promise<YouTubeVideo[]> {
    try {
      // const query = mood === 'positive' ? 'happy motivational music' : 'calming relaxing music'
      // Note: In production, you'd need YouTube Data API key
      // For now, using curated playlist data
      return this.getFallbackMusic(mood)
    } catch (error) {
      console.error('Error fetching YouTube music:', error)
      return this.getFallbackMusic(mood)
    }
  }

  // Game recommendations
  static async getFunnyGames(_count: number = 3): Promise<GameRecommendation[]> {
    try {
      return this.getFallbackGames()
    } catch (error) {
      console.error('Error fetching games:', error)
      return this.getFallbackGames()
    }
  }

  // Fallback data when APIs are unavailable
  private static getFallbackJokes(): JokeResponse[] {
    return [
      {
        id: '1',
        joke: "Why don't scientists trust atoms? Because they make up everything!",
        category: 'Science',
        type: 'single'
      },
      {
        id: '2',
        joke: "I told my wife she was drawing her eyebrows too high. She looked surprised.",
        category: 'Pun',
        type: 'single'
      },
      {
        id: '3',
        joke: "Why did the scarecrow win an award? He was outstanding in his field!",
        category: 'Pun',
        type: 'single'
      }
    ]
  }

  private static getFallbackImages(_query: string): UnsplashImage[] {
    const baseImages = [
      {
        id: '1',
        urls: {
          small: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
          regular: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
          full: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4'
        },
        alt_description: 'Mountain landscape',
        description: 'Beautiful mountain scenery',
        user: { name: 'Nature Photographer' }
      },
      {
        id: '2',
        urls: {
          small: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400',
          regular: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800',
          full: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b'
        },
        alt_description: 'Sunrise over water',
        description: 'Peaceful sunrise',
        user: { name: 'Sunrise Captures' }
      },
      {
        id: '3',
        urls: {
          small: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400',
          regular: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
          full: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e'
        },
        alt_description: 'Forest path',
        description: 'Serene forest pathway',
        user: { name: 'Forest Explorer' }
      }
    ]
    return baseImages
  }

  private static getFallbackMusic(mood: 'positive' | 'negative'): YouTubeVideo[] {
    if (mood === 'positive') {
      return [
        {
          id: '1',
          title: 'Happy Upbeat Music - Feel Good Playlist',
          artist: 'Happy Vibes Music',
          description: 'Energizing music to boost your mood',
          url: 'https://youtube.com/watch?v=dQw4w9WgXcQ'
        },
        {
          id: '2',
          title: 'Motivational Background Music',
          artist: 'Motivation Station',
          description: 'Inspiring instrumental music',
          url: 'https://youtube.com/watch?v=dQw4w9WgXcQ'
        }
      ]
    } else {
      return [
        {
          id: '3',
          title: 'Relaxing Piano Music - Calm & Peaceful',
          artist: 'Peaceful Sounds',
          description: 'Soothing piano melodies for relaxation',
          url: 'https://youtube.com/watch?v=dQw4w9WgXcQ'
        },
        {
          id: '4',
          title: 'Nature Sounds - Rain & Thunder',
          artist: 'Nature Therapy',
          description: 'Calming nature sounds for stress relief',
          url: 'https://youtube.com/watch?v=dQw4w9WgXcQ'
        }
      ]
    }
  }

  private static getFallbackGames(): GameRecommendation[] {
    return [
      {
        id: '1',
        name: 'Quick Draw!',
        description: 'Fun drawing game that will make you laugh',
        category: 'Creative',
        duration: '5-10 min',
        url: 'https://quickdraw.withgoogle.com/'
      },
      {
        id: '2',
        name: 'Wordle',
        description: 'Daily word puzzle game',
        category: 'Puzzle',
        duration: '5 min',
        url: 'https://www.nytimes.com/games/wordle/index.html'
      },
      {
        id: '3',
        name: '2048',
        description: 'Addictive number puzzle game',
        category: 'Puzzle',
        duration: '10-15 min',
        url: 'https://play2048.co/'
      }
    ]
  }

  // Motivational quotes
  static getMotivationalQuotes(): string[] {
    return [
      "You are stronger than you think and more capable than you imagine.",
      "Every day is a new opportunity to grow and shine.",
      "Your positive mindset is your superpower.",
      "Believe in yourself and all that you are.",
      "You've overcome challenges before, and you'll do it again.",
      "Your happiness matters, and you deserve to feel joy.",
      "Progress, not perfection, is what matters.",
      "You are exactly where you need to be right now."
    ]
  }
}