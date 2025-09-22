import React, { useState } from 'react';
import { Achievement, UserProfile } from '../api';

interface LevelSystemProps {
  userProfile: UserProfile;
  achievements: Achievement[];
}

const LevelSystem: React.FC<LevelSystemProps> = ({ userProfile }) => {
  const [activeTab, setActiveTab] = useState<'rewards' | 'progress'>('rewards');
  const { level, experiencePoints, levelRewards } = userProfile;
  
  // Calculate XP needed for next level (increases by 250 per level)
  const baseXpForNextLevel = 1000;
  const xpIncreasePerLevel = 250;
  const xpNeededForNextLevel = baseXpForNextLevel + (level * xpIncreasePerLevel);
  
  // Calculate progress percentage to next level
  const xpForCurrentLevel = baseXpForNextLevel + ((level - 1) * xpIncreasePerLevel);
  const xpProgress = experiencePoints - xpForCurrentLevel;
  const xpNeeded = xpNeededForNextLevel - xpForCurrentLevel;
  const progressPercentage = Math.min(100, Math.round((xpProgress / xpNeeded) * 100));
  
  // Get claimed and available rewards
  // const claimedRewards = levelRewards.filter(reward => reward.claimed);
  const availableRewards = levelRewards.filter(reward => !reward.claimed && reward.levelRequired <= level);
  const upcomingRewards = levelRewards.filter(reward => reward.levelRequired > level);

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white text-xl font-bold">Level {level}</h3>
            <p className="text-blue-100">
              {xpProgress} / {xpNeeded} XP to Level {level + 1}
            </p>
          </div>
          <div className="bg-white bg-opacity-20 rounded-full p-3">
            <div className="text-white text-2xl font-bold">{level}</div>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-4 bg-white bg-opacity-20 rounded-full h-4">
          <div 
            className="h-4 rounded-full bg-yellow-400"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>
      
      {/* Tab navigation */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('rewards')}
          className={`flex-1 py-3 px-4 text-center font-medium ${
            activeTab === 'rewards' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
          }`}
        >
          Rewards
        </button>
        <button
          onClick={() => setActiveTab('progress')}
          className={`flex-1 py-3 px-4 text-center font-medium ${
            activeTab === 'progress' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
          }`}
        >
          Level Progress
        </button>
      </div>
      
      {/* Tab content */}
      <div className="p-6">
        {activeTab === 'rewards' && (
          <div>
            {/* Available rewards */}
            {availableRewards.length > 0 && (
              <>
                <h4 className="font-bold text-lg text-gray-800 mb-2">Available Rewards</h4>
                <div className="space-y-3 mb-6">
                  {availableRewards.map((reward) => (
                    <div key={reward.id} className="flex items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="mr-3 bg-blue-100 rounded-full p-2">
                        <span role="img" aria-label={reward.type} className="text-2xl">
                          {reward.type === 'badge' && '🏅'}
                          {reward.type === 'feature' && '⭐'}
                          {reward.type === 'discount' && '💰'}
                          {reward.type === 'content' && '📚'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h5 className="font-bold">{reward.name}</h5>
                        <p className="text-sm text-gray-600">{reward.description}</p>
                      </div>
                      <button className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition">
                        Claim
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
            
            {/* Upcoming rewards */}
            <h4 className="font-bold text-lg text-gray-800 mb-2">Upcoming Rewards</h4>
            <div className="space-y-3">
              {upcomingRewards.slice(0, 3).map((reward) => (
                <div key={reward.id} className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="mr-3 bg-gray-200 rounded-full p-2">
                    <span role="img" aria-label={reward.type} className="text-2xl opacity-50">
                      {reward.type === 'badge' && '🏅'}
                      {reward.type === 'feature' && '⭐'}
                      {reward.type === 'discount' && '💰'}
                      {reward.type === 'content' && '📚'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h5 className="font-bold">{reward.name}</h5>
                    <p className="text-sm text-gray-600">{reward.description}</p>
                    <p className="text-xs text-purple-600 mt-1">Unlocks at Level {reward.levelRequired}</p>
                  </div>
                  <div className="px-3 py-1 bg-gray-200 text-gray-500 rounded-md">
                    Locked
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'progress' && (
          <div>
            <h4 className="font-bold text-lg text-gray-800 mb-4">Your Level Journey</h4>
            
            <div className="space-y-4">
              {/* Level milestones */}
              <div className="relative">
                {Array.from({ length: Math.min(level + 3, 10) }).map((_, idx) => {
                  const levelNum = idx + 1;
                  const isCurrentLevel = levelNum === level;
                  const isPastLevel = levelNum < level;
                  // const isFutureLevel = levelNum > level;
                  
                  return (
                    <div key={levelNum} className={`flex items-center mb-4 ${isPastLevel ? 'opacity-70' : ''}`}>
                      <div 
                        className={`rounded-full w-10 h-10 flex items-center justify-center mr-4 ${
                          isCurrentLevel ? 'bg-blue-500 text-white shadow-lg ring-4 ring-blue-200' :
                          isPastLevel ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {levelNum}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h5 className={`font-bold ${isCurrentLevel ? 'text-blue-600' : ''}`}>
                            Level {levelNum}
                            {isCurrentLevel && <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Current</span>}
                          </h5>
                          <span className="text-sm text-gray-500">
                            {isPastLevel ? 'Completed' : 
                             isCurrentLevel ? `${progressPercentage}% Complete` : 
                             `${(level === 1 && levelNum === 2) ? '0' : ''}% Complete`}
                          </span>
                        </div>
                        
                        {/* Progress bar */}
                        <div className="mt-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              isPastLevel ? 'bg-green-500' :
                              isCurrentLevel ? 'bg-blue-500' : 'bg-gray-300'
                            }`}
                            style={{ 
                              width: `${isPastLevel ? '100' : isCurrentLevel ? progressPercentage : '0'}%` 
                            }}
                          ></div>
                        </div>
                        
                        {/* Level perks */}
                        <div className="mt-1 text-sm text-gray-600">
                          {levelRewards.filter(r => r.levelRequired === levelNum).map((reward, i) => (
                            <span key={i} className="mr-2">
                              {reward.name}{i < levelRewards.filter(r => r.levelRequired === levelNum).length - 1 ? ',' : ''}
                            </span>
                          ))}
                          {levelRewards.filter(r => r.levelRequired === levelNum).length === 0 && (
                            <span className="text-gray-400">No rewards at this level</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* Vertical line connecting levels */}
                <div className="absolute left-5 top-10 bottom-10 w-0.5 bg-gray-200 -translate-x-1/2 z-0"></div>
              </div>
              
              {level < 10 && (
                <div className="text-center text-gray-500 mt-2">
                  <p>More levels await on your fitness journey!</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Achievements unlocked reminder */}
      <div className="px-6 py-4 bg-gray-50 border-t">
        <p className="text-sm text-gray-600">
          <span className="font-medium">Tip:</span> Complete goals and workout sessions to earn XP and level up faster!
        </p>
      </div>
    </div>
  );
};

export default LevelSystem;
