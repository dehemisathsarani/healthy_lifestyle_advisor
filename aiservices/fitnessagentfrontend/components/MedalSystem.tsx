import React, { useState } from 'react';

export interface Medal {
  id: string;
  name: string;
  description: string;
  category: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  earned: boolean;
  earnedDate?: string;
  image: string;
  requirement: string;
}

interface MedalSystemProps {
  medals: Medal[];
  userProfile: {
    name: string;
    level: number;
  };
}

const MedalSystem: React.FC<MedalSystemProps> = ({ medals }) => {
  const [filter, setFilter] = useState<'all' | string>('all');
  const [tierFilter, setTierFilter] = useState<'all' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'>('all');
  const [activeModal, setActiveModal] = useState<Medal | null>(null);

  // Get unique categories
  const categories = ['all', ...new Set(medals.map(medal => medal.category))];
  
  // Filter medals based on category and tier
  const filteredMedals = medals.filter(medal => 
    (filter === 'all' || medal.category === filter) && 
    (tierFilter === 'all' || medal.tier === tierFilter)
  );
  
  // Get stats
  const earnedCount = medals.filter(m => m.earned).length;
  const totalCount = medals.length;
  const completionPercentage = Math.round((earnedCount / totalCount) * 100);
  
  // Get next medal to earn
  const nextMedalToEarn = medals.find(m => !m.earned);

  // Helper for tier color
  const getTierColor = (tier: string) => {
    switch(tier) {
      case 'bronze': return 'from-amber-700 to-amber-600';
      case 'silver': return 'from-gray-400 to-gray-300';
      case 'gold': return 'from-yellow-500 to-yellow-400';
      case 'platinum': return 'from-blue-400 to-blue-300';
      case 'diamond': return 'from-purple-500 to-purple-400';
      default: return 'from-gray-700 to-gray-600';
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold">Medal Collection</h3>
            <p className="text-indigo-100">
              {earnedCount} of {totalCount} medals earned ({completionPercentage}%)
            </p>
          </div>
          <div className="bg-white bg-opacity-20 rounded-full p-3">
            <span role="img" aria-label="Medals" className="text-2xl">🏅</span>
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <div className="border-b border-gray-200 px-6 py-3 bg-gray-50">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="mr-2 text-sm font-medium text-gray-700">Category:</div>
          <div className="flex flex-wrap gap-1">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setFilter(category)}
                className={`px-2.5 py-1 text-sm rounded-md ${
                  filter === category 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category === 'all' ? 'All' : category}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 items-center mt-3">
          <div className="mr-2 text-sm font-medium text-gray-700">Tier:</div>
          <div className="flex flex-wrap gap-1">
            {['all', 'bronze', 'silver', 'gold', 'platinum', 'diamond'].map(tier => (
              <button
                key={tier}
                onClick={() => setTierFilter(tier as any)}
                className={`px-2.5 py-1 text-sm rounded-md ${
                  tierFilter === tier 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tier === 'all' ? 'All Tiers' : tier.charAt(0).toUpperCase() + tier.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Medal grid */}
      <div className="p-6">
        {nextMedalToEarn && (
          <div className="mb-6 bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-lg border border-indigo-100">
            <h4 className="text-lg font-bold text-indigo-800 mb-2">Next Medal to Earn</h4>
            <div className="flex items-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-r ${getTierColor(nextMedalToEarn.tier)} mr-4`}>
                <span className="text-2xl">🏅</span>
              </div>
              <div>
                <h5 className="font-bold">{nextMedalToEarn.name}</h5>
                <p className="text-sm text-gray-600 mb-1">{nextMedalToEarn.description}</p>
                <p className="text-xs font-medium text-indigo-600">
                  How to earn: {nextMedalToEarn.requirement}
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredMedals.map((medal) => (
            <div 
              key={medal.id}
              onClick={() => setActiveModal(medal)}
              className={`rounded-lg border ${medal.earned ? 'border-indigo-200' : 'border-gray-200'} overflow-hidden cursor-pointer transition transform hover:scale-105 hover:shadow-md`}
            >
              <div className={`h-24 flex items-center justify-center bg-gradient-to-r ${getTierColor(medal.tier)}`}>
                <div className={`text-4xl ${medal.earned ? '' : 'opacity-40 grayscale'}`}>
                  {medal.earned ? '🏅' : '🔒'}
                </div>
              </div>
              <div className="p-3">
                <h5 className="font-medium text-sm">{medal.name}</h5>
                <p className="text-xs text-gray-500 truncate">{medal.description}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs capitalize px-1.5 py-0.5 bg-gray-100 rounded-md">
                    {medal.tier}
                  </span>
                  {medal.earned && (
                    <span className="text-xs text-green-600 font-medium">Earned</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {filteredMedals.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No medals found with the selected filters.</p>
          </div>
        )}
      </div>
      
      {/* Collection progress */}
      <div className="border-t border-gray-200 px-6 py-4">
        <h4 className="font-medium mb-2">Medal Collection Progress</h4>
        <div className="mb-2 flex justify-between text-xs text-gray-600">
          <span>Progress: {earnedCount}/{totalCount} medals</span>
          <span>{completionPercentage}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="h-2.5 rounded-full bg-indigo-600"
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
      </div>
      
      {/* Medal detail modal */}
      {activeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-xl p-4 flex items-center justify-between text-white">
              <h3 className="text-xl font-bold">{activeModal.name}</h3>
              <button 
                onClick={() => setActiveModal(null)}
                className="text-white hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-center mb-6">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center bg-gradient-to-r ${getTierColor(activeModal.tier)}`}>
                  <span className="text-5xl">{activeModal.earned ? '🏅' : '🔒'}</span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Description</h4>
                  <p className="text-gray-800">{activeModal.description}</p>
                </div>
                
                <div className="flex justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Category</h4>
                    <p className="text-gray-800 capitalize">{activeModal.category}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Tier</h4>
                    <p className="text-gray-800 capitalize">{activeModal.tier}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">How to Earn</h4>
                  <p className="text-gray-800">{activeModal.requirement}</p>
                </div>
                
                {activeModal.earned && (
                  <div className="bg-green-50 border border-green-100 rounded-lg p-3 flex items-center">
                    <span className="text-green-600 text-xl mr-3">✓</span>
                    <div>
                      <h5 className="font-medium text-green-800">Earned!</h5>
                      <p className="text-sm text-green-700">
                        Earned on {new Date(activeModal.earnedDate || '').toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="border-t border-gray-200 p-4 text-center">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedalSystem;
