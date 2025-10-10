export interface MoodLog {
  id: string;
  timestamp: Date;
  mood: 'positive' | 'negative';
  moodType: string;
  rating: number;
  description: string;
  factors: string[];
  activities: MoodActivity[];
}

export interface MoodActivity {
  id: string;
  type: 'joke' | 'image' | 'sticker' | 'music' | 'game' | 'quote';
  timestamp: Date;
  data: any;
  completed: boolean;
}

export interface MoodFormData {
  moodType: string;
  rating: number;
  description: string;
  factors: string[];
}

export interface JokeResponse {
  id?: string;
  setup?: string;
  delivery?: string;
  joke?: string;
  category?: string;
  type?: 'single' | 'twopart';
}

export interface UnsplashImage {
  id: string;
  urls: {
    small: string;
    regular: string;
    full: string;
  };
  alt_description: string;
  description: string;
  user: {
    name: string;
  };
}

export interface YouTubeVideo {
  id: string;
  title: string;
  artist: string;
  description?: string;
  url?: string;
}

export interface GameRecommendation {
  id: string;
  name: string;
  description: string;
  category: string;
  duration: string;
  url?: string;
}