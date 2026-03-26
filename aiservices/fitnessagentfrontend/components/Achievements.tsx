import React, { useState } from 'react';
import { Achievement } from '../api';

interface AchievementsProps {
  achievements: Achievement[];
  level: number;
  experiencePoints: number;
  nextLevelPoints: number;
}

const Achievements: React.FC<AchievementsProps> = ({
  achievements,
  level,
  experiencePoints,
  nextLevelPoints
}) => {
  const [activeTab, setActiveTab] = useState<'earned' | 'in-progress'>('earned');
  
  // Filter achievements based on active tab
  const filteredAchievements = achievements.filter(achievement => 
    activeTab === 'earned' ? achievement.earned : !achievement.earned
  );
  
  // Calculate experience percentage
  const expPercentage = (experiencePoints / nextLevelPoints) * 100;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Achievements & Rewards</h2>
      
      {/* Level and XP Bar */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
              {level}
            </div>
            <div className="ml-4">
              <h3 className="font-semibold text-lg">Level {level}</h3>
              <p className="text-sm text-gray-600">Fitness Enthusiast</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-sm font-medium">{experiencePoints} / {nextLevelPoints} XP</span>
            <p className="text-xs text-gray-500">{nextLevelPoints - experiencePoints} XP to Level {level + 1}</p>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full"
            style={{ width: `${expPercentage}%` }}
          />
        </div>
      </div>

      {/* Achievement Tabs */}
      <div className="mb-6 border-b">
        <div className="flex space-x-4">
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'earned'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600'
            }`}
            onClick={() => setActiveTab('earned')}
          >
            Earned
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'in-progress'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600'
            }`}
            onClick={() => setActiveTab('in-progress')}
          >
            In Progress
          </button>
        </div>
      </div>

      {/* Achievement Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAchievements.length > 0 ? (
          filteredAchievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`border rounded-lg p-4 transition-all ${
                achievement.earned
                  ? 'bg-gradient-to-br from-white to-blue-50 shadow-md hover:shadow-lg'
                  : 'bg-gray-50'
              }`}
            >
              <div className="flex">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                  style={{ backgroundColor: achievement.color + '20', color: achievement.color }}
                >
                  {achievement.icon}
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex justify-between">
                    <h3 className="font-semibold">
                      {achievement.title}
                      {achievement.level && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                          Level {achievement.level}
                        </span>
                      )}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                  
                  {achievement.earned ? (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600 font-medium flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Earned
                      </span>
                      {achievement.earned_date && (
                        <span className="text-gray-500">
                          {new Date(achievement.earned_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="w-full">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{achievement.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-blue-600 h-1.5 rounded-full"
                          style={{ width: `${achievement.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 text-center py-10 text-gray-500">
            {activeTab === 'earned'
              ? "You haven't earned any achievements yet. Keep working toward your fitness goals!"
              : "No achievements in progress. Check back later for more challenges!"}
          </div>
        )}
      </div>
      
      {/* Rewards and Levels Section */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Rewards Program</h3>
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl mb-2 text-purple-600">🏆</div>
              <h4 className="font-medium mb-1">Level Rewards</h4>
              <p className="text-sm text-gray-600">Unlock special features and content as you level up</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl mb-2 text-pink-600">🎯</div>
              <h4 className="font-medium mb-1">Achievement Badges</h4>
              <p className="text-sm text-gray-600">Earn badges to showcase on your profile</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl mb-2 text-blue-600">🚀</div>
              <h4 className="font-medium mb-1">Streak Bonuses</h4>
              <p className="text-sm text-gray-600">Maintain your fitness streaks for bonus rewards</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Achievements;
