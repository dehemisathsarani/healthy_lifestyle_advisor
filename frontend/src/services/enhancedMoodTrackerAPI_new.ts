// Enhanced Mood Tracker API Service with Content Deduplication
import type {
  JokeResponse,
  UnsplashImage,
  YouTubeVideo,
  GameRecommendation
} from '../types/enhancedMoodTracker';
import { ContentManager } from './contentManager';

// API Service for Enhanced Mood Tracker
export class EnhancedMoodTrackerAPI {
  
  // JokesAPI for jokes with mood-aware content and deduplication
  static async getJokes(count: number = 3, moodType?: string): Promise<JokeResponse[]> {
    try {
      let jokes: JokeResponse[] = []
      
      // Try to get fresh jokes from API first
      const apiJokes = await this.fetchJokesFromAPI(count * 2, moodType)
      const uniqueApiJokes = ContentManager.filterUniqueContent('jokes', apiJokes)
      
      jokes = uniqueApiJokes.slice(0, count)
      
      // If we don't have enough unique jokes from API, supplement with fallback
      if (jokes.length < count) {
        const fallbackJokes = this.getMoodSpecificFallbackJokes(moodType)
        const uniqueFallbackJokes = ContentManager.filterUniqueContent('jokes', fallbackJokes)
        jokes = [...jokes, ...uniqueFallbackJokes.slice(0, count - jokes.length)]
      }
      
      // If still not enough, reset tracker and get fresh content
      if (jokes.length < count && ContentManager.shouldRefreshPool('jokes', 50)) {
        ContentManager.clearContentTracker('jokes')
        const refreshedJokes = this.getMoodSpecificFallbackJokes(moodType)
        const newUniqueJokes = ContentManager.filterUniqueContent('jokes', refreshedJokes)
        jokes = [...jokes, ...newUniqueJokes.slice(0, count - jokes.length)]
      }
      
      return jokes
      
    } catch (error) {
      console.error('Error fetching jokes:', error)
      return this.getMoodSpecificFallbackJokes(moodType).slice(0, count)
    }
  }

  // Fetch jokes from JokesAPI
  private static async fetchJokesFromAPI(count: number, moodType?: string): Promise<JokeResponse[]> {
    const jokes: JokeResponse[] = []
    
    const getJokeCategories = (mood: string) => {
      const moodCategories: { [key: string]: string[] } = {
        'happy': ['Programming', 'Pun', 'Misc'],
        'excited': ['Programming', 'Pun', 'Misc'],
        'content': ['Programming', 'Pun', 'Misc'],
        'sad': ['Programming', 'Pun', 'Misc'],
        'anxious': ['Programming', 'Pun', 'Misc'],
        'angry': ['Programming', 'Pun', 'Misc'],
        'stressed': ['Programming', 'Pun', 'Misc'],
        'neutral': ['Programming', 'Pun', 'Misc'],
        'calm': ['Programming', 'Pun', 'Misc'],
        'overwhelmed': ['Programming', 'Pun', 'Misc']
      }
      return moodCategories[mood] || ['Programming', 'Pun', 'Misc']
    }

    const categories = moodType ? getJokeCategories(moodType) : ['Any']
    const categoryParam = categories.join(',')

    for (let i = 0; i < count; i++) {
      try {
        const url = `https://v2.jokeapi.dev/joke/${categoryParam}?blacklistFlags=nsfw,religious,political,racist,sexist,explicit&type=single`
        const response = await fetch(url)
        const data = await response.json()
        
        if (!data.error) {
          jokes.push({
            id: data.id?.toString() || Date.now().toString() + i,
            joke: data.joke || `${data.setup} ${data.delivery}`,
            category: data.category || 'General',
            type: data.type || 'single',
          })
        }
        
        // Small delay to be API-friendly
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        console.error('Error fetching individual joke:', error)
      }
    }
    
    return jokes
  }

  // Expanded mood-specific fallback jokes
  private static getMoodSpecificFallbackJokes(moodType?: string): JokeResponse[] {
    const moodJokes: { [key: string]: JokeResponse[] } = {
      'happy': [
        { id: 'h1', joke: "Why don't scientists trust atoms? Because they make up everything!", category: 'Science', type: 'single' },
        { id: 'h2', joke: "I told my wife she was drawing her eyebrows too high. She looked surprised.", category: 'Pun', type: 'single' },
        { id: 'h3', joke: "What do you call a bear with no teeth? A gummy bear!", category: 'Pun', type: 'single' },
        { id: 'h4', joke: "Why did the scarecrow win an award? Because he was outstanding in his field!", category: 'Pun', type: 'single' },
        { id: 'h5', joke: "What's the best thing about Switzerland? I don't know, but the flag is a big plus.", category: 'Geography', type: 'single' },
        { id: 'h6', joke: "I invented a new word: Plagiarism!", category: 'Wordplay', type: 'single' },
        { id: 'h7', joke: "Why don't eggs tell jokes? They'd crack each other up!", category: 'Pun', type: 'single' },
        { id: 'h8', joke: "What do you call a fake noodle? An impasta!", category: 'Food', type: 'single' },
        { id: 'h9', joke: "Why did the math book look so sad? Because it had too many problems!", category: 'School', type: 'single' },
        { id: 'h10', joke: "What do you call a dinosaur that crashes his car? Tyrannosaurus Wrecks!", category: 'Pun', type: 'single' }
      ],
      'sad': [
        { id: 's1', joke: "Why don't melons get married? Because they cantaloupe!", category: 'Pun', type: 'single' },
        { id: 's2', joke: "What do you call a sleeping bull? A bulldozer!", category: 'Animal', type: 'single' },
        { id: 's3', joke: "Why did the bicycle fall over? Because it was two-tired!", category: 'Pun', type: 'single' },
        { id: 's4', joke: "What do you call a bear in the rain? A drizzly bear!", category: 'Weather', type: 'single' },
        { id: 's5', joke: "Why don't elephants use computers? They're afraid of the mouse!", category: 'Technology', type: 'single' },
        { id: 's6', joke: "What do you call a pig that does karate? A pork chop!", category: 'Animal', type: 'single' },
        { id: 's7', joke: "Why did the cookie go to the doctor? Because it felt crumbly!", category: 'Food', type: 'single' },
        { id: 's8', joke: "What do you call a fish wearing a crown? A king fish!", category: 'Animal', type: 'single' },
        { id: 's9', joke: "Why don't trees ever get stressed? Because they just leaf their worries behind!", category: 'Nature', type: 'single' },
        { id: 's10', joke: "What do you call a happy cowboy? A jolly rancher!", category: 'Western', type: 'single' }
      ],
      'anxious': [
        { id: 'a1', joke: "Why did the yoga instructor refuse Novocain? She wanted to transcend dental medication!", category: 'Health', type: 'single' },
        { id: 'a2', joke: "What do you call a calm pasta? Pasta-bilities!", category: 'Food', type: 'single' },
        { id: 'a3', joke: "Why don't worry dolls ever stress? They take things one thread at a time!", category: 'Lifestyle', type: 'single' },
        { id: 'a4', joke: "What's a meditation teacher's favorite type of music? Soul music!", category: 'Music', type: 'single' },
        { id: 'a5', joke: "Why did the anxious math student feel better? Because problems have solutions!", category: 'School', type: 'single' },
        { id: 'a6', joke: "What do you call a relaxed frog? Un-hoppy... wait, that's backwards. A zen frog!", category: 'Animal', type: 'single' },
        { id: 'a7', joke: "Why don't clouds ever worry? Because every storm passes!", category: 'Weather', type: 'single' },
        { id: 'a8', joke: "What did the calm ocean say to the worried shore? Don't worry, I've got you covered!", category: 'Nature', type: 'single' },
        { id: 'a9', joke: "Why did the stress ball quit its job? It couldn't handle the pressure!", category: 'Work', type: 'single' },
        { id: 'a10', joke: "What's an anxious ghost's favorite activity? Boo-ga (yoga)!", category: 'Supernatural', type: 'single' }
      ],
      'angry': [
        { id: 'an1', joke: "Why don't angry cats ever win arguments? Because they always get purr-suaded otherwise!", category: 'Animal', type: 'single' },
        { id: 'an2', joke: "What do you call a calm volcano? A chill-cano!", category: 'Nature', type: 'single' },
        { id: 'an3', joke: "Why did the angry computer calm down? It found its chill.exe!", category: 'Technology', type: 'single' },
        { id: 'an4', joke: "What's the angriest type of math? Fuming fractions!", category: 'Math', type: 'single' },
        { id: 'an5', joke: "Why don't angry bees stay mad for long? Because they realize life is too buzzling!", category: 'Animal', type: 'single' },
        { id: 'an6', joke: "What do you call a peaceful warrior? A hugger not a fighter!", category: 'Peace', type: 'single' },
        { id: 'an7', joke: "Why did the angry chef become a comedian? To turn the heat down with humor!", category: 'Food', type: 'single' },
        { id: 'an8', joke: "What's an angry cloud's favorite hobby? Letting off steam!", category: 'Weather', type: 'single' },
        { id: 'an9', joke: "Why don't angry plants stay upset? They prefer to turn over a new leaf!", category: 'Nature', type: 'single' },
        { id: 'an10', joke: "What do you call a zen dragon? A snap-dragon... who learned to breathe instead of fire!", category: 'Fantasy', type: 'single' }
      ],
      'stressed': [
        { id: 'st1', joke: "Why don't stressed chickens make good comedians? They always crack under pressure!", category: 'Animal', type: 'single' },
        { id: 'st2', joke: "What do you call a relaxed deadline? An easy-line!", category: 'Work', type: 'single' },
        { id: 'st3', joke: "Why did the stressed cookie go to therapy? It was feeling crumbly under pressure!", category: 'Food', type: 'single' },
        { id: 'st4', joke: "What's a stressed person's favorite exercise? Running... away from deadlines!", category: 'Exercise', type: 'single' },
        { id: 'st5', joke: "Why don't elastic bands get stressed? They know how to stretch the truth!", category: 'Physics', type: 'single' },
        { id: 'st6', joke: "What do you call a calm emergency? A non-emergency!", category: 'Emergency', type: 'single' },
        { id: 'st7', joke: "Why did the stressed balloon calm down? It learned to let things go!", category: 'Physics', type: 'single' },
        { id: 'st8', joke: "What's a stress ball's life motto? Squeeze the day!", category: 'Motivation', type: 'single' },
        { id: 'st9', joke: "Why don't stressed trees ever break? They bend with the wind!", category: 'Nature', type: 'single' },
        { id: 'st10', joke: "What do you call a peaceful juggler? Someone who can balance it all!", category: 'Performance', type: 'single' }
      ],
      'excited': [
        { id: 'e1', joke: "Why was the energy drink so excited? It was amped up!", category: 'Energy', type: 'single' },
        { id: 'e2', joke: "What do you call an excited electrician? A live wire!", category: 'Work', type: 'single' },
        { id: 'e3', joke: "Why don't excited rockets ever calm down? They're always over the moon!", category: 'Space', type: 'single' },
        { id: 'e4', joke: "What's an excited bee's favorite dance? The buzz step!", category: 'Animal', type: 'single' },
        { id: 'e5', joke: "Why was the excited light bulb so bright? It had a brilliant idea!", category: 'Innovation', type: 'single' },
        { id: 'e6', joke: "What do you call an excited ghost? Boo-yah!", category: 'Supernatural', type: 'single' },
        { id: 'e7', joke: "Why don't excited springs ever get tired? They always bounce back!", category: 'Physics', type: 'single' },
        { id: 'e8', joke: "What's an excited volcano's favorite activity? Erupting with joy!", category: 'Nature', type: 'single' },
        { id: 'e9', joke: "Why was the excited clock always early? It couldn't wait for the moment!", category: 'Time', type: 'single' },
        { id: 'e10', joke: "What do you call an excited mathematician? Someone who's really pumped about problems!", category: 'Math', type: 'single' }
      ]
    }

    return moodJokes[moodType || 'happy'] || moodJokes['happy']
  }

  // Images with content tracking
  static async getMotivationalImages(query: string, count: number = 3): Promise<UnsplashImage[]> {
    try {
      // Try API first, then fallback
      const fallbackImages = this.getMoodSpecificFallbackImages(query)
      const uniqueImages = ContentManager.filterUniqueContent('images', fallbackImages)
      
      if (uniqueImages.length < count && ContentManager.shouldRefreshPool('images', 30)) {
        ContentManager.clearContentTracker('images')
        const refreshedImages = this.getMoodSpecificFallbackImages(query)
        const newUniqueImages = ContentManager.filterUniqueContent('images', refreshedImages)
        return [...uniqueImages, ...newUniqueImages].slice(0, count)
      }
      
      return uniqueImages.slice(0, count)
    } catch (error) {
      console.error('Error fetching motivational images:', error)
      return this.getMoodSpecificFallbackImages(query).slice(0, count)
    }
  }

  // YouTube music with content tracking
  static async getYouTubeMusic(mood: 'positive' | 'negative', count: number = 3): Promise<YouTubeVideo[]> {
    try {
      const fallbackMusic = this.getMoodSpecificFallbackMusic(mood)
      const uniqueMusic = ContentManager.filterUniqueContent('music', fallbackMusic)
      
      if (uniqueMusic.length < count && ContentManager.shouldRefreshPool('music', 20)) {
        ContentManager.clearContentTracker('music')
        const refreshedMusic = this.getMoodSpecificFallbackMusic(mood)
        const newUniqueMusic = ContentManager.filterUniqueContent('music', refreshedMusic)
        return [...uniqueMusic, ...newUniqueMusic].slice(0, count)
      }
      
      return uniqueMusic.slice(0, count)
    } catch (error) {
      console.error('Error fetching YouTube music:', error)
      return this.getMoodSpecificFallbackMusic(mood).slice(0, count)
    }
  }

  // Games with content tracking
  static async getFunnyGames(count: number = 3): Promise<GameRecommendation[]> {
    try {
      const fallbackGames = this.getMoodSpecificFallbackGames()
      const uniqueGames = ContentManager.filterUniqueContent('games', fallbackGames)
      
      if (uniqueGames.length < count && ContentManager.shouldRefreshPool('games', 15)) {
        ContentManager.clearContentTracker('games')
        const refreshedGames = this.getMoodSpecificFallbackGames()
        const newUniqueGames = ContentManager.filterUniqueContent('games', refreshedGames)
        return [...uniqueGames, ...newUniqueGames].slice(0, count)
      }
      
      return uniqueGames.slice(0, count)
    } catch (error) {
      console.error('Error fetching games:', error)
      return this.getMoodSpecificFallbackGames().slice(0, count)
    }
  }

  // Motivational quotes with content tracking and API integration
  static async getMotivationalQuotes(moodType?: string, count: number = 3): Promise<{ text: string; author: string }[]> {
    try {
      let quotes: { text: string; author: string }[] = []
      
      // Try to get quotes from ZenQuotes API first
      const apiQuotes = await this.fetchQuotesFromAPI(moodType, count)
      const uniqueApiQuotes = ContentManager.filterUniqueContent('quotes', apiQuotes)
      
      quotes = uniqueApiQuotes.slice(0, count)
      
      // If we don't have enough unique quotes from API, supplement with fallback
      if (quotes.length < count) {
        const fallbackQuotes = this.getMoodSpecificFallbackQuotes(moodType)
        const uniqueFallbackQuotes = ContentManager.filterUniqueContent('quotes', fallbackQuotes)
        quotes = [...quotes, ...uniqueFallbackQuotes.slice(0, count - quotes.length)]
      }
      
      // If still not enough, reset tracker and get fresh content
      if (quotes.length < count && ContentManager.shouldRefreshPool('quotes', 40)) {
        ContentManager.clearContentTracker('quotes')
        const refreshedQuotes = this.getMoodSpecificFallbackQuotes(moodType)
        const newUniqueQuotes = ContentManager.filterUniqueContent('quotes', refreshedQuotes)
        quotes = [...quotes, ...newUniqueQuotes.slice(0, count - quotes.length)]
      }
      
      return quotes
    } catch (error) {
      console.error('Error fetching motivational quotes:', error)
      return this.getMoodSpecificFallbackQuotes(moodType).slice(0, count)
    }
  }

  // Fetch quotes from ZenQuotes API
  private static async fetchQuotesFromAPI(_moodType?: string, count: number = 3): Promise<{ text: string; author: string }[]> {
    try {
      const quotes: { text: string; author: string }[] = []
      
      // Get multiple quotes to have variety
      for (let i = 0; i < count; i++) {
        const response = await fetch('https://zenquotes.io/api/random', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data && data.length > 0) {
            const quote = data[0]
            quotes.push({
              text: quote.q.trim(),
              author: quote.a.trim()
            })
          }
        }
        
        // Small delay between requests to be API-friendly
        if (i < count - 1) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
      
      return quotes
    } catch (error) {
      console.error('Error fetching from ZenQuotes API:', error)
      return []
    }
  }

  // Expanded fallback quotes organized by mood type
  private static getMoodSpecificFallbackQuotes(moodType?: string): { text: string; author: string }[] {
    const moodQuotes: { [key: string]: { text: string; author: string }[] } = {
      'happy': [
        { text: "Happiness is not something ready made. It comes from your own actions.", author: "Dalai Lama" },
        { text: "The purpose of our lives is to be happy.", author: "Dalai Lama" },
        { text: "Success is not the key to happiness. Happiness is the key to success.", author: "Albert Schweitzer" },
        { text: "Keep your face always toward the sunshine—and shadows will fall behind you.", author: "Walt Whitman" },
        { text: "Be yourself; everyone else is already taken.", author: "Oscar Wilde" },
        { text: "The best way to cheer yourself up is to try to cheer somebody else up.", author: "Mark Twain" },
        { text: "Happiness is when what you think, what you say, and what you do are in harmony.", author: "Mahatma Gandhi" },
        { text: "Life is really simple, but we insist on making it complicated.", author: "Confucius" },
        { text: "The greatest happiness you can have is knowing that you do not necessarily require happiness.", author: "William Saroyan" },
        { text: "Happiness depends upon ourselves.", author: "Aristotle" }
      ],
      'excited': [
        { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
        { text: "Don't limit your challenges. Challenge your limits.", author: "Unknown" },
        { text: "Dream big and dare to fail.", author: "Norman Vaughan" },
        { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
        { text: "Your limitation—it's only your imagination.", author: "Unknown" },
        { text: "Great things never come from comfort zones.", author: "Unknown" },
        { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
        { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
        { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
        { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" }
      ],
      'sad': [
        { text: "The wound is the place where the Light enters you.", author: "Rumi" },
        { text: "You are braver than you believe, stronger than you seem.", author: "A.A. Milne" },
        { text: "This too shall pass.", author: "Persian Proverb" },
        { text: "Every ending is a new beginning.", author: "Unknown" },
        { text: "You have been assigned this mountain to show others it can be moved.", author: "Mel Robbins" },
        { text: "The darkest nights produce the brightest stars.", author: "John Green" },
        { text: "Sometimes you need to be broken down to rebuild yourself stronger.", author: "Unknown" },
        { text: "Pain is inevitable. Suffering is optional.", author: "Buddhist Proverb" },
        { text: "Even the darkest night will end and the sun will rise.", author: "Victor Hugo" },
        { text: "You are stronger than you think and more capable than you imagine.", author: "Unknown" }
      ],
      'anxious': [
        { text: "You have power over your mind - not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius" },
        { text: "Anxiety does not empty tomorrow of its sorrows, but only empties today of its strength.", author: "Charles Spurgeon" },
        { text: "Peace comes from within. Do not seek it without.", author: "Buddha" },
        { text: "You are stronger than you think and more capable than you imagine.", author: "Unknown" },
        { text: "Breathe in peace, breathe out stress.", author: "Unknown" },
        { text: "Worrying does not take away tomorrow's troubles. It takes away today's peace.", author: "Unknown" },
        { text: "You can't control everything. Sometimes you just need to relax and have faith that things will work out.", author: "Kody Keplinger" },
        { text: "Nothing can bring you peace but yourself.", author: "Ralph Waldo Emerson" },
        { text: "The present moment is the only time over which we have dominion.", author: "Thich Nhat Hanh" },
        { text: "Anxiety is the dizziness of freedom.", author: "Søren Kierkegaard" }
      ],
      'angry': [
        { text: "Holding on to anger is like grasping a hot coal with the intent of throwing it at someone else.", author: "Buddha" },
        { text: "The best fighter is never angry.", author: "Lao Tzu" },
        { text: "For every minute you remain angry, you give up sixty seconds of peace of mind.", author: "Ralph Waldo Emerson" },
        { text: "Anger is an acid that can do more harm to the vessel in which it is stored than to anything on which it is poured.", author: "Mark Twain" },
        { text: "When you are angry, be silent.", author: "Unknown" },
        { text: "Anybody can become angry — that is easy, but to be angry with the right person and to the right degree and at the right time and for the right purpose, and in the right way — that is not within everybody's power.", author: "Aristotle" },
        { text: "Anger makes you smaller, while forgiveness forces you to grow beyond what you were.", author: "Cherie Carter-Scott" },
        { text: "The greatest remedy for anger is delay.", author: "Thomas Paine" },
        { text: "Speak when you are angry and you will make the best speech you will ever regret.", author: "Ambrose Bierce" },
        { text: "If you are patient in one moment of anger, you will escape a hundred days of sorrow.", author: "Chinese Proverb" }
      ],
      'stressed': [
        { text: "It's not the load that breaks you down, it's the way you carry it.", author: "Lou Holtz" },
        { text: "Take time to make your soul happy.", author: "Unknown" },
        { text: "Stress is caused by being 'here' but wanting to be 'there'.", author: "Eckhart Tolle" },
        { text: "You have survived 100% of your worst days. You're doing great.", author: "Unknown" },
        { text: "Sometimes the most productive thing you can do is relax.", author: "Mark Black" },
        { text: "Don't stress over what you can't control.", author: "Unknown" },
        { text: "Stress is the trash of modern life—we all generate it but if you don't dispose of it properly, it will pile up and overtake your life.", author: "Danzae Pace" },
        { text: "The time to relax is when you don't have time for it.", author: "Sydney J. Harris" },
        { text: "If you want to conquer the anxiety of life, live in the moment, live in the breath.", author: "Amit Ray" },
        { text: "Much of the stress that people feel doesn't come from having too much to do. It comes from not finishing what they've started.", author: "David Allen" }
      ]
    }

    return moodQuotes[moodType || 'happy'] || moodQuotes['happy']
  }

  // Expanded mood-specific fallback images
  private static getMoodSpecificFallbackImages(query: string): UnsplashImage[] {
    const imageCollections: { [key: string]: UnsplashImage[] } = {
      'motivation': [
        {
          id: 'img_m1',
          urls: { small: '/api/placeholder/300/200', regular: '/api/placeholder/600/400', full: '/api/placeholder/1200/800' },
          alt_description: 'Person climbing mountain peak at sunrise',
          description: 'Achievement and determination',
          user: { name: 'Motivation Gallery' }
        },
        {
          id: 'img_m2', 
          urls: { small: '/api/placeholder/300/200', regular: '/api/placeholder/600/400', full: '/api/placeholder/1200/800' },
          alt_description: 'Success quote with beautiful landscape',
          description: 'Inspirational mountain view',
          user: { name: 'Success Stories' }
        },
        {
          id: 'img_m3',
          urls: { small: '/api/placeholder/300/200', regular: '/api/placeholder/600/400', full: '/api/placeholder/1200/800' },
          alt_description: 'Hands reaching towards bright sky',
          description: 'Hope and aspiration',
          user: { name: 'Dream Achievers' }
        }
      ],
      'calm': [
        {
          id: 'img_c1',
          urls: { small: '/api/placeholder/300/200', regular: '/api/placeholder/600/400', full: '/api/placeholder/1200/800' },
          alt_description: 'Peaceful lake reflection at sunset',
          description: 'Tranquil nature scene',
          user: { name: 'Calm Moments' }
        },
        {
          id: 'img_c2',
          urls: { small: '/api/placeholder/300/200', regular: '/api/placeholder/600/400', full: '/api/placeholder/1200/800' },
          alt_description: 'Zen garden with smooth stones',
          description: 'Meditation and peace',
          user: { name: 'Zen Masters' }
        },
        {
          id: 'img_c3',
          urls: { small: '/api/placeholder/300/200', regular: '/api/placeholder/600/400', full: '/api/placeholder/1200/800' },
          alt_description: 'Soft clouds in blue sky',
          description: 'Serenity and calmness',
          user: { name: 'Sky Watchers' }
        }
      ]
    }

    return imageCollections[query] || imageCollections['motivation']
  }

  // Expanded mood-specific fallback music
  private static getMoodSpecificFallbackMusic(mood: 'positive' | 'negative'): YouTubeVideo[] {
    const musicCollections: { [key: string]: YouTubeVideo[] } = {
      'positive': [
        {
          id: 'music_p1',
          title: 'Happy Upbeat Music Mix',
          artist: 'Various Artists',
          description: 'Energizing music collection',
          url: 'https://youtube.com/watch?v=sample_happy_1'
        },
        {
          id: 'music_p2',
          title: 'Energetic Pop Playlist',
          artist: 'Pop Artists',
          description: 'Feel-good pop music',
          url: 'https://youtube.com/watch?v=sample_energetic_1'
        },
        {
          id: 'music_p3',
          title: 'Feel Good Songs 2024',
          artist: 'Contemporary Artists',
          description: 'Latest uplifting hits',
          url: 'https://youtube.com/watch?v=sample_feelgood_1'
        },
        {
          id: 'music_p4',
          title: 'Motivation Music Mix',
          artist: 'Motivational Artists',
          description: 'Inspiring musical journey',
          url: 'https://youtube.com/watch?v=sample_motivation_1'
        },
        {
          id: 'music_p5',
          title: 'Celebration Hits Playlist',
          artist: 'Party Artists',
          description: 'Music for celebrations',
          url: 'https://youtube.com/watch?v=sample_celebration_1'
        }
      ],
      'negative': [
        {
          id: 'music_n1',
          title: 'Calming Piano Music',
          artist: 'Piano Masters',
          description: 'Peaceful piano melodies',
          url: 'https://youtube.com/watch?v=sample_calming_1'
        },
        {
          id: 'music_n2',
          title: 'Healing Meditation Sounds',
          artist: 'Meditation Artists',
          description: 'Sounds for healing and peace',
          url: 'https://youtube.com/watch?v=sample_healing_1'
        },
        {
          id: 'music_n3',
          title: 'Comfort Songs Playlist',
          artist: 'Comfort Artists',
          description: 'Music for emotional comfort',
          url: 'https://youtube.com/watch?v=sample_comfort_1'
        },
        {
          id: 'music_n4',
          title: 'Relaxing Nature Sounds',
          artist: 'Nature Collection',
          description: 'Peaceful natural ambience',
          url: 'https://youtube.com/watch?v=sample_nature_1'
        },
        {
          id: 'music_n5',
          title: 'Peaceful Acoustic Guitar',
          artist: 'Acoustic Masters',
          description: 'Gentle guitar melodies',
          url: 'https://youtube.com/watch?v=sample_acoustic_1'
        }
      ]
    }

    return musicCollections[mood] || musicCollections['positive']
  }

  // Expanded fallback games with variety
  private static getMoodSpecificFallbackGames(): GameRecommendation[] {
    return [
      {
        id: 'game_1',
        name: 'Smile Challenge',
        description: 'Make yourself smile for 60 seconds',
        category: 'Wellness',
        duration: '2-3 min',
        url: '/smile-challenge'
      },
      {
        id: 'game_2',
        name: 'Word Association Game',
        description: 'Fun word connection challenge',
        category: 'Brain Training',
        duration: '5-10 min',
        url: 'https://wordassociation.org'
      },
      {
        id: 'game_3',
        name: 'Color Matching Puzzle',
        description: 'Relaxing color-based puzzle game',
        category: 'Puzzle',
        duration: '10-15 min',
        url: 'https://colormatch.io'
      },
      {
        id: 'game_4',
        name: 'Breathing Exercise Game',
        description: 'Interactive breathing for relaxation',
        category: 'Wellness',
        duration: '3-5 min',
        url: '/breathing-game'
      },
      {
        id: 'game_5',
        name: 'Pattern Memory Challenge',
        description: 'Improve memory with patterns',
        category: 'Memory',
        duration: '5-8 min',
        url: 'https://memorygame.com'
      },
      {
        id: 'game_6',
        name: 'Quick Draw Challenge',
        description: 'Express creativity through drawing',
        category: 'Creative',
        duration: '3-7 min',
        url: 'https://quickdraw.withgoogle.com'
      },
      {
        id: 'game_7',
        name: 'Meditation Timer Game',
        description: 'Gamified meditation experience',
        category: 'Mindfulness',
        duration: '5-15 min',
        url: '/meditation-timer'
      },
      {
        id: 'game_8',
        name: 'Virtual Pet Care',
        description: 'Take care of a digital companion',
        category: 'Nurturing',
        duration: '10-20 min',
        url: 'https://virtualpet.com'
      },
      {
        id: 'game_9',
        name: 'Trivia Challenge',
        description: 'Test knowledge with fun questions',
        category: 'Knowledge',
        duration: '5-10 min',
        url: 'https://trivia.com'
      },
      {
        id: 'game_10',
        name: 'Relaxing Jigsaw Puzzle',
        description: 'Peaceful puzzle solving',
        category: 'Puzzle',
        duration: '15-30 min',
        url: 'https://jigsawpuzzles.io'
      }
    ]
  }

  // Reset content tracking for new sessions
  static resetSession(): void {
    ContentManager.resetTracker()
  }
}