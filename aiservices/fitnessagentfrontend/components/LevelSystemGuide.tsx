import React, { useState } from 'react';

interface LevelSystemGuideProps {
  onClose: () => void;
}

const LevelSystemGuide: React.FC<LevelSystemGuideProps> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
  
  const goToNextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };
  
  const goToPrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-xl font-bold">Fitness Gamification Guide</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <div className="p-6">
          {/* Step 1: Introduction */}
          {currentStep === 1 && (
            <div>
              <h4 className="text-2xl font-bold text-blue-600 mb-4">Welcome to Your Fitness Journey!</h4>
              <div className="mb-6">
                <p className="text-lg mb-4">
                  We've transformed your fitness experience into an exciting adventure with levels, achievements, and rewards!
                </p>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                  <p className="font-medium">Why Gamification?</p>
                  <p>Gamification makes fitness more engaging and motivating. By adding elements like points, levels, and achievements, 
                  you'll stay motivated and have more fun reaching your fitness goals.</p>
                </div>
                <div className="flex items-center mb-6">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full p-3 mr-4">
                    <div className="text-white text-xl font-bold">5</div>
                  </div>
                  <p>You're currently at <span className="font-bold">Level 5</span> with exciting rewards waiting for you!</p>
                </div>
                <p className="text-lg">
                  In this guide, we'll explain how the level system works and how you can earn rewards.
                </p>
              </div>
              
              <div className="flex justify-center mb-6">
                <img 
                  src="https://placehold.co/600x300/e2e8f0/1e40af?text=Fitness+Gamification" 
                  alt="Fitness Gamification" 
                  className="rounded-lg shadow-md"
                />
              </div>
            </div>
          )}
          
          {/* Step 2: Earning XP */}
          {currentStep === 2 && (
            <div>
              <h4 className="text-2xl font-bold text-green-600 mb-4">Earning Experience Points (XP)</h4>
              
              <p className="text-lg mb-4">
                Experience Points (XP) are the core of your fitness progression. Earn XP by completing various activities:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">💪</span>
                    <h5 className="text-lg font-bold">Workout Activities</h5>
                  </div>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex justify-between">
                      <span>Complete a workout</span>
                      <span className="font-bold text-green-600">+50 XP</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Exercise streak (3+ days)</span>
                      <span className="font-bold text-green-600">+100 XP</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Try a new exercise</span>
                      <span className="font-bold text-green-600">+30 XP</span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">🎯</span>
                    <h5 className="text-lg font-bold">Goal Completion</h5>
                  </div>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex justify-between">
                      <span>Complete any goal</span>
                      <span className="font-bold text-green-600">+200 XP</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Complete a milestone</span>
                      <span className="font-bold text-green-600">+50 XP</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Exceed a goal target</span>
                      <span className="font-bold text-green-600">+100 XP bonus</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                <p className="font-medium text-yellow-800">Pro Tip:</p>
                <p className="text-yellow-700">
                  Maintain activity streaks for bonus XP multipliers! The longer your streak, the more XP you'll earn for each activity.
                </p>
              </div>
              
              <p className="text-lg">
                Check out the <span className="font-medium text-blue-600">Ways to Earn XP</span> section for a complete list of activities and their XP values.
              </p>
            </div>
          )}
          
          {/* Step 3: Levels and Progression */}
          {currentStep === 3 && (
            <div>
              <h4 className="text-2xl font-bold text-purple-600 mb-4">Levels and Progression</h4>
              
              <p className="text-lg mb-4">
                As you earn XP, you'll progress through levels. Each level unlocks new rewards and features!
              </p>
              
              <div className="mb-6 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <h5 className="font-bold text-lg mb-2">How Levels Work:</h5>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-purple-500 mr-2">•</span>
                    <span><strong>Level 1:</strong> Everyone starts here (1,000 XP to reach Level 2)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-500 mr-2">•</span>
                    <span><strong>XP Required:</strong> The XP needed for each new level increases by 250 XP</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-500 mr-2">•</span>
                    <span><strong>Current Level:</strong> You're at Level 5 (1,240/1,500 XP toward Level 6)</span>
                  </li>
                </ul>
              </div>
              
              <div className="flex justify-center mb-6">
                <div className="w-full max-w-md bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl p-4">
                  <h5 className="font-bold text-center mb-3">Level Progression</h5>
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5, 6, 7].map(lvl => (
                      <div key={lvl} className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                          lvl === 5 ? 'bg-purple-600 text-white ring-2 ring-purple-300' :
                          lvl < 5 ? 'bg-green-500 text-white' : 'bg-gray-200'
                        }`}>
                          {lvl}
                        </div>
                        <div className="flex-1">
                          <div className="h-2 bg-gray-200 rounded-full">
                            <div className={`h-2 rounded-full ${
                              lvl < 5 ? 'bg-green-500' :
                              lvl === 5 ? 'bg-purple-600' : 'bg-gray-200'
                            }`} style={{ width: lvl === 5 ? '83%' : lvl < 5 ? '100%' : '0%' }}></div>
                          </div>
                        </div>
                        <div className="ml-3 w-24 text-right">
                          {lvl === 5 ? (
                            <span className="text-sm font-medium text-purple-600">1,240/1,500 XP</span>
                          ) : (
                            <span className="text-sm text-gray-600">
                              {lvl < 5 ? 'Completed' : `Level ${lvl}`}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-center font-medium text-blue-800">
                  You need <span className="font-bold">260 XP</span> more to reach Level 6!
                </p>
              </div>
            </div>
          )}
          
          {/* Step 4: Rewards and Benefits */}
          {currentStep === 4 && (
            <div>
              <h4 className="text-2xl font-bold text-amber-600 mb-4">Rewards and Benefits</h4>
              
              <p className="text-lg mb-4">
                Each level you reach unlocks new rewards and benefits to enhance your fitness experience!
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h5 className="font-bold text-lg mb-3">Reward Types</h5>
                  <ul className="space-y-3">
                    <li className="flex items-center bg-white p-3 rounded-lg border border-gray-200">
                      <span className="text-2xl mr-3">🏅</span>
                      <div>
                        <p className="font-medium">Badges</p>
                        <p className="text-sm text-gray-600">Special profile badges to showcase your achievements</p>
                      </div>
                    </li>
                    <li className="flex items-center bg-white p-3 rounded-lg border border-gray-200">
                      <span className="text-2xl mr-3">⭐</span>
                      <div>
                        <p className="font-medium">Feature Unlocks</p>
                        <p className="text-sm text-gray-600">Access to premium features and workout options</p>
                      </div>
                    </li>
                    <li className="flex items-center bg-white p-3 rounded-lg border border-gray-200">
                      <span className="text-2xl mr-3">💰</span>
                      <div>
                        <p className="font-medium">Discounts</p>
                        <p className="text-sm text-gray-600">Special offers on fitness products and services</p>
                      </div>
                    </li>
                    <li className="flex items-center bg-white p-3 rounded-lg border border-gray-200">
                      <span className="text-2xl mr-3">📚</span>
                      <div>
                        <p className="font-medium">Premium Content</p>
                        <p className="text-sm text-gray-600">Exclusive workout programs and nutrition guides</p>
                      </div>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h5 className="font-bold text-lg mb-3">Your Current Rewards</h5>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
                    <div className="p-3 bg-green-50 rounded-lg border border-green-100 flex items-center">
                      <div className="bg-green-100 p-2 rounded-full mr-3">
                        <span className="text-xl">✓</span>
                      </div>
                      <div className="flex-1">
                        <h6 className="font-medium">Beginner Badge</h6>
                        <p className="text-sm text-gray-600">You've started your fitness journey!</p>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-green-50 rounded-lg border border-green-100 flex items-center">
                      <div className="bg-green-100 p-2 rounded-full mr-3">
                        <span className="text-xl">✓</span>
                      </div>
                      <div className="flex-1">
                        <h6 className="font-medium">Custom Workout Access</h6>
                        <p className="text-sm text-gray-600">Create your own custom workouts</p>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 flex items-center">
                      <div className="bg-amber-100 p-2 rounded-full mr-3">
                        <span className="text-xl">!</span>
                      </div>
                      <div className="flex-1">
                        <h6 className="font-medium">Advanced Analytics</h6>
                        <p className="text-sm text-gray-600">Get deeper insights into your fitness progress</p>
                      </div>
                      <button className="px-3 py-1 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600">Claim</button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4">
                <p className="font-medium text-amber-800">Don't Forget!</p>
                <p className="text-amber-700">
                  You have an unclaimed reward at your current level! Visit the "Levels & Rewards" tab to claim it.
                </p>
              </div>
            </div>
          )}
          
          {/* Step 5: Medals and Achievements */}
          {currentStep === 5 && (
            <div>
              <h4 className="text-2xl font-bold text-indigo-600 mb-4">Medals and Achievements</h4>
              
              <p className="text-lg mb-4">
                Showcase your fitness accomplishments with our medal system and achievement badges!
              </p>
              
              <div className="mb-6">
                <h5 className="font-bold text-lg mb-3">Medal Tiers</h5>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  {['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'].map((tier, idx) => (
                    <div key={tier} className="flex flex-col items-center">
                      <div 
                        className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 ${
                          idx === 0 ? 'bg-amber-700' :
                          idx === 1 ? 'bg-gray-300' :
                          idx === 2 ? 'bg-amber-400' :
                          idx === 3 ? 'bg-blue-300' : 'bg-purple-300'
                        } text-white`}
                      >
                        <span className="text-2xl">🏅</span>
                      </div>
                      <p className="font-medium">{tier}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mb-6">
                <h5 className="font-bold text-lg mb-3">Achievement Categories</h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <div className="flex items-center mb-2">
                      <span className="text-2xl mr-2">💪</span>
                      <h6 className="font-medium">Strength</h6>
                    </div>
                    <p className="text-sm text-gray-600">Weightlifting and resistance training achievements</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <div className="flex items-center mb-2">
                      <span className="text-2xl mr-2">🏃</span>
                      <h6 className="font-medium">Endurance</h6>
                    </div>
                    <p className="text-sm text-gray-600">Cardio and stamina accomplishments</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <div className="flex items-center mb-2">
                      <span className="text-2xl mr-2">🔥</span>
                      <h6 className="font-medium">Consistency</h6>
                    </div>
                    <p className="text-sm text-gray-600">Streak and habit achievements</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-indigo-50 p-4 rounded-lg">
                <h5 className="font-bold mb-2">Ready to Begin?</h5>
                <p className="mb-3">Now that you understand how the system works, it's time to start earning XP, collecting achievements, and leveling up!</p>
                <div className="flex flex-wrap gap-3">
                  <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition">
                    Set a New Goal
                  </button>
                  <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition">
                    Start a Workout
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Navigation */}
        <div className="border-t border-gray-200 p-4 flex justify-between items-center">
          <div>
            {currentStep > 1 && (
              <button 
                onClick={goToPrevStep}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
              >
                Back
              </button>
            )}
          </div>
          
          <div className="flex items-center">
            {Array.from({ length: totalSteps }).map((_, idx) => (
              <div 
                key={idx}
                className={`w-2.5 h-2.5 rounded-full mx-1 ${
                  idx + 1 === currentStep 
                    ? 'bg-blue-600' 
                    : idx + 1 < currentStep
                      ? 'bg-blue-300'
                      : 'bg-gray-300'
                }`}
              ></div>
            ))}
          </div>
          
          <button 
            onClick={goToNextStep}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            {currentStep < totalSteps ? 'Next' : 'Finish'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LevelSystemGuide;
