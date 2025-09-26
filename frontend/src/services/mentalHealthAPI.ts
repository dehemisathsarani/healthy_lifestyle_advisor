import axios, { AxiosResponse } from 'axios'

const API_BASE_URL = 'http://localhost:8005' // Changed from 8000 to 8005

// Types
export interface MoodAnalysisRequest {
  text: string
  user_id?: string
}

export interface MoodAnalysisResponse {
  detected_mood: string
  confidence: number
  message: string
  suggestions: string[]
}

export interface YouTubeTrackResponse {
  title: string
  artist: string
  youtube_id: string
  duration: string
  mood_type: string
  embed_url: string
}

export interface JokeResponse {
  joke: string
  type: string
  safe: boolean
  source: string
}

export interface FunnyImageResponse {
  url: string
  description: string
  type: string
  caption: string
}

export interface HistoryItem {
  id: string
  type: string
  content: any
  timestamp: string
  session_id: string
}

export interface HistoryResponse {
  user_id: string
  items: HistoryItem[]
  total_count: number
}

export interface CrisisResources {
  emergency_numbers: Array<{
    name: string
    number?: string
    url?: string
  }>
  immediate_support: string[]
}

class MentalHealthAPI {
  private baseURL: string

  constructor() {
    this.baseURL = `${API_BASE_URL}/mental-health`
  }

  /**
   * Analyze mood from user input text
   */
  async analyzeMood(request: MoodAnalysisRequest): Promise<MoodAnalysisResponse> {
    try {
      const response: AxiosResponse<MoodAnalysisResponse> = await axios.post(
        `${this.baseURL}/analyze-mood`,
        request,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000
        }
      )
      return response.data
    } catch (error) {
      console.error('Error analyzing mood:', error)
      // Return fallback response
      return {
        detected_mood: 'unclear',
        confidence: 0.0,
        message: 'How are you feeling right now?',
        suggestions: ['Tell me more about how you\'re feeling', 'Would you like to try some activities?']
      }
    }
  }

  /**
   * Get YouTube track for specific mood
   */
  async getYouTubeTrack(mood: string): Promise<YouTubeTrackResponse> {
    try {
      const response: AxiosResponse<YouTubeTrackResponse> = await axios.get(
        `${this.baseURL}/youtube/${encodeURIComponent(mood)}`,
        {
          timeout: 10000
        }
      )
      return response.data
    } catch (error) {
      console.error('Error getting YouTube track:', error)
      // Return fallback track
      return {
        title: 'Weightless',
        artist: 'Marconi Union',
        youtube_id: 'UfcAVejslrU',
        duration: '8:08',
        mood_type: 'calm',
        embed_url: 'https://www.youtube.com/embed/UfcAVejslrU?autoplay=1&controls=1&rel=0&modestbranding=1&showinfo=0'
      }
    }
  }

  /**
   * Get a random joke
   */
  async getJoke(): Promise<JokeResponse> {
    try {
      const response: AxiosResponse<JokeResponse> = await axios.get(
        `${this.baseURL}/joke`,
        {
          timeout: 10000
        }
      )
      return response.data
    } catch (error) {
      console.error('Error getting joke:', error)
      // Return fallback joke
      const fallbackJokes = [
        "Why don't scientists trust atoms? Because they make up everything! 😄",
        "What do you call a bear with no teeth? A gummy bear! 🐻",
        "Why don't eggs tell jokes? They'd crack each other up! 🥚"
      ]
      const randomJoke = fallbackJokes[Math.floor(Math.random() * fallbackJokes.length)]
      
      return {
        joke: randomJoke,
        type: 'single',
        safe: true,
        source: 'fallback'
      }
    }
  }

  /**
   * Get a funny image
   */
  async getFunnyImage(): Promise<FunnyImageResponse> {
    try {
      const response: AxiosResponse<FunnyImageResponse> = await axios.get(
        `${this.baseURL}/funny-image`,
        {
          timeout: 10000
        }
      )
      return response.data
    } catch (error) {
      console.error('Error getting funny image:', error)
      // Return fallback emoji image
      const fallbackImages = [
        {
          url: '',
          description: 'Happy face emoji collection',
          type: 'emoji',
          caption: '😄😊😃😁🥳🎉 Smile! You\'re awesome!'
        },
        {
          url: '',
          description: 'Cute animal emojis',
          type: 'emoji',
          caption: '🐱🐶🦔🐧🦘🐨 Look at these cute animals!'
        },
        {
          url: '',
          description: 'Positive vibes emojis',
          type: 'emoji',
          caption: '✨🌟💫⭐🌈🎈 Sending you positive vibes!'
        }
      ]
      
      return fallbackImages[Math.floor(Math.random() * fallbackImages.length)]
    }
  }

  /**
   * Save item to user history
   */
  async saveToHistory(userId: string, itemType: string, content: any): Promise<{ success: boolean; item_id: string; message: string }> {
    try {
      const response = await axios.post(
        `${this.baseURL}/history`,
        null,
        {
          params: {
            user_id: userId,
            item_type: itemType,
            content: JSON.stringify(content)
          },
          timeout: 10000
        }
      )
      return response.data
    } catch (error) {
      console.error('Error saving to history:', error)
      return {
        success: false,
        item_id: '',
        message: 'Failed to save to history'
      }
    }
  }

  /**
   * Get user history
   */
  async getHistory(userId: string, limit: number = 50, itemType?: string): Promise<HistoryResponse> {
    try {
      const params: any = { limit }
      if (itemType) {
        params.item_type = itemType
      }

      const response: AxiosResponse<HistoryResponse> = await axios.get(
        `${this.baseURL}/history/${encodeURIComponent(userId)}`,
        {
          params,
          timeout: 10000
        }
      )
      return response.data
    } catch (error) {
      console.error('Error getting history:', error)
      return {
        user_id: userId,
        items: [],
        total_count: 0
      }
    }
  }

  /**
   * Get crisis support resources
   */
  async getCrisisResources(): Promise<CrisisResources> {
    try {
      const response: AxiosResponse<CrisisResources> = await axios.get(
        `${this.baseURL}/crisis-resources`,
        {
          timeout: 10000
        }
      )
      return response.data
    } catch (error) {
      console.error('Error getting crisis resources:', error)
      // Return fallback crisis resources
      return {
        emergency_numbers: [
          { name: 'National Suicide Prevention Lifeline (US)', number: '988' },
          { name: 'Crisis Text Line', number: 'Text HOME to 741741' },
          { name: 'Emergency Services', number: '911' }
        ],
        immediate_support: [
          'You are not alone in this. Your life has value.',
          'Please reach out to someone you trust - a friend, family member, or counselor.',
          'Consider calling a crisis helpline where trained professionals can help.',
          'If you\'re in immediate danger, please call emergency services (911).'
        ]
      }
    }
  }

  /**
   * Clear user history (use with caution)
   */
  async clearHistory(userId: string): Promise<{ success: boolean; deleted_count: number; message: string }> {
    try {
      const response = await axios.delete(
        `${this.baseURL}/history/${encodeURIComponent(userId)}`,
        {
          timeout: 10000
        }
      )
      return response.data
    } catch (error) {
      console.error('Error clearing history:', error)
      return {
        success: false,
        deleted_count: 0,
        message: 'Failed to clear history'
      }
    }
  }

  /**
   * Detect if text contains crisis indicators
   */
  detectCrisisLanguage(text: string): boolean {
    const crisisKeywords = [
      'suicide', 'kill myself', 'end it all', 'hurt myself', 'self harm', 'self-harm',
      'want to die', 'better off dead', 'no point living', 'worthless', 'hopeless',
      'cut myself', 'overdose', 'jump off', 'hang myself'
    ]
    
    const textLower = text.toLowerCase()
    return crisisKeywords.some(keyword => textLower.includes(keyword))
  }

  /**
   * Get mood-appropriate response message
   */
  getMoodResponseMessage(mood: string): string {
    const moodMessages = {
      sad: '💙 I\'m here with you. Let\'s try something to lift your spirits.',
      anxious: '🌸 Let\'s take this one step at a time. Here\'s something to help you feel calmer.',
      angry: '🌈 I understand you\'re feeling frustrated. Let\'s try something to help you cool down.',
      tired: '⚡ Let\'s find something to help energize you and boost your mood.',
      happy: '🎉 I love that you\'re feeling good! Let\'s keep that positive energy going.',
      default: '💙 I\'m here to help. Let\'s find something that might brighten your day.'
    }
    
    return moodMessages[mood as keyof typeof moodMessages] || moodMessages.default
  }
}

// Export singleton instance
export const mentalHealthAPI = new MentalHealthAPI()

// Export individual functions for easier usage
export const {
  analyzeMood,
  getYouTubeTrack,
  getJoke,
  getFunnyImage,
  saveToHistory,
  getHistory,
  getCrisisResources,
  clearHistory,
  detectCrisisLanguage,
  getMoodResponseMessage
} = mentalHealthAPI