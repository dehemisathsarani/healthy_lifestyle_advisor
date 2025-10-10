import React, { useState } from 'react';
import { Music, Gamepad2, Image, Quote, ExternalLink, CheckCircle, ChevronRight } from 'lucide-react';

interface MoodRecommendationsProps {
  mood: 'positive' | 'negative';
  recommendations: {
    jokes?: any[];
    images?: any[];
    music?: any[];
    games?: any[];
    quotes?: any[];
  };
  onActivityComplete: (activityType: string, activity: any) => void;
  onComplete: () => void;
  showMoreOptions: boolean;
}

const MoodRecommendations: React.FC<MoodRecommendationsProps> = ({
  mood,
  recommendations,
  onActivityComplete,
  onComplete
}) => {
  const [currentSection, setCurrentSection] = useState<string>('jokes');
  const [completedActivities, setCompletedActivities] = useState<string[]>([]);

  const handleActivityClick = (activityType: string, activity: any) => {
    onActivityComplete(activityType, activity);
    setCompletedActivities(prev => [...prev, `${activityType}-${activity.id || activity.title}`]);
  };

  const getNextSection = (current: string): string => {
    const sections = mood === 'negative' 
      ? ['jokes', 'images', 'music', 'games']
      : ['quotes', 'images', 'music', 'games'];
    
    const currentIndex = sections.indexOf(current);
    return sections[currentIndex + 1] || sections[0];
  };

  const renderJokes = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-800 flex items-center">
          <Quote className="w-6 h-6 mr-2 text-yellow-500" />
          Jokes to Brighten Your Day
        </h3>
      </div>
      <div className="grid gap-4">
        {recommendations.jokes?.slice(0, 3).map((joke, index) => (
          <div
            key={index}
            className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 hover:shadow-md transition-all cursor-pointer"
            onClick={() => handleActivityClick('joke', { id: index, ...joke })}
          >
            <p className="text-gray-800 font-medium mb-2">{joke.setup || joke.joke}</p>
            {joke.delivery && (
              <p className="text-gray-600 italic">{joke.delivery}</p>
            )}
            <div className="mt-3 flex justify-between items-center">
              <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">
                {joke.category || 'General'}
              </span>
              {completedActivities.includes(`joke-${index}`) && (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderQuotes = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-800 flex items-center">
          <Quote className="w-6 h-6 mr-2 text-blue-500" />
          Motivational Quotes
        </h3>
      </div>
      <div className="grid gap-4">
        {(recommendations.quotes || [
          { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
          { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
          { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" }
        ]).slice(0, 3).map((quote, index) => (
          <div
            key={index}
            className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 hover:shadow-md transition-all cursor-pointer"
            onClick={() => handleActivityClick('quote', { id: index, ...quote })}
          >
            <p className="text-gray-800 font-medium mb-2 text-lg">"{quote.text}"</p>
            <p className="text-gray-600 text-right">— {quote.author}</p>
            <div className="mt-3 flex justify-end">
              {completedActivities.includes(`quote-${index}`) && (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderImages = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-800 flex items-center">
          <Image className="w-6 h-6 mr-2 text-green-500" />
          {mood === 'positive' ? 'Inspiring Images' : 'Calming Images'}
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.images?.slice(0, 6).map((image, index) => (
          <div
            key={index}
            className="relative group cursor-pointer rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all"
            onClick={() => handleActivityClick('image', { id: index, ...image })}
          >
            <img
              src={image.urls?.small || image.url}
              alt={image.alt_description || 'Inspirational image'}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-end">
              <div className="w-full p-3 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="text-sm font-medium">{image.description || 'Beautiful image'}</p>
                {image.user && (
                  <p className="text-xs">Photo by {image.user.name}</p>
                )}
              </div>
            </div>
            {completedActivities.includes(`image-${index}`) && (
              <div className="absolute top-2 right-2">
                <CheckCircle className="w-6 h-6 text-green-500 bg-white rounded-full" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderMusic = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-800 flex items-center">
          <Music className="w-6 h-6 mr-2 text-purple-500" />
          {mood === 'positive' ? 'Uplifting Music' : 'Calming Music'}
        </h3>
      </div>
      <div className="grid gap-4">
        {recommendations.music?.slice(0, 4).map((song, index) => (
          <div
            key={index}
            className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 hover:shadow-md transition-all cursor-pointer"
            onClick={() => handleActivityClick('music', { id: index, ...song })}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800">{song.title}</h4>
                <p className="text-gray-600 text-sm">{song.artist}</p>
                {song.description && (
                  <p className="text-gray-500 text-xs mt-1">{song.description}</p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {song.url && (
                  <a
                    href={song.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:text-purple-800"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                )}
                {completedActivities.includes(`music-${index}`) && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderGames = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-800 flex items-center">
          <Gamepad2 className="w-6 h-6 mr-2 text-red-500" />
          Fun Games to Play
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recommendations.games?.slice(0, 4).map((game, index) => (
          <div
            key={index}
            className="bg-red-50 border-2 border-red-200 rounded-xl p-4 hover:shadow-md transition-all cursor-pointer"
            onClick={() => handleActivityClick('game', { id: index, ...game })}
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-800">{game.name}</h4>
                <p className="text-gray-600 text-sm">{game.description}</p>
                <div className="flex items-center mt-2 space-x-2">
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                    {game.category}
                  </span>
                  <span className="text-xs text-gray-500">
                    ~{game.duration}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-center space-y-1">
                {game.url && (
                  <a
                    href={game.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-600 hover:text-red-800"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                )}
                {completedActivities.includes(`game-${index}`) && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCurrentSection = () => {
    switch (currentSection) {
      case 'jokes':
        return renderJokes();
      case 'quotes':
        return renderQuotes();
      case 'images':
        return renderImages();
      case 'music':
        return renderMusic();
      case 'games':
        return renderGames();
      default:
        return mood === 'negative' ? renderJokes() : renderQuotes();
    }
  };

  const getSectionName = (section: string) => {
    const names = {
      jokes: 'Jokes',
      quotes: 'Quotes',
      images: 'Images',
      music: 'Music',
      games: 'Games'
    };
    return names[section as keyof typeof names] || section;
  };

  return (
    <div className="space-y-6">
      {/* Section Navigation */}
      <div className="flex flex-wrap gap-2 justify-center">
        {(mood === 'negative' ? ['jokes', 'images', 'music', 'games'] : ['quotes', 'images', 'music', 'games']).map((section) => (
          <button
            key={section}
            onClick={() => setCurrentSection(section)}
            className={`px-4 py-2 rounded-full font-medium transition-all duration-200 ${
              currentSection === section
                ? 'bg-purple-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {getSectionName(section)}
          </button>
        ))}
      </div>

      {/* Current Section Content */}
      <div className="min-h-[400px]">
        {renderCurrentSection()}
      </div>

      {/* Navigation Controls */}
      <div className="flex justify-between items-center pt-6 border-t border-gray-200">
        <button
          onClick={() => setCurrentSection(getNextSection(currentSection))}
          className="flex items-center px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Try Something Else
          <ChevronRight className="w-5 h-5 ml-2" />
        </button>

        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">
            Completed {completedActivities.length} activities
          </p>
          <button
            onClick={onComplete}
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            Save & Finish Session
          </button>
        </div>
      </div>
    </div>
  );
};

export default MoodRecommendations;